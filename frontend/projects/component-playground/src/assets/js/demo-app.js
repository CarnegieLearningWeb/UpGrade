// This file is for making UpGrade communicate with the demo app
if (window.self !== window.top) {
  // Execute the code if the page is inside an iframe
  // For getting UpGrade's element by ID
  const getElementById = (id) => {
    switch (id) {
      // Home
      case 'login-with-google-button':
        return document.querySelector('div.login-container button.google-sign-in-btn');
      case 'experiments-tab':
        return document.querySelectorAll('div.list-item-container a.nav-item')[0];
      case 'signout-button':
        return document.querySelector('span.mat-list-item-content a.logout-link');
      case 'add-experiment-button':
        return document.querySelectorAll('mat-card.mat-card button.mat-flat-button')[1];

      // Experiment Stepper - Overview Step
      case 'experiment-stepper-overview-name':
        return document.querySelectorAll('form.experiment-overview input.mat-input-element')[0];
      case 'experiment-stepper-overview-description':
        return document.querySelectorAll('form.experiment-overview input.mat-input-element')[1];
      case 'experiment-stepper-overview-app-context':
        return document.querySelectorAll('form.experiment-overview div.mat-select-value')[0];
      case 'experiment-stepper-overview-unit-of-assignment':
        return document.querySelectorAll('form.experiment-overview div.mat-select-value')[1];
      case 'experiment-stepper-overview-consistency-rule':
        return document.querySelectorAll('form.experiment-overview div.mat-select-value')[2];
      case 'experiment-stepper-overview-next-button':
        return document.querySelectorAll('div.new-experiment-modal button.mat-raised-button')[1];

      // Experiment Stepper - Design Step
      case 'experiment-stepper-design-add-decision-point-button':
        return document.querySelector('form.experiment-design button.add-decision-point');
      case 'experiment-stepper-design-decision-points-row1-site':
        return document.querySelectorAll('mat-table.decision-point-table input.mat-input-element')[0];
      case 'experiment-stepper-design-decision-points-row1-target':
        return document.querySelectorAll('mat-table.decision-point-table input.mat-input-element')[1];
      case 'experiment-stepper-design-decision-points-row1-exclude-if-reached':
        return document.querySelector('mat-table.decision-point-table input.mat-checkbox-input');
      case 'experiment-stepper-design-add-condition-button':
        return document.querySelector('form.experiment-design button.add-condition');
      case 'experiment-stepper-design-conditions-row1-condition':
        return document.querySelectorAll('mat-table.condition-table input.mat-input-element')[0];
      case 'experiment-stepper-design-conditions-row2-condition':
        return document.querySelectorAll('mat-table.condition-table input.mat-input-element')[3];
      case 'experiment-stepper-design-next-button':
        return document.querySelectorAll('div.new-experiment-modal button.mat-raised-button')[4];

      // Experiment Stepper - Participants Step
      case 'experiment-stepper-participants-inclusion-criteria':
        return document.querySelector('form.experiment-participants div.mat-select-value');
      case 'experiment-stepper-participants-next-button':
        return document.querySelectorAll('div.new-experiment-modal button.mat-raised-button')[7];

      // Experiment Stepper - Metrics Step
      case 'experiment-stepper-metrics-add-metric-button':
        return document.querySelector('form.metric-design button.add-metric');
      case 'experiment-stepper-metrics-metrics-row1-metric':
        return document.querySelectorAll('mat-table.metric-table input.mat-input-element')[0];
      case 'experiment-stepper-metrics-metrics-row1-statistic':
        return document.querySelectorAll('mat-table.metric-table div.mat-select-value')[0];
      case 'experiment-stepper-metrics-metrics-row1-display-name':
        return document.querySelectorAll('mat-table.metric-table input.mat-input-element')[1];
      case 'experiment-stepper-metrics-metrics-row2-metric':
        return document.querySelectorAll('mat-table.metric-table input.mat-input-element')[2];
      case 'experiment-stepper-metrics-metrics-row2-statistic':
        return document.querySelectorAll('mat-table.metric-table div.mat-select-value')[1];
      case 'experiment-stepper-metrics-metrics-row2-display-name':
        return document.querySelectorAll('mat-table.metric-table input.mat-input-element')[3];
      case 'experiment-stepper-metrics-next-button':
        return document.querySelectorAll('div.new-experiment-modal button.mat-raised-button')[10];

      // Experiment Stepper - Schedule Step
      case 'experiment-stepper-schedule-next-button':
        return document.querySelectorAll('div.new-experiment-modal button.mat-raised-button')[13];

      // Experiment Stepper - Post Rule Step
      case 'experiment-stepper-post-rule-post-rule':
        return document.querySelectorAll('form.post-experiment-rule-form div.mat-select-value')[0];
      case 'experiment-stepper-post-rule-create-button':
        return document.querySelectorAll('div.new-experiment-modal button.mat-raised-button')[16];

      // Experiment Details - Overview Tab
      case 'experiment-details-overview-status':
        return document.querySelectorAll('div.section-data span.section-data-value--editable')[0];

      // Experiment Details - Data Tab
      case 'experiment-details-data-tab':
        return document.querySelectorAll('div.mat-tab-list div.mat-tab-label')[4];

      // Change Experiment Status Modal
      case 'change-experiment-status-modal-new-status':
        return document.querySelectorAll('form.experiment-status-form div.mat-select-value')[1];
      case 'change-experiment-status-modal-save-button':
        return document.querySelectorAll('div.button-container button.mat-raised-button')[1];
    }
    console.error(`Error: The element ID "${id}" is not valid.`);
    return null;
  };

  let activeClockId = null;
  let activeWindowEvent = null;

  const removeActiveWindowEvent = () => {
    if (activeClockId) {
      clearInterval(activeClockId);
      activeClockId = null;
    }
    if (activeWindowEvent) {
      activeWindowEvent.target.removeEventListener(activeWindowEvent.type, activeWindowEvent.callback, true);
      activeWindowEvent = null;
    }
  };

  const addWindowEvent = (target, type, callback) => {
    removeActiveWindowEvent();
    if (type === 'clock') {
      activeClockId = target.setInterval(callback, 500);
      return;
    }
    target.addEventListener(type, callback, true);
    activeWindowEvent = {
      target,
      type,
      callback,
    };
  };

  const closeOpenedModals = () => {
    const modalButtonsSelector = 'div.cdk-overlay-pane button.mat-raised-button';
    const modalCloseButton = Array.from(document.querySelectorAll(modalButtonsSelector)).find(
      (elem) => elem.innerText.toLowerCase() === 'close'
    );
    if (modalCloseButton) {
      modalCloseButton.click();
      const confirmCloseButton = Array.from(document.querySelectorAll(modalButtonsSelector)).find(
        (elem) => elem.innerText.toLowerCase() === 'yes'
      );
      if (confirmCloseButton) {
        confirmCloseButton.click();
      }
    }
  };

  // A set of functions that do more than triggering an event
  const initCallFunction = {
    'set-zoom-level': (args) => {
      document.body.style.zoom = args[0];
    },
    logout: () => {
      closeOpenedModals();
      const signOutButton = getElementById('signout-button');
      if (signOutButton) {
        signOutButton.click();
      } else if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        gapi.auth2.getAuthInstance().signOut();
      }
    },
    'on-upgrade-tab-click': () => {
      if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        return closeOpenedModals();
      }
      const experimentsTab = getElementById('experiments-tab');
      experimentsTab.click();
    },
    'remove-active-window-event': () => {
      removeActiveWindowEvent();
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

  // A set of functions that require more logic than listening to an event
  const nextCallbackFunction = {
    'on-value-match': (args, onNextCall) => {
      const id = args[0];
      const property = args[1];
      const value = args[2];
      const clock = () => {
        const elem = getElementById(id);
        if (elem && property in elem && elem[property] === value) {
          removeActiveWindowEvent();
          onNextCall();
        }
      };
      addWindowEvent(window, 'clock', clock);
    },
    'on-experiment-click': (args, onNextCall) => {
      const experimentName = args[0];
      const onWindowClick = (event) => {
        const elem = Array.from(
          document.querySelectorAll('div.experiment-list-table-container a.experiment-name')
        ).find((elem) => elem.innerText === experimentName);
        if (elem && elem.contains(event.target)) {
          removeActiveWindowEvent();
          onNextCall();
        }
      };
      addWindowEvent(window, 'click', onWindowClick);
    },
  };

  // Used to detect event on element
  const nextCallback = (type, id, args, onNextCall) => {
    if (type === 'function') {
      return nextCallbackFunction[id](args, onNextCall);
    }
    const onWindowEvent = (event) => {
      const elem = getElementById(id);
      if (elem && elem.contains(event.target)) {
        removeActiveWindowEvent();
        onNextCall();
      }
    };
    addWindowEvent(window, type, onWindowEvent);
  };

  // Receive data from the demo app
  window.addEventListener('message', (event) => {
    const data = event.message || event.data;
    if (data.message === 'initCall') {
      initCall(data.type, data.id, data.args || []);
    } else if (data.message === 'nextCallback') {
      nextCallback(data.type, data.id, data.args || [], () => {
        // Send data back to the demo app
        window.parent.postMessage({ message: 'onNextCall' }, '*');
      });
    }
  });
}
