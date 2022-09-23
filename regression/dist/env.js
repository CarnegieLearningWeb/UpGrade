export const env = {
    local: "http://localhost:3030/api",
    dev: "https://upgradeapi.qa-cli.net/api",
    staging: "https://upgradeapi.qa-cli.com/api",
    prod: "https://upgradeapi.carnegielearning.com//api",
    endpoints: {
        init: "/init",
        assign: "/assign",
        mark: "/mark",
        experiment: "/experiments",
        status: "/experiments/state",
    },
    authToken: "",
};
