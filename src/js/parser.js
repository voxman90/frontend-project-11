import _ from 'lodash';

const parseTextToRssFeedData = (drawData) => {
  const xml = new window.DOMParser().parseFromString(drawData, 'text/xml');

  const errorNode = xml.querySelector('parsererror');
  if (errorNode) {
    throw Error(`Parse error: ${errorNode.textContent}`);
  }

  if (!xml.querySelector('rss')) {
    throw Error('Not RSS');
  }

  const rssFeedData = {
    title: _.escape(xml.querySelector('channel > title').textContent),
    description: _.escape(xml.querySelector('channel > description').textContent),
    link: xml.querySelector('channel > link').textContent,
    posts: Array.from(xml.querySelectorAll('item'))
      .map((item) => ({
        title: _.escape(item.querySelector('title')?.textContent),
        description: _.escape(item.querySelector('description')?.textContent),
        link: item.querySelector('link')?.textContent,
        pubDate: new Date(item.querySelector('pubDate')?.textContent ?? new Date()),
      })),
  };

  return rssFeedData;
};

export default parseTextToRssFeedData;
