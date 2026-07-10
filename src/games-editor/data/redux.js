/**
 * Redux surface the GameEditor consumes. Reuses the editors store's app/requests
 * selectors/actions (the component runs inside the MFE editors store) and adds the
 * plugin-owned `game` slice. The game reducer is registered into that store via
 * env.config.jsx `editorPluginReducers`, so `state.game` is available.
 */
import {
  selectors as editorSelectors,
  actions as editorActions,
  thunkActions as editorThunks,
} from 'CourseAuthoring/editors/data/redux';

import gameSelectors from './selectors';
import { actions as gameActions } from './reducers';
import gameThunks from './thunks';

export const selectors = { ...editorSelectors, game: gameSelectors };
export const actions = { ...editorActions, game: gameActions };
export const thunkActions = { ...editorThunks, game: gameThunks };
