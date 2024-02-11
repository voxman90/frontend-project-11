/* eslint no-fallthrough: 0 */
/* eslint no-param-reassign: 0 */

import { formStatus, requestStatus } from './model.js';

class View {
  #i18n;

  constructor() {
    this.elems = {
      modal: null,
      rssForm: null,
      urlInput: null,
      submitButton: null,
      feedback: null,
      posts: null,
      feeds: null,
    };
  }

  init(container, i18nextInstance) {
    this.#i18n = i18nextInstance;

    this.elems.modal = container.querySelector('.modal');
    this.elems.rssForm = container.querySelector('.rss-form');
    this.elems.urlInput = this.elems.rssForm.querySelector('#url-input');
    this.elems.submitButton = this.elems.rssForm.querySelector('button[type="submit"]');
    this.elems.feedback = container.querySelector('.feedback');
    this.elems.posts = container.querySelector('.posts');
    this.elems.feeds = container.querySelector('.feeds');
  }

  render(path, appState) {
    switch (path) {
      case ('ui.form.submitedValue'):
        this.#renderAll(appState);
        break;
      case ('requestStatus'):
        this.#toggleInput(appState);
        break;
      case ('ui.posts.visitedPostsId'):
        this.#renderVisitedPosts(appState);
        break;
      case ('ui.modal.postId'):
        this.#renderModal(appState);
        break;
      default:
        this.#renderAll(appState);
    }
  }

  static #renderList(container, list) {
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
  }

  static #renderFeed(feedData) {
    const { title, description } = feedData;

    return `
      <li class="list-group-item border-0 border-end-0">
        <h3 class="h6 m-0">${title}</h3>
        <p class="m-0 small text-black-50">${description}</p>
      </li>
    `;
  }

  static #renderPost(postData, i18n) {
    const { title, id, link } = postData;

    return `
      <li class="list-group-item d-flex justify-content-between align-items-start border-0 border-end-0">
        <a href="${link.toString()}" class="fw-bold" data-id="${id}" target="_blank" rel="noopener noreferrer">${title}</a>
        <button type="button" class="btn btn-outline-primary btn-sm" data-id="${id}" data-bs-toggle="modal"\
data-bs-target="#modal">${i18n.t('postViewButton')}</button>
      </li>
    `;
  }

  static #makeList(title, items, renderItem) {
    return ({ title, items, renderItem });
  }

  #renderAll(appState) {
    this.#renderForm(appState);

    const { feeds } = appState.data;
    if (feeds.length !== 0) {
      this.#renderFeeds(appState);
      this.#renderPosts(appState);
      this.#renderVisitedPosts(appState);
    }
  }

  #toggleInput(appState) {
    const isRequestPending = (appState.requestStatus === requestStatus.PENDING);
    this.elems.urlInput.readonly = isRequestPending;
    this.elems.submitButton.disable = isRequestPending;
  }

  #renderForm(appState) {
    const { status, errorCode } = appState.ui.form;

    this.#clearForm();

    switch (status) {
      case (formStatus.SUCCESS): {
        this.elems.rssForm.reset();
        this.elems.urlInput.focus();
        this.elems.feedback.classList.add('text-success');
        this.elems.feedback.textContent = this.#i18n.t('success');
        break;
      }
      case (formStatus.VALIDATION_FAILURE):
        this.elems.urlInput.classList.add('is-invalid');
      case (formStatus.FAILURE): {
        this.elems.feedback.classList.add('text-danger');
        this.elems.feedback.textContent = this.#i18n.t(`errors.${errorCode}`);
        break;
      }
      default:
    }
  }

  #clearForm() {
    this.elems.feedback.classList.remove('text-danger', 'text-success');
    this.elems.urlInput.classList.remove('is-invalid');
  }

  #renderVisitedPosts(appState) {
    const { visitedPostsId } = appState.ui.posts;

    if (visitedPostsId.length === 0) return;

    Array.from(this.elems.posts.querySelectorAll('a'))
      .forEach((aElem) => {
        const aElemId = parseInt(aElem.dataset.id, 10);
        if (visitedPostsId.includes(aElemId)) {
          aElem.classList.remove('fw-bold');
          aElem.classList.add('fw-normal', 'link-secondary');
        }
      });
  }

  #renderFeeds(appState) {
    View.#renderList(
      this.elems.feeds,
      View.#makeList(this.#i18n.t('feeds'), appState.data.feeds, View.#renderFeed),
    );
  }

  #renderPosts(appState) {
    View.#renderList(
      this.elems.posts,
      View.#makeList(this.#i18n.t('posts'), appState.data.posts, (data) => View.#renderPost(data, this.#i18n)),
    );
  }

  #renderModal(appState) {
    const { postId } = appState.ui.modal;
    if (postId === null) return;

    const relatedPost = appState.data.posts.find(({ id }) => id === postId);

    const { title, description, link } = relatedPost;
    this.elems.modal.querySelector('.modal-title').textContent = title;
    this.elems.modal.querySelector('.modal-body').textContent = description;
    this.elems.modal.querySelector('.modal-footer > a').setAttribute('href', link.toString());
  }
}

export default View;
