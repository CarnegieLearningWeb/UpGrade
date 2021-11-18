// This file is for making UpGrade communicate with the Demo App

// Execute the code if the page is inside an iframe
if (window.self !== window.top) {
    const demoAppURL = "http://localhost:8080";

    // Receive messages from the parent window (Demo App)
    window.addEventListener("message", (event) => {
        if (event.origin !== demoAppURL) {
            return;
        }
        const data = event.message || event.data;
        switch (data.message) {
            case "setZoomLevel":
                document.body.style.zoom = data.value;
                break;
            case "logout":
                if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
                    gapi.auth2.getAuthInstance().signOut();
                }
                break;
            case "clickExperimentsTab":
                const experimentsTab = document.querySelectorAll("div.list-item-container a.nav-item")[0];
                if (experimentsTab) {
                    experimentsTab.click();
                }
                break;
        }
    });
    // Detect click events
    window.addEventListener("click", (event) => {
        // Store the list of clickable elements in the current page
        let elements = [];
        const pathname = new URL(window.location.href).pathname;
        if (pathname.startsWith("/home/detail")) {
        }
        else if (pathname.startsWith("/home")) {
            elements = [
                {
                    name: "importExperiment",
                    query: document.querySelectorAll("div.header button.mat-flat-button")[0]
                },
                {
                    name: "importExperimentChooseFile",
                    query: document.querySelector("div.import-experiment-modal input.file-input")
                },
                {
                    name: "importExperimentClose",
                    query: document.querySelectorAll("div.import-experiment-modal button.mat-raised-button")[0]
                },
                {
                    name: "importExperimentImport",
                    query: document.querySelectorAll("div.import-experiment-modal button.mat-raised-button")[1]
                },
                {
                    name: "addExperiment",
                    query: document.querySelectorAll("div.header button.mat-flat-button")[1]
                },
                {
                    name: "addExperimentClose",
                    query: document.querySelectorAll("div.new-experiment-modal button.mat-raised-button")[0]
                },
                {
                    name: "addExperimentNext",
                    query: document.querySelectorAll("div.new-experiment-modal button.mat-raised-button")[1]
                }
            ];
        }
        else if (pathname.startsWith("/login")) {
            elements = [
                {
                    name: "LoginWithGoogle",
                    query: document.querySelector("div.login-container button.google-sign-in-btn")
                }
            ];
        }

        // Detect if any clickable element is clicked, and send its name to the parent window (Demo App)
        for (const element of elements) {
            if (element.query && element.query.contains(event.target)) {
                window.parent.postMessage({ message: "fromUpgrade", value: element.name }, demoAppURL);
                break;
            }
        }
    });
}
