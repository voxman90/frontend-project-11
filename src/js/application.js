import i18next from 'i18next';

import { INITIAL_STATE, getWatchedState } from './model.js';
import getRenderFunc from './view.js';
import { addListeners, updateFeeds } from './controller.js';
import resources from './locals/index.js';

const i18nextConfig = {
  lng: 'ru',
  resources,
};

const getElems = (container) => ({
  modal: container.querySelector('.modal'),
  rssForm: container.querySelector('.rss-form'),
  urlInput: container.querySelector('#url-input'),
  submitButton: container.querySelector('.rss-form button[type="submit"]'),
  feedback: container.querySelector('.feedback'),
  posts: container.querySelector('.posts'),
  feeds: container.querySelector('.feeds'),
});

const runApp = (container) => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init(i18nextConfig)
    .then(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const state = structuredClone(INITIAL_STATE);
        const elems = getElems(container);
        const view = getRenderFunc(elems, i18nextInstance);
        const watchedState = getWatchedState(state, view, i18nextInstance);
        addListeners(elems, watchedState, i18nextInstance);
        updateFeeds(watchedState);
      });
    });
};

export default runApp;
