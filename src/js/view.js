import * as yup from 'yup';
import Observer from './observer.js';

const classNames = {
  invalidRSSFormValue: 'isInvalid',
};

const urlValidationSchema = yup.string().url();

class RSSFormState {
  constructor(observer) {
    this.RSSFormState = {
      isValid: true,
      value: '',
    };
    this.observer = observer;
  }

  setState(value, isValid) {
    this.value = value;
    this.isValid = isValid;
    this.observer.notify(this);
  }
}

const onStateChange = (rssFormState, rssForm) => {
  const urlInput = rssForm.querySelector('#url-input');
  if (rssFormState.isValid) {
    urlInput.classList.remove(classNames.invalidRSSFormValue);
  } else {
    urlInput.classList.add(classNames.invalidRSSFormValue);
  }

  urlInput.value = rssFormState.value;
};

const onSubmit = (event, state) => {
  event.preventDefault();
  const data = new FormData(event.target);
  const urlFieldValue = data.get('url');
  urlValidationSchema.validate(urlFieldValue)
    .then(() => state.setState('', true))
    .catch(() => state.setState(urlFieldValue, false));
};

export default () => {
  document.addEventListener('DOMContentLoaded', () => {
    const rssForm = document.querySelector('.rss-form');

    const stateObserver = new Observer();
    stateObserver.subscribe((rssFormState) => onStateChange(rssFormState, rssForm));
    const state = new RSSFormState(stateObserver);

    rssForm.addEventListener('submit', (event) => onSubmit(event, state));
  });
}
