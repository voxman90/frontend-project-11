/* eslint no-console: 0 */
/* eslint no-param-reassign: 0 */

import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';

import { errorCodes } from './utils.js';

const formStatus = {
  DEFAULT: 0,
  SUCCESS: 1,
  VALIDATION_FAILURE: 2,
  FAILURE: 3,
};

const requestStatus = {
  READY: 0,
  PENDING: 1,
};

const INITIAL_STATE = {
  ui: {
    form: {
      status: formStatus.DEFAULT,
      submitedValue: null,
      errorCode: null,
    },
    posts: {
      visitedPostsId: [],
    },
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

const FEED_UPDATE_TIMEOUT_MS = 5000;

class Model {
  static #urlSchema = yup.string().required().url();

  constructor() {
    this.state = null;
    this.watchedState = null;
    this.view = null;
  }

  init(view) {
    this.state = structuredClone(INITIAL_STATE);
    this.view = view;

    this.watchedState = onChange(this.state, (path, value) => {
      switch (path) {
        case ('ui.form.submitedValue'):
          if (this.state.requestStatus === requestStatus.READY) {
            this.watchedState.requestStatus = requestStatus.PENDING;

            Model.#validateUrl(value)
              .then((url) => Model.#checkUniqnessOfUrl(url, this.#getFeedUrls()))
              .then((url) => Model.#sendHttpRequest(url))
              .then((response) => Model.#parseResponseDataToRssFeedData(response.data))
              .then((rssFeedData) => this.#addRssFeed(rssFeedData))
              .then(() => this.#setFormStatus(formStatus.SUCCESS))
              .catch((errorCode) => this.#processError(errorCode))
              .finally(() => {
                this.state.ui.form.submitedValue = null;
                this.watchedState.requestStatus = requestStatus.READY;
                this.view.render(path, this.state);
              });
          }
          break;
        case ('ui.posts.visitedPostsId'):
        case ('ui.modal.postId'):
        case ('requestStatus'):
        default:
          this.view.render(path, this.state);
      }
    });

    this.#updateFeeds();
  }

  setModalContent(postId) {
    this.watchedState.ui.modal.postId = postId;
  }

  addRssFeed(submitedUrl) {
    this.watchedState.ui.form.submitedValue = submitedUrl;
  }

  addPostToVisited(postId) {
    if (!this.state.ui.posts.visitedPostsId.includes(postId)) {
      this.watchedState.ui.posts.visitedPostsId.push(postId);
    }
  }

  static #getProxiedUrl(path) {
    const baseURL = 'https://allorigins.hexlet.app/get';
    const proxiedURL = new URL(baseURL);

    proxiedURL.searchParams.set('disableCache', true);
    proxiedURL.searchParams.set('url', path);

    return proxiedURL.toString();
  }

  static #isRequestSuccessfull = (response) => {
    const { data } = response;
    if (data.status) {
      const responseCode = data.status.http_code;
      return (responseCode >= 200 && responseCode < 300);
    }

    return Object.hasOwn(data, 'contents');
  };

  static #validateUrl(unknown) {
    return Model.#urlSchema.validate(unknown)
      .then((urlStr) => new URL(urlStr))
      .catch(() => { throw errorCodes.INVALID_URL; });
  }

  static #checkUniqnessOfUrl(urlObj, urls) {
    const isProcessedUrl = urls.some((url) => urlObj.toString() === url.toString());
    if (isProcessedUrl) {
      throw errorCodes.ALREADY_PROCESSED_URL;
    }

    return urlObj;
  }

  static #sendHttpRequest(url) {
    return axios.get(Model.#getProxiedUrl(url.toString()))
      .then((response) => {
        if (Model.#isRequestSuccessfull(response)) {
          return response;
        }

        throw response.data.status?.http_code ?? 'NETWORK ERROR';
      })
      .catch((reason) => {
        console.error(reason);
        throw errorCodes.NETWORK_ERROR;
      });
  }

  static #parseResponseDataToRssFeedData(responseData) {
    try {
      const xml = new window.DOMParser().parseFromString(responseData.contents, 'text/xml');

      const hasParserErrorOccured = xml.querySelector('parsererror');
      if (hasParserErrorOccured) {
        throw errorCodes.NOT_VALID_RSS_FEED;
      }

      const rssFeedData = {
        title: xml.querySelector('channel > title').textContent,
        description: xml.querySelector('channel > description').textContent,
        pubDate: new Date(xml.querySelector('channel > pubDate')?.textContent),
        url: new URL(responseData.status?.url ?? xml.querySelector('channel > link').textContent),
        posts: Array.from(xml.querySelectorAll('item'))
          .map((item) => ({
            title: item.querySelector('title').textContent,
            description: item.querySelector('description').textContent,
            link: new URL(item.querySelector('link').textContent),
            pubDate: new Date(item.querySelector('pubDate')?.textContent),
          })),
      };

      const lastPostDate = new Date(rssFeedData.posts.at(0)?.pubDate ?? new Date());

      if (rssFeedData.pubDate === null) {
        rssFeedData.pubDate = lastPostDate;
      }

      return { ...rssFeedData, lastPostDate };
    } catch {
      throw errorCodes.NOT_VALID_RSS_FEED;
    }
  }

  #getFeedUrls() {
    return this.state.data.feeds.map(({ url }) => url);
  }

  #getPostsCount() {
    return this.state.data.posts.length;
  }

  #getUniqueFeedId() {
    const feedIds = this.state.data.feeds.map(({ id }) => id);
    if (feedIds.length === 0) {
      return 1;
    }

    return Math.max(...feedIds) + 1;
  }

  #setFormStatus(status) {
    this.state.ui.form.status = status;
  }

  #addRssFeed(rssFeedData) {
    const feedId = this.#getUniqueFeedId();
    const { posts, ...feedData } = { ...rssFeedData, id: feedId };

    this.state.data.feeds.push(feedData);

    this.#addPosts(posts, feedId);
  }

  #addPosts(posts, feedId) {
    const uniquePostId = Math.max(0, ...this.state.data.posts.map(({ id }) => id)) + 1;
    const markedPosts = posts.reverse().map((post, i) => (
      { ...post, feedId, id: uniquePostId + i }
    ));
    this.state.data.posts.push(...markedPosts);
  }

  #updateFeeds() {
    const currPostsCount = this.#getPostsCount();
    Promise.allSettled(
      this.state.data.feeds.map((currFeedData) => (
        Model.#sendHttpRequest(currFeedData.url.toString())
          .then((response) => Model.#parseResponseDataToRssFeedData(response.data))
          .then((feedData) => this.#addNewPosts(feedData, currFeedData))
          .catch((reason) => { console.error('NETWORK_ERROR: ', reason); })
      )),
    )
      .then(() => {
        if (currPostsCount !== this.#getPostsCount()) {
          this.view.render('', this.state);
        }

        setTimeout(() => { this.#updateFeeds(); }, FEED_UPDATE_TIMEOUT_MS);
      });
  }

  #addNewPosts(newFeedData, currFeedData) {
    const { feedId, lastPostDate: currLastPostDate } = currFeedData;
    const { pubDate: newPubDate, lastPostDate: newLastPostDate } = newFeedData;

    if (newLastPostDate > currLastPostDate) {
      currFeedData.pubDate = newPubDate;
      currFeedData.lastPostDate = newLastPostDate;
      const newPosts = newFeedData.posts.filter(({ pubDate }) => pubDate > currLastPostDate);
      this.#addPosts(newPosts, feedId);
    }
  }

  #processError(errorCode) {
    if (Object.values(errorCodes).includes(errorCode)) {
      this.state.ui.form.errorCode = errorCode;
    }

    switch (errorCode) {
      case errorCodes.INVALID_URL:
      case errorCodes.ALREADY_PROCESSED_URL: {
        this.#setFormStatus(formStatus.VALIDATION_FAILURE);
        break;
      }
      case errorCodes.NOT_VALID_RSS_FEED:
      case errorCodes.NETWORK_ERROR: {
        this.#setFormStatus(formStatus.FAILURE);
        break;
      }
      default:
        console.error(errorCode);
    }
  }
}

export default Model;
export { formStatus, requestStatus };
