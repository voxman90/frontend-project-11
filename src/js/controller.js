/* eslint no-param-reassign: 0 */

const addListeners = (elems, watchedState) => {
  elems.rssForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(elems.rssForm);
    const url = formData.get('url');
    watchedState.ui.form.submitedValue = url;
  });

  elems.posts.addEventListener('click', (e) => {
    if (['BUTTON', 'A'].includes(e.target.tagName)) {
      watchedState.ui.visitedPostsId.push(e.target.dataset.id);
    }
  });

  elems.posts.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      watchedState.ui.modal.postId = e.target.dataset.id;
    }
  });
};

export default addListeners;
