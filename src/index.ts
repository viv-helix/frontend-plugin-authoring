// Public entry point for the plugin package. The host wires these into
// pluginSlots in its env.config.jsx.
export { UnitCardContentPlugin, AddComponentPlugin } from './course-outline-unit-card';

// Release Notes feature: a full page + routes + a redux reducer. Not a plugin slot —
// the host imports these directly and wires them into its own router and store.
export { default as ReleaseNotes } from './release-notes/ReleaseNotes';
export { default as ReleaseNoteUnsubscribe } from './release-notes/unsubscribe/ReleaseNoteUnsubscribe';
export { reducer as releaseNotesReducer } from './release-notes/data/slice';
export { default as releaseNotesMessages } from './release-notes/messages';

// Games editor: a native editor for the `games` XBlock block type. Not a plugin
// slot — the host registers it generically via env.config.jsx `editorPlugins` /
// `editorPluginReducers` (see src/editors/Editor.tsx and data/redux/index.ts).
// No games-specific code lives in the host repo.
export { default as GamesEditor } from './games-editor/GameEditor';
export { reducer as gamesEditorReducer } from './games-editor/data/reducers';
