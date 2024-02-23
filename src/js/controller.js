/* eslint no-console: 0 */
/* eslint no-param-reassign: 0 */

import _ from 'lodash';
import * as yup from 'yup';
import axios from 'axios';

import { errorCodes, formStatus, requestStatus } from './model.js';
import parseTextToRssFeedData from './parser.js';

const FEED_UPDATE_TIMEOUT_MS = 5000;

const FEED_ID_PREFIX = 'FEED_';

const urlSchema = yup.string().required().url();

const validateUrl = (unknown) => urlSchema.validate(unknown)
  .then((url) => url)
  .catch(() => {
    throw errorCodes.INVALID_URL;
  });

const checkUniqnessOfUrl = (checkedUrl, state) => {
  const isProcessedUrl = state.data.feeds.some(({ url }) => url === checkedUrl);
  if (isProcessedUrl) {
    throw errorCodes.ALREADY_PROCESSED_URL;
  }

  return checkedUrl;
};

const getProxiedUrl = (path) => {
  const baseURL = 'https://allorigins.hexlet.app/get';
  const proxiedURL = new URL(baseURL);

  proxiedURL.searchParams.set('disableCache', true);
  proxiedURL.searchParams.set('url', path);

  return proxiedURL.toString();
};

const isRequestSuccessfull = (response) => {
  const { data } = response;

  if (data.status) {
    const responseCode = data.status.http_code;
    return (responseCode >= 200 && responseCode < 300);
  }

  return Object.hasOwn(data, 'contents');
};

const sendHttpRequest = (url, i18n) => axios.get(getProxiedUrl(url))
  .then((response) => {
    if (isRequestSuccessfull(response)) {
      return { ...response, url };
    }

    throw new Error(response.data.status?.http_code ?? i18n.t('consoleErrors.noHttpCode'));
  })
  .catch((reason) => {
    console.error(reason);
    throw errorCodes.NETWORK_ERROR;
  });

const parseResponseDataToRssFeedData = (response) => {
  const { data, url } = response;

  try {
    const rssFeedData = parseTextToRssFeedData(data.contents);

    return { ...rssFeedData, url };
  } catch {
    throw errorCodes.NOT_VALID_RSS_FEED;
  }
};

const addPosts = (state, posts, feedId) => {
  const markedPosts = posts.map((post) => (
    { ...post, feedId, id: _.uniqueId() }
  )).reverse();

  state.data.posts.push(...markedPosts);
};

const addRssFeed = (state, feedData) => {
  const feedId = _.uniqueId(FEED_ID_PREFIX);
  const { posts, ...feedDataWithId } = { ...feedData, id: feedId };

  state.data.feeds.push(feedDataWithId);

  addPosts(state, posts, feedId);
};

const processError = (state, errorCode) => {
  switch (errorCode) {
    case errorCodes.INVALID_URL:
    case errorCodes.ALREADY_PROCESSED_URL: {
      state.ui.form.status = formStatus.VALIDATION_FAILURE;
      break;
    }
    case errorCodes.NOT_VALID_RSS_FEED:
    case errorCodes.NETWORK_ERROR: {
      state.ui.form.status = formStatus.FAILURE;
      break;
    }
    default:
      console.error(errorCode);
  }

  if (Object.values(errorCodes).includes(errorCode)) {
    state.ui.form.errorCode = errorCode;
  }
};

const addListeners = (elems, state, i18n) => {
  const { rssForm, posts } = elems;

  rssForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(rssForm);
    const submitedUrl = formData.get('url');

    if (state.requestStatus === requestStatus.READY) {
      state.requestStatus = requestStatus.PENDING;

      validateUrl(submitedUrl)
        .then((url) => checkUniqnessOfUrl(url, state))
        .then((url) => sendHttpRequest(url, i18n))
        .then((response) => parseResponseDataToRssFeedData(response))
        .then((rssFeedData) => {
          addRssFeed(state, rssFeedData);
          state.ui.form.status = formStatus.SUCCESS;
          state.ui.form.errorCode = null;
        })
        .catch((errorCode) => processError(state, errorCode))
        .finally(() => {
          state.requestStatus = requestStatus.READY;
        });
    }
  });

  posts.addEventListener('click', (e) => {
    if (['BUTTON', 'A'].includes(e.target.tagName)) {
      const clickedPostId = e.target.dataset.id;

      if (!state.ui.visitedPostsId.includes(clickedPostId)) {
        state.ui.visitedPostsId.push(clickedPostId);
      }
    }
  });

  posts.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const viewedPostId = e.target.dataset.id;

      state.ui.modal.postId = viewedPostId;
    }
  });
};

const getRecentPostDate = (state, feedData) => {
  const recentPost = state.data.posts.findLast(({ feedId }) => feedId === feedData.id);
  return recentPost.pubDate;
};

const findNewPostsByDate = (newFeedData, currFeedRecentPostDate) => (
  newFeedData.posts.filter(({ pubDate }) => pubDate > currFeedRecentPostDate)
);

const findNewPostsByTitle = (newFeedData, currFeedData) => {
  const currFeedDataPostsTitles = currFeedData.map(({ title }) => title);
  return newFeedData.posts.filter(({ title }) => !currFeedDataPostsTitles.includes(title));
};

const addNewPosts = (state, newFeedData, currFeedData) => {
  const currFeedRecentPostDate = getRecentPostDate(state, currFeedData);
  const newPosts = (currFeedRecentPostDate)
    ? findNewPostsByDate(newFeedData, currFeedRecentPostDate)
    : findNewPostsByTitle(newFeedData, currFeedData);

  if (newPosts.length === 0) {
    return;
  }

  addPosts(state, newPosts, currFeedData.id);
};

const updateFeeds = (state) => Promise.allSettled(
  state.data.feeds.map((currFeedData) => (
    sendHttpRequest(currFeedData.url)
      .then((response) => parseResponseDataToRssFeedData(response))
      .then((feedData) => addNewPosts(state, feedData, currFeedData))
      .catch((reason) => { console.error('NETWORK_ERROR: ', reason); })
  )),
)
  .then(() => {
    setTimeout(() => { updateFeeds(state); }, FEED_UPDATE_TIMEOUT_MS);
  });

export {
  addListeners,
  updateFeeds,
};
