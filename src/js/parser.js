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
    title: xml.querySelector('channel > title').textContent,
    description: xml.querySelector('channel > description').textContent,
    link: xml.querySelector('channel > link').textContent,
    posts: Array.from(xml.querySelectorAll('item'))
      .map((item) => {
        const pubDate = item.querySelector('pubDate')?.textContent;
        return ({
          title: item.querySelector('title')?.textContent,
          description: item.querySelector('description')?.textContent,
          link: item.querySelector('link')?.textContent,
          pubDate: (pubDate) ? new Date(pubDate) : null,
        });
      }),
  };

  return rssFeedData;
};

export default parseTextToRssFeedData;
