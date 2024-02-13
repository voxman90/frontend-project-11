/* eslint no-fallthrough: 0 */
/* eslint no-param-reassign: 0 */

import { formStatus, requestStatus } from './model.js';

const clearForm = (elems) => {
  elems.feedback.classList.remove('text-danger', 'text-success');
  elems.urlInput.classList.remove('is-invalid');
};

const toggleInput = (state, elems) => {
  const isRequestPending = (state.requestStatus === requestStatus.PENDING);
  elems.urlInput.readonly = isRequestPending;
  elems.submitButton.disable = isRequestPending;
};

const renderForm = (state, elems, i18n) => {
  const { status, errorCode } = state.ui.form;

  clearForm(elems);

  switch (status) {
    case (formStatus.SUCCESS): {
      elems.rssForm.reset();
      elems.urlInput.focus();
      elems.feedback.classList.add('text-success');
      elems.feedback.textContent = i18n.t('success');
      break;
    }
    case (formStatus.VALIDATION_FAILURE):
      elems.urlInput.classList.add('is-invalid');
    case (formStatus.FAILURE): {
      elems.feedback.classList.add('text-danger');
      elems.feedback.textContent = i18n.t(`errors.${errorCode}`);
      break;
    }
    default:
  }
};

const renderFeed = (feedData) => {
  const { title, description } = feedData;

  return `
    <li class="list-group-item border-0 border-end-0">
      <h3 class="h6 m-0">${title}</h3>
      <p class="m-0 small text-black-50">${description}</p>
    </li>
  `;
};

const renderPost = (postData, i18n) => {
  const { title, id, link } = postData;

  return `
    <li class="list-group-item d-flex justify-content-between align-items-start border-0 border-end-0">
      <a href="${link}" class="fw-bold" data-id="${id}" target="_blank" rel="noopener noreferrer">${title}</a>
      <button type="button" class="btn btn-outline-primary btn-sm" data-id="${id}" data-bs-toggle="modal"\
data-bs-target="#modal">${i18n.t('postViewButton')}</button>
    </li>
  `;
};

const renderList = (container, list) => {
  container.innerHTML = '';

  const html = `
    <div class="card border-0">
      <div class="card-body">
        <h2 class="card-title h4">${list.title}</h2>
      </div>
      <ul class="list-group border-0 rounded-0">
        ${list.items.reduce((str, item) => `${list.renderItem(item)}${str}`, '')}
      </ul>
    </div>
  `;

  container.insertAdjacentHTML('afterbegin', html);
};

const makeList = (title, items, renderItem) => ({ title, items, renderItem });

const renderFeeds = (state, elems, i18n) => {
  renderList(
    elems.feeds,
    makeList(i18n.t('feeds'), state.data.feeds, renderFeed),
  );
};

const renderPosts = (state, elems, i18n) => {
  renderList(
    elems.posts,
    makeList(i18n.t('posts'), state.data.posts, (data) => renderPost(data, i18n)),
  );
};

const renderVisitedPosts = (state, elems) => {
  const { visitedPostsId } = state.ui;

  Array.from(elems.posts.querySelectorAll('a'))
    .forEach((aElem) => {
      const aElemId = aElem.dataset.id;

      if (visitedPostsId.includes(aElemId)) {
        aElem.classList.remove('fw-bold');
        aElem.classList.add('fw-normal', 'link-secondary');
      }
    });
};

const renderAll = (state, elems, i18n) => {
  renderForm(state, elems, i18n);

  if (state.data.feeds.length !== 0) {
    renderFeeds(state, elems, i18n);
    renderPosts(state, elems, i18n);
    renderVisitedPosts(state, elems);
  }
};

const renderModal = (state, elems) => {
  const relatedPost = state.data.posts.find(({ id }) => id === state.ui.modal.postId);

  const { title, description, link } = relatedPost;
  elems.modal.querySelector('.modal-title').textContent = title;
  elems.modal.querySelector('.modal-body').textContent = description;
  elems.modal.querySelector('.modal-footer > a').setAttribute('href', link);
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

const getRenderFunc = (elems, i18n) => (state, path) => {
  switch (path) {
    case ('ui.form.submitedValue'):
      renderAll(state, elems, i18n);
      break;
    case ('requestStatus'):
      toggleInput(state, elems, i18n);
      break;
    case ('ui.visitedPostsId'):
      renderVisitedPosts(state, elems, i18n);
      break;
    case ('ui.modal.postId'):
      renderModal(state, elems, i18n);
      break;
    default:
      renderAll(state, elems, i18n);
  }
};

export {
  getRenderFunc,
  getElems,
};
