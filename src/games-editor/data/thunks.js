import { getConfig } from '@edx/frontend-platform';
import { StrictDict } from 'CourseAuthoring/editors/utils';
import { selectors as editorSelectors } from 'CourseAuthoring/editors/data/redux';

import { actions as gameActions } from './reducers';
import * as api from './api';

// Read block context (id + Studio URL) from the editors app slice at dispatch time.
const ctx = (getState) => ({
  studioEndpointUrl: editorSelectors.app.studioEndpointUrl(getState()),
  blockId: editorSelectors.app.blockId(getState()),
});

/** Load existing settings and populate the store. */
export const loadGamesSettings = () => async (dispatch, getState) => {
  try {
    const { data } = await api.getGamesSettings(ctx(getState));

    dispatch(gameActions.updateType(data.game_type || 'matching'));
    dispatch(gameActions.setShuffleStatus(data.is_shuffled !== undefined ? data.is_shuffled : true));
    dispatch(gameActions.setTimerStatus(data.has_timer !== undefined ? data.has_timer : true));

    const buildCard = (card, index) => ({
      id: `card-${Date.now()}-${index}`,
      term: card.term || '',
      term_image: card.term_image || '',
      term_image_path: card.term_image_path || '',
      term_image_alt: card.term_image_alt || '',
      definition: card.definition || '',
      definition_image: card.definition_image || '',
      definition_image_path: card.definition_image_path || '',
      definition_image_alt: card.definition_image_alt || '',
      editorOpen: true,
    });

    if (data.cards && data.cards.length > 0) {
      dispatch(gameActions.setList(data.cards.map(buildCard)));
    } else {
      dispatch(gameActions.setList([buildCard({}, 0)]));
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load game settings', error);
  }
};

const resolveImageUrl = (url) => {
  if (url && !url.startsWith('http')) { return `${getConfig().STUDIO_BASE_URL}${url}`; }
  return url;
};

/** Upload an image and store the returned URL + storage path on the card. */
export const uploadGameImage = ({ index, imageFile, imageType }) => async (dispatch, getState) => {
  try {
    const response = await api.uploadGamesImage({ ...ctx(getState), image: imageFile });
    const imageUrl = resolveImageUrl(response.data?.url);
    const filePath = response.data?.file_path || '';
    if (imageType === 'term') {
      dispatch(gameActions.updateTermImage({ index, termImage: imageUrl }));
      dispatch(gameActions.updateTermImagePath({ index, termImagePath: filePath }));
    } else if (imageType === 'definition') {
      dispatch(gameActions.updateDefinitionImage({ index, definitionImage: imageUrl }));
      dispatch(gameActions.updateDefinitionImagePath({ index, definitionImagePath: filePath }));
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Image upload failed', error);
  }
};

/** Delete an image by storage key and clear the card fields. */
export const deleteGameImage = ({ index, imageType, filePath }) => async (dispatch, getState) => {
  const clear = () => {
    if (imageType === 'term') {
      dispatch(gameActions.updateTermImage({ index, termImage: '' }));
      dispatch(gameActions.updateTermImagePath({ index, termImagePath: '' }));
    } else if (imageType === 'definition') {
      dispatch(gameActions.updateDefinitionImage({ index, definitionImage: '' }));
      dispatch(gameActions.updateDefinitionImagePath({ index, definitionImagePath: '' }));
    }
  };
  if (!filePath) { clear(); return; }
  try {
    const response = await api.deleteGamesImage({ ...ctx(getState), key: filePath });
    if (response.data?.success === false) { return; }
    clear();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Image delete failed', error);
  }
};

/** Persist the whole editor state via save_settings. */
export const saveGamesSettings = ({
  gameType, isShuffled, hasTimer, cards, onSuccess, onFailure,
}) => async (dispatch, getState) => {
  try {
    const response = await api.saveGamesSettings({
      ...ctx(getState),
      gameType,
      isShuffled,
      hasTimer,
      cards,
      title: editorSelectors.app.blockTitle(getState()),
    });
    if (onSuccess) { onSuccess(response); }
  } catch (error) {
    if (onFailure) { onFailure(error); }
  }
};

export default StrictDict({
  loadGamesSettings,
  uploadGameImage,
  deleteGameImage,
  saveGamesSettings,
});
