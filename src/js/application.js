import i18next from 'i18next';

import {
  getWatchedState,
  updateFeeds,
  formStatus,
  requestStatus,
} from './model.js';
import { getElems, getRenderFunc } from './view.js';
import addListeners from './controller.js';
import resources from './locals/index.js';

const i18nextConfig = {
  lng: 'ru',
  resources,
};

const INITIAL_STATE = {
  ui: {
    form: {
      status: formStatus.DEFAULT,
      submitedValue: null,
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

const runApp = (container) => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init(i18nextConfig)
    .then(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const elems = getElems(container);
        const render = getRenderFunc(elems, i18nextInstance);
        const state = structuredClone(INITIAL_STATE);
        const watchedState = getWatchedState(state, render);
        addListeners(elems, watchedState);
        updateFeeds(state, render);
      });
    });
};

export default runApp;
