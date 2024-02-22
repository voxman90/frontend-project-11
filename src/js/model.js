import onChange from 'on-change';

const errorCodes = {
  ALREADY_PROCESSED_URL: 'already processed url',
  INVALID_URL: 'invalid url',
  NETWORK_ERROR: 'network error',
  NOT_VALID_RSS_FEED: 'not valid rss feed',
};

const formStatus = {
  DEFAULT: 'default',
  FAILURE: 'failure',
  SUCCESS: 'success',
  VALIDATION_FAILURE: 'validation failure',
};

const requestStatus = {
  PENDING: 'pending',
  READY: 'ready',
};

const INITIAL_STATE = {
  ui: {
    form: {
      status: formStatus.DEFAULT,
      errorCode: null,
    },
    visitedPostsId: [],
    modal: {
      postId: null,
    },
  },
  requestStatus: requestStatus.READY,
  data: {
    posts: [],
    feeds: [],
  },
};

const getWatchedState = (state, render) => onChange(state, (path) => render(state, path));

export {
  errorCodes,
  formStatus,
  requestStatus,
  INITIAL_STATE,
  getWatchedState,
};
