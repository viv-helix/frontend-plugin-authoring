frontend-plugin-authoring
#########################

Purpose
*******

This repository holds **frontend plugins for**
`frontend-app-authoring <https://github.com/openedx/frontend-app-authoring>`_.

The plugin code lives here — **not** in the app repo. The app loads these plugins
through its ``env.config.jsx`` using the
`frontend-plugin-framework <https://github.com/openedx/frontend-plugin-framework>`_.

Plugins
*******

Each folder under ``src/`` is a feature that exports one or more plugin widgets
from ``src/index.js``:

============================  ==================================================
Export                        Slot it fills (in frontend-app-authoring)
============================  ==================================================
``UnitCardContentPlugin``     ``course_outline_unit_card_content.v1``
``AddComponentPlugin``        ``course_outline_unit_card_add_component.v1``
============================  ==================================================

Together they provide the Course Outline "unit expand" experience (inline
component list, reorder/rename/edit, and an "add component" dropdown).

Using these plugins in the host app
***********************************

**1. Development (local source, no build needed)** — add a ``module.config.js``
to the root of ``frontend-app-authoring`` pointing at this checkout::

    module.exports = {
      localModules: [
        {
          moduleName: '@edx/frontend-plugin-authoring',
          dir: './frontend-plugin-authoring',
          dist: 'src',
        },
      ],
    };

**2. Wire the widgets into slots** in the host's ``env.config.jsx``::

    import { PLUGIN_OPERATIONS, DIRECT_PLUGIN } from '@openedx/frontend-plugin-framework';
    import { UnitCardContentPlugin, AddComponentPlugin } from '@edx/frontend-plugin-authoring';

    const config = {
      pluginSlots: {
        'org.openedx.frontend.authoring.course_outline_unit_card_content.v1': {
          plugins: [{ op: PLUGIN_OPERATIONS.Insert, widget: { id: 'unit-expand', type: DIRECT_PLUGIN, RenderWidget: UnitCardContentPlugin } }],
        },
        'org.openedx.frontend.authoring.course_outline_unit_card_add_component.v1': {
          plugins: [{ op: PLUGIN_OPERATIONS.Insert, widget: { id: 'unit-add-component', type: DIRECT_PLUGIN, RenderWidget: AddComponentPlugin } }],
        },
      },
    };
    export default config;

**3. Production** — publish this package and depend on it normally::

    npm install @edx/frontend-plugin-authoring

Notes
*****

* Plugins reach into the host app via the ``CourseAuthoring`` import alias (the
  host maps it to its own ``src/``). Host packages (``react``, ``@openedx/paragon``,
  ``@edx/frontend-platform`` …) are ``peerDependencies`` so there is a single copy.
* ``npm run build`` transpiles ``src/`` to ``dist/`` with Babel (TypeScript types
  are stripped); ``main`` is ``dist/index.js``.

Getting Help
************

Open an issue on this repository's GitHub tracker.
