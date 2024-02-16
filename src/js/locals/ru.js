import { errorCodes } from '../model.js';

export default {
  translation: {
    feedback: {
      errors: {
        [errorCodes.ALREADY_PROCESSED_URL]: 'RSS уже существует',
        [errorCodes.INVALID_URL]: 'Ссылка должна быть валидным URL',
        [errorCodes.NETWORK_ERROR]: 'Ошибка сети',
        [errorCodes.NOT_VALID_RSS_FEED]: 'Ресурс не содержит валидный RSS',
      },
      success: 'RSS успешно загружен',
    },
    posts: 'Посты',
    postViewButton: 'Просмотр',
    feeds: 'Фиды',
    consoleErrors: {
      noHttpCode: 'There is no http_code in the response',
    },
  },
};
