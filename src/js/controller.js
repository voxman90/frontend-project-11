class Controller {
  constructor() {
    this.model = null;
    this.view = null;
  }

  init(model, view) {
    this.model = model;
    this.view = view;
  }

  addEventListeners() {
    const { elems } = this.view;

    elems.rssForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(elems.rssForm);
      const url = formData.get('url');
      this.model.addRssFeed(url);
    });

    elems.posts.addEventListener('click', (e) => {
      switch (e.target.tagName) {
        case 'BUTTON': {
          const postId = parseInt(e.target.dataset.id, 10);
          this.model.addPostToVisited(postId);
          this.model.setModalContent(postId);
          break;
        }
        case 'A': {
          const postId = parseInt(e.target.dataset.id, 10);
          this.model.addPostToVisited(postId);
          break;
        }
        default:
      }
    });
  }
}

export default Controller;
