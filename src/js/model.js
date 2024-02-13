/* eslint no-console: 0 */
/* eslint no-param-reassign: 0 */

import _ from 'lodash';
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';

import { errorCodes } from './utils.js';
import parseTextToRssFeedData from './parser.js';

const FEED_UPDATE_TIMEOUT_MS = 5000;

const FEED_ID_PREFIX = 'FEED_';

const urlSchema = yup.string().required().url();

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

const validateUrl = (unknown) => urlSchema.validate(unknown)
  .then((url) => url)
  .catch(() => {
    throw errorCodes.INVALID_URL;
  });

const checkUniqnessOfUrl = (checkedUrl, state) => {
  if (state.data.feeds.some(({ url }) => url === checkedUrl)) {
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

const sendHttpRequest = (url) => axios.get(getProxiedUrl(url))
  .then((response) => {
    if (isRequestSuccessfull(response)) {
      return { ...response, url };
    }

    throw response.data.status?.http_code ?? 'There is no http_code in the response';
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
  const markedPosts = posts.reverse().map((post) => (
    { ...post, feedId, id: _.uniqueId() }
  ));

  state.data.posts.push(...markedPosts);
};

const addRssFeed = (state, feedData) => {
  const feedId = _.uniqueId(FEED_ID_PREFIX);
  const { posts, ...feedDataWithId } = { ...feedData, id: feedId };

  state.data.feeds.push(feedDataWithId);

  addPosts(state, posts, feedId);
};

const processError = (state, errorCode) => {
  if (Object.values(errorCodes).includes(errorCode)) {
    state.ui.form.errorCode = errorCode;
  }

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
};

const getWatchedState = (state, render) => onChange(state, (path, value, previousValue) => {
  switch (path) {
    case ('ui.form.submitedValue'):
      if (state.requestStatus === requestStatus.READY) {
        state.requestStatus = requestStatus.PENDING;
        render(state, 'requestStatus');

        validateUrl(value)
          .then((url) => checkUniqnessOfUrl(url, state))
          .then((url) => sendHttpRequest(url))
          .then((response) => parseResponseDataToRssFeedData(response))
          .then((rssFeedData) => addRssFeed(state, rssFeedData))
          .then(() => { state.ui.form.status = formStatus.SUCCESS; })
          .catch((errorCode) => processError(state, errorCode))
          .finally(() => {
            state.ui.form.submitedValue = null;
            state.requestStatus = requestStatus.READY;
            render(state, path);
          });
      }

      break;
    case ('ui.visitedPostsId'):
      if (_.uniq(value).length !== value.length) {
        state.ui.visitedPostsId = previousValue;
        break;
      }

      render(state, path);
      break;
    case ('ui.modal.postId'):
    default:
      render(state, path);
  }
});

const getRecentPostDate = (state, feedData) => {
  const recentPost = state.data.posts.findLast(({ feedId }) => feedId === feedData.id);
  return recentPost.pubDate;
};

const addNewPosts = (state, newFeedData, currFeedData) => {
  const currFeedRecentPostDate = getRecentPostDate(state, currFeedData);
  const newPosts = newFeedData.posts.filter(({ pubDate }) => pubDate > currFeedRecentPostDate);
  addPosts(state, newPosts, currFeedData.id);
};

const updateFeeds = (state, render) => Promise.allSettled(
  state.data.feeds.map((currFeedData) => (
    sendHttpRequest(currFeedData.url)
      .then((response) => parseResponseDataToRssFeedData(response))
      .then((feedData) => addNewPosts(state, feedData, currFeedData))
      .catch((reason) => { console.error('NETWORK_ERROR: ', reason); })
  )),
)
  .then(() => {
    render(state);
    setTimeout(() => { updateFeeds(state, render); }, FEED_UPDATE_TIMEOUT_MS);
  });

export default getWatchedState;
export {
  formStatus,
  requestStatus,
  getWatchedState,
  updateFeeds,
};
