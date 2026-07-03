// Public entry point for the plugin package. The host wires these into
// pluginSlots in its env.config.jsx.
export { UnitCardContentPlugin, AddComponentPlugin } from './course-outline-unit-card';

// Release Notes feature: a full page + routes + a redux reducer. Not a plugin slot —
// the host imports these directly and wires them into its own router and store.
export { default as ReleaseNotes } from './release-notes/ReleaseNotes';
export { default as ReleaseNoteUnsubscribe } from './release-notes/unsubscribe/ReleaseNoteUnsubscribe';
export { reducer as releaseNotesReducer } from './release-notes/data/slice';
export { default as releaseNotesMessages } from './release-notes/messages';
