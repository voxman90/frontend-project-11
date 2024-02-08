/* eslint no-fallthrough: 0 */

import { formStatus } from './model.js';

class View {
  constructor() {
    this.elems = {
      rssForm: null,
      urlInput: null,
      submitButton: null,
      feedback: null,
      posts: null,
      feeds: null,
      modal: null,
    };
    this.controller = null;
    this.i18n = null;
  }

  init(container, controller, i18nextInstance) {
    this.elems.rssForm = container.querySelector('.rss-form');
    this.elems.urlInput = this.elems.rssForm.querySelector('#url-input');
    this.elems.submitButton = this.elems.rssForm.querySelector('button[type="submit"]');
    this.elems.feedback = container.querySelector('.feedback');
    this.elems.posts = container.querySelector('.posts');
    this.elems.feeds = container.querySelector('.feeds');
    this.elems.modal = container.querySelector('.modal');
    this.i18n = i18nextInstance;
    this.controller = controller;
  }

  render(appState) {
    this.renderForm(appState);
    const { posts, feeds } = appState.data;
    const { visitedPostsId } = appState.ui.posts;
    if (feeds.length !== 0) {
      this.renderFeeds(feeds);
      this.renderPosts(posts);
      this.renderVisitedPosts(visitedPostsId);
    }
  }

  clearForm() {
    this.elems.feedback.textContent = '';
    this.elems.feedback.classList.remove('text-danger');
    this.elems.feedback.classList.remove('text-success');
    this.elems.urlInput.classList.remove('is-invalid');
    this.elems.urlInput.focus();
  }

  renderForm(appState) {
    const { status, errorCode } = appState.ui.form;

    this.clearForm();

    switch (status) {
      case (formStatus.SUCCESS): {
        this.elems.rssForm.reset();
        this.elems.feedback.classList.add('text-success');
        this.elems.feedback.textContent = this.i18n.t('success');
        break;
      }
      case (formStatus.VALIDATION_FAILURE):
        this.elems.urlInput.classList.add('is-invalid');
      case (formStatus.FAILURE): {
        this.elems.feedback.classList.add('text-danger');
        this.elems.feedback.textContent = this.i18n.t(`errors.${errorCode}`);
        break;
      }
      default:
    }
  }

  static renderList(container, listTitle, items, renderItem) {
    const html = `
      <div class="card border-0">
        <div class="card-body">
          <h2 class="card-title h4">${listTitle}</h2>
        </div>
        <ul class="list-group border-0 rounded-0">
          ${items.reduce((str, item) => `${renderItem(item)}${str}`, '')}
        </ul>
      </div>
    `.trim();

    container.insertAdjacentHTML('afterbegin', html);
  }

  renderVisitedPosts(visitedPostsId) {
    if (visitedPostsId.length === 0) return;

    Array.from(this.elems.posts.querySelectorAll('a'))
      .forEach((aElem) => {
        if (visitedPostsId.includes(parseInt(aElem.dataset.id, 10))) {
          aElem.classList.remove('fw-bold');
          aElem.classList.add('fw-normal', 'link-secondary');
        }
      });
  }

  static renderFeed(feedData) {
    const { title, description } = feedData;

    return `
      <li class="list-group-item border-0 border-end-0">
        <h3 class="h6 m-0">${title}</h3>
        <p class="m-0 small text-black-50">${description}</p>
      </li>
    `.trim();
  }

  static renderPost(postData, i18n) {
    const { title, id, link } = postData;

    return `
      <li class="list-group-item d-flex justify-content-between align-items-start border-0 border-end-0">
        <a href="${link.toString()}" class="fw-bold" data-id="${id}" target="_blank" rel="noopener noreferrer">${title}</a>
        <button type="button" class="btn btn-outline-primary btn-sm" data-id="${id}" data-bs-toggle="modal"\
data-bs-target="#modal">${i18n.t('postViewButton')}</button>
      </li>
    `.trim();
  }

  renderFeeds(feeds) {
    this.elems.feeds.innerHTML = '';
    View.renderList(this.elems.feeds, this.i18n.t('feeds'), feeds, View.renderFeed);
  }

  renderPosts(posts) {
    this.elems.posts.innerHTML = '';
    View.renderList(this.elems.posts, this.i18n.t('posts'), posts, (data) => View.renderPost(data, this.i18n));
  }

  renderModal(appState) {
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
