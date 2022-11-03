// This file is for making UpGrade communicate with the demo app
if (window.self !== window.top) {
  // Execute the code if the page is inside an iframe
  // For getting UpGrade's element by ID
  const getElementById = (id) => {
    switch (id) {
      case 'login-with-google-button':
        return document.querySelector('div.login-container button.google-sign-in-btn');
      case 'experiments-tab':
        return document.querySelectorAll('div.list-item-container a.nav-item')[0];
      case 'feature-flags-tab':
        return document.querySelectorAll('div.list-item-container a.nav-item')[1];
      case 'participants-tab':
        return document.querySelectorAll('div.list-item-container a.nav-item')[2];
      case 'logs-tab':
        return document.querySelectorAll('div.list-item-container a.nav-item')[3];
      case 'profile-tab':
        return document.querySelector('div.user a.profile');
      case 'signout-button':
        return document.querySelector('div.mat-list-item-content a.logout-link');
      case 'import-experiment-button':
        return document.querySelectorAll('mat-card.mat-card button.mat-flat-button')[0];
      case 'import-experiment-choose-file-button':
        return document.querySelector('div.import-experiment-modal input.file-input');
      case 'import-experiment-close-button':
        return document.querySelectorAll('div.import-experiment-modal button.mat-raised-button')[0];
      case 'import-experiment-import-button':
        return document.querySelectorAll('div.import-experiment-modal button.mat-raised-button')[1];
      case 'add-experiment-button':
        return document.querySelectorAll('mat-card.mat-card button.mat-flat-button')[1];
      case 'add-experiment-close-button':
        return document.querySelectorAll('div.new-experiment-modal button.mat-raised-button')[0];
      case 'add-experiment-next-button':
        return document.querySelectorAll('div.new-experiment-modal button.mat-raised-button')[1];
      case 'experiment-name-area-concrete-or-abstract':
        return Array.from(document.querySelectorAll('div.experiment-list-table-container a.experiment-name')).find(
          (elem) => elem.textContent.trim() === 'Area - Concrete or Abstract'
        );
      case 'experiment-detail-status':
        return document.querySelectorAll('div.section-data span.section-data-value--editable')[0];
      case 'experiment-detail-status-new-status-select':
        return document.querySelectorAll('div.mat-form-field-wrapper div.mat-form-field-flex')[5];
      case 'experiment-detail-status-new-status-select-preview':
        return document.querySelectorAll('div.mat-select-panel mat-option.mat-option')[0];
      case 'experiment-detail-status-new-status-select-scheduled':
        return document.querySelectorAll('div.mat-select-panel mat-option.mat-option')[1];
      case 'experiment-detail-status-new-status-select-enrolling':
        return document.querySelectorAll('div.mat-select-panel mat-option.mat-option')[2];
      case 'experiment-detail-status-new-status-select-cancelled':
        return document.querySelectorAll('div.mat-select-panel mat-option.mat-option')[3];
      case 'experiment-detail-status-close-button':
        return document.querySelectorAll('div.experiment-status button.modal-btn')[0];
      case 'experiment-detail-status-save-button':
        return document.querySelectorAll('div.experiment-status button.modal-btn')[1];
      case 'experiment-detail-post-experiment-rule':
        return document.querySelectorAll('div.section-data span.section-data-value--editable')[1];
      case 'experiment-detail-enrollment-time-logs':
        return document.querySelectorAll('div.section-data span.section-data-value--editable')[2];
      case 'experiment-detail-ending-criteria':
        return document.querySelector('div.end-criteria-container span.end-criteria-underline--grey');
      case 'experiment-detail-edit-button':
        return document.querySelectorAll('div.action-buttons button.mat-flat-button')[0];
      case 'experiment-detail-monitor-button':
        return document.querySelectorAll('div.action-buttons button.mat-flat-button')[1];
      case 'experiment-detail-delete-button':
        return document.querySelectorAll('div.action-buttons button.mat-flat-button')[2];
      case 'experiment-detail-export-button':
        return document.querySelectorAll('div.action-buttons button.mat-flat-button')[3];
    }
    console.error(`Error: The element ID "${id}" is not valid.`);
    return null;
  };

  // A set of functions that do more then triggering an event
  const initCallFunction = {
    'set-zoom-level': (args) => {
      document.body.style.zoom = args[0];
    },
    logout: () => {
      const elem = getElementById('signout-button');
      if (elem) {
        elem.click();
      } else if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        gapi.auth2.getAuthInstance().signOut();
      }
    },
  };

  // Used to call a function or trigger event on element
  const initCall = (type, id, args) => {
    if (type === 'function') {
      return initCallFunction[id](args);
    }
    const elem = getElementById(id);
    if (elem) {
      elem[type](...args);
    }
  };

  // Used to detect event on element
  const nextCallback = (type, id, onNextCall) => {
    const onWindowEvent = (event) => {
      const elem = getElementById(id);
      if (elem && elem.contains(event.target)) {
        window.removeEventListener(type, onWindowEvent, true);
        onNextCall();
      }
    };
    window.addEventListener(type, onWindowEvent, true);
  };

  // Receive data from the demo app
  window.addEventListener('message', (event) => {
    const data = event.message || event.data;
    if (data.message === 'initCall') {
      initCall(data.type, data.id, data.args || []);
    } else if (data.message === 'nextCallback') {
      nextCallback(data.type, data.id, () => {
        // Send data back to the demo app
        window.parent.postMessage({ message: 'onNextCall' }, '*');
      });
    }
  });
}
