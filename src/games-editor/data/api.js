import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import * as urls from 'CourseAuthoring/editors/data/services/cms/urls';

/**
 * Games editor data layer — calls the games XBlock's own handlers directly.
 * (The MFE's cms/api games functions were removed; the plugin owns them now.)
 */
const client = () => getAuthenticatedHttpClient();

export const getGamesSettings = ({ studioEndpointUrl, blockId }) => client().post(
  urls.xblockHandler({ studioEndpointUrl, blockId, handlerName: 'get_settings' }),
  {},
);

export const uploadGamesImage = ({ studioEndpointUrl, blockId, image }) => {
  const data = new FormData();
  data.append('file', image);
  return client().post(
    urls.xblockHandler({ studioEndpointUrl, blockId, handlerName: 'upload_image' }),
    data,
  );
};

export const deleteGamesImage = ({ studioEndpointUrl, blockId, key }) => client().post(
  urls.xblockHandler({ studioEndpointUrl, blockId, handlerName: 'delete_image_handler' }),
  { key },
);

export const saveGamesSettings = ({
  studioEndpointUrl, blockId, gameType, isShuffled, hasTimer, cards, title,
}) => {
  const formattedCards = cards.map((card, index) => {
    const base = {
      term: card.term || '',
      definition: card.definition || '',
      order: index + 1,
    };
    if (gameType === 'flashcards') {
      return {
        ...base,
        term_image: card.term_image || '',
        term_image_alt: card.term_image_alt || '',
        definition_image: card.definition_image || '',
        definition_image_alt: card.definition_image_alt || '',
      };
    }
    return base;
  });

  const payload = {
    display_name: title,
    game_type: gameType,
    is_shuffled: isShuffled,
    cards: formattedCards,
  };
  if (gameType === 'matching') { payload.has_timer = hasTimer; }

  return client().post(
    urls.xblockHandler({ studioEndpointUrl, blockId, handlerName: 'save_settings' }),
    payload,
  );
};
