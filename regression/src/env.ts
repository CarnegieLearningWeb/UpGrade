export const env = {
  local: "http://localhost:3030/api",
  dev_cl: "https://upgradeapi.qa-cli.net/api",
  staging_cl: "https://upgradeapi.qa-cli.com/api",
  prod_cl: "https://upgradeapi.carnegielearning.com/api",
  endpoints: {
    init: "/init",
    assign: "/assign",
    mark: "/mark",
    experiment: "/experiments",
    status: "/experiments/state",
  },
  // eslint-disable-next-line prettier/prettier
  authToken: 
    "",
  context: {
    ADD: "add",
    ASSIGN_PROG: "assign-prog",
  },
};
