class Observer {
  constructor() {
    this.observers = [];
  }

  subscribe(fn) {
    if (!this.observers.includes(fn)) {
      this.observers.push(fn);
    }
  }

  unsubscribe(fn) {
    this.observers = this.observers.filter((observer) => observer !== fn);
  }

  notify(data) {
    this.observers.forEach((observer) => observer(data));
  }
};

export default Observer;
