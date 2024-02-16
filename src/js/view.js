/* eslint no-fallthrough: 0 */
/* eslint no-param-reassign: 0 */

import { formStatus, requestStatus } from './model.js';

const toggleInput = (state, elems) => {
  const isRequestPending = (state.requestStatus === requestStatus.PENDING);
  elems.urlInput.readonly = isRequestPending;
  elems.submitButton.disabled = isRequestPending;
};

const renderForm = (state, elems, i18n) => {
  const { status, errorCode } = state.ui.form;

  elems.feedback.classList.remove('text-danger', 'text-success');
  elems.urlInput.classList.remove('is-invalid');

  switch (status) {
    case (formStatus.SUCCESS):
      elems.rssForm.reset();
      elems.urlInput.focus();
      elems.feedback.classList.add('text-success');
      elems.feedback.textContent = i18n.t('feedback.success');
      break;
    case (formStatus.VALIDATION_FAILURE):
      elems.urlInput.classList.add('is-invalid');
    case (formStatus.FAILURE): {
      elems.feedback.classList.add('text-danger');
      elems.feedback.textContent = i18n.t(`feedback.errors.${errorCode}`);
      break;
    }
    default:
  }
};

const renderFeed = (feedData) => {
  const { title, description } = feedData;

  const feedElem = document.createElement('li');
  feedElem.className = 'list-group-item border-0 border-end-0';

  const titleElem = document.createElement('h3');
  titleElem.className = 'h6 m-0';
  titleElem.textContent = title;

  const descriptionElem = document.createElement('p');
  descriptionElem.className = 'm-0 small text-black-50';
  descriptionElem.textContent = description;

  feedElem.append(titleElem, descriptionElem);

  return feedElem;
};

const renderPost = (postData, i18n) => {
  const { title, id, link } = postData;

  const postElem = document.createElement('li');
  postElem.className = 'list-group-item d-flex justify-content-between align-items-start border-0 border-end-0';

  const linkElem = document.createElement('a');
  linkElem.className = 'fw-bold';
  linkElem.setAttribute('href', link);
  linkElem.setAttribute('rel', 'noopener noreferrer');
  linkElem.setAttribute('target', '_blank');
  linkElem.dataset.id = id;
  linkElem.textContent = title;

  const viewButtonElem = document.createElement('button');
  viewButtonElem.className = 'btn btn-outline-primary btn-sm';
  viewButtonElem.setAttribute('type', 'button');
  viewButtonElem.dataset.bsToggle = 'modal';
  viewButtonElem.dataset.bsTarget = '#modal';
  viewButtonElem.dataset.id = id;
  viewButtonElem.textContent = i18n.t('postViewButton');

  postElem.append(linkElem, viewButtonElem);

  return postElem;
};

const renderList = (container, list) => {
  container.innerHTML = '';

  const cardElem = document.createElement('div');
  cardElem.className = 'card border-0';

  const cardBodyElem = document.createElement('div');
  cardBodyElem.className = 'card-body';

  const cardTitleElem = document.createElement('h2');
  cardTitleElem.className = 'card-title h4';
  cardTitleElem.textContent = list.title;

  const listElem = document.createElement('ul');
  listElem.className = 'list-group border-0 rounded-0';

  cardElem.append(cardBodyElem, listElem);
  cardBodyElem.append(cardTitleElem);
  listElem.append(...list.items.toReversed().map((item) => list.renderItem(item)));

  container.append(cardElem);
};

const makeList = (title, items, renderItem) => ({ title, items, renderItem });

const renderFeeds = (state, elems, i18n) => {
  renderList(
    elems.feeds,
    makeList(i18n.t('feeds'), state.data.feeds, renderFeed),
  );
};

const renderPosts = (state, elems, i18n) => {
  const postsData = state.data.posts;

  if (postsData.length !== 0) {
    renderList(
      elems.posts,
      makeList(i18n.t('posts'), postsData, (data) => renderPost(data, i18n)),
    );
  }
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
    case ('data.posts'):
      renderPosts(state, elems, i18n);
      renderVisitedPosts(state, elems);
      break;
    default:
      renderAll(state, elems, i18n);
  }
};

export {
  getRenderFunc,
  getElems,
};
