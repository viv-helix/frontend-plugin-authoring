# Course Outline – Unit Card Plugin

This plugin adds the **"unit expand"** feature to the Course Outline page:

- an expand/collapse toggle on each unit card
- the list of components inside the unit (reorder, rename, edit, per‑component menu)
- an **"Add component"** dropdown (create or paste components)

This used to live inside the app. It now lives **outside `src/`** as a plugin, so the app
can ship without it and any deployment can turn it on/off via config.

---

## 1. The two pieces: Slot vs Plugin

| Term | Plain meaning | Who owns it |
|------|---------------|-------------|
| **Slot** | An empty "socket" placed in the app's UI where extra stuff can go | The app (`src/plugin-slots/…`) |
| **Plugin** | The thing you plug into that socket | This package + `env.config.jsx` |

> The **slot** is the wall socket. The **plugin** is the device you plug in.
> `env.config.jsx` is the note that says *which device goes in which socket*.

---

## 2. The flow (how it all connects)

```
UnitCard.tsx  (renders once per unit)
   │  passes this unit's data (unit, section, getTitleLink)
   ▼
<PluginSlot id="…course_outline_unit_card_content.v1" pluginProps={…} />   ← the SLOT
   │  framework looks up this id in config
   ▼
env.config.jsx  →  pluginSlots["…course_outline_unit_card_content.v1"]      ← the WIRING
   │  says: Insert → RenderWidget: UnitCardContentPlugin
   ▼
UnitCardContentPlugin(props = pluginProps)                                  ← the PLUGIN runs here
```

**Two questions this answers:**

1. **How does the plugin know which slot it belongs to?**
   By the **id string**. The key in `env.config.jsx` must exactly match the slot's `id`
   (or one of its `idAliases`). That string is the only link.

2. **How does it know which unit it's for?**
   From **`pluginProps`**, not config. The slot is rendered *inside every unit card*, so
   each copy passes its own `unit`. The plugin receives it as a normal React prop.

---

## 3. Where things live

| File | Job |
|------|-----|
| `src/course-outline/unit-card/UnitCard.tsx` | Renders the slots (one set per unit) |
| `src/plugin-slots/CourseOutlineUnitCardContentSlot/` | Defines the "contents" slot + its id |
| `src/plugin-slots/CourseOutlineUnitCardAddComponentSlot/` | Defines the "add component" slot + its id |
| `plugins/course-outline-unit-card/` | **This plugin** – the actual feature code |
| `env.config.jsx` (app root) | Connects slot ids → plugin components |

Inside this plugin:

| File | Job |
|------|-----|
| `UnitCardContentPlugin.tsx` | Expand toggle + component list |
| `AddComponentPlugin.tsx` | "Add component" dropdown |
| `expandStore.ts` | Shared "is this unit expanded?" state (both plugins read it) |
| `data/` `hooks.ts` `api.ts` | Fetch components / templates, create, rename, delete |
| `ComponentMenu.tsx`, `AddComponentWidget.tsx` | Sub-widgets |
| `index.ts` | Exports the two plugins |
| `package.json` | Makes this a standalone package |

---

## 4. The config (in `env.config.jsx`)

```jsx
import { PLUGIN_OPERATIONS, DIRECT_PLUGIN } from '@openedx/frontend-plugin-framework';
import { UnitCardContentPlugin, AddComponentPlugin } from '@openedx-plugins/course-outline-unit-card';

const config = {
  ...process.env,
  pluginSlots: {
    // ① this key MUST match the slot's id
    'org.openedx.frontend.authoring.course_outline_unit_card_content.v1': {
      keepDefault: true,                        // keep slot's default children (we have none)
      plugins: [{
        op: PLUGIN_OPERATIONS.Insert,           // ② add our widget into the slot
        widget: {
          id: 'course-outline-unit-expand',     // ③ unique name for this plugin
          type: DIRECT_PLUGIN,                  // ④ bundled with the app at build time
          RenderWidget: UnitCardContentPlugin,  // ⑤ the component that renders
        },
      }],
    },
    'org.openedx.frontend.authoring.course_outline_unit_card_add_component.v1': {
      keepDefault: true,
      plugins: [{
        op: PLUGIN_OPERATIONS.Insert,
        widget: { id: 'course-outline-unit-add-component', type: DIRECT_PLUGIN, RenderWidget: AddComponentPlugin },
      }],
    },
  },
};

export default config;
```

**Turn the feature off** = delete these two entries (or the whole file). The slots then render nothing.

---

## 5. How the plugin is packaged & installed

This folder is one feature of the standalone **`@edx/frontend-plugin-authoring`**
package (see the repo root `README.rst`). Its two widgets are re-exported from
`src/index.ts`, and the host wires them into slots via `env.config.jsx`.

- **Host internals** are imported through the **`CourseAuthoring`** alias (the app
  maps it to its own `src/`); host packages (react, paragon, …) are `peerDependencies`.
- **Local dev:** the host links this package from source via `module.config.js`
  (`{ moduleName: '@edx/frontend-plugin-authoring', dir: './frontend-plugin-authoring', dist: 'src' }`).
- **Production:** publish `@edx/frontend-plugin-authoring` (built to `dist/`) and depend on it normally.

See the repo root `README.rst` for the full install/build instructions.

---

## Quick glossary

- **DIRECT_PLUGIN** – plugin code is compiled into the app at build time (needs a rebuild to update).
- **pluginProps** – the data the slot hands to the plugin (here: the unit, section, etc.).
- **idAliases** – short alternative names for a slot id, also accepted as config keys.
- **peerDependencies** – "use the app's copy of these" (avoids two Reacts).
