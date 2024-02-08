import i18next from 'i18next';

import Model from './model.js';
import View from './view.js';
import Controller from './controller.js';
import resources from './locals/index.js';

const i18nextConfig = {
  lng: 'ru',
  resources,
};

const app = (container) => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init(i18nextConfig)
    .then(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const controller = new Controller();
        const view = new View();
        const model = new Model();
        controller.init(model, view);
        model.init(view);
        view.init(container, controller, i18nextInstance);
        controller.addEventListeners();
      });
    });
};

export default app;
