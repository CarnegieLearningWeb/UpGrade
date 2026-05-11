// ---------------------------------------------------------------------------
// Global quicktest defaults.
// Edit this file to add environments or change the default context.
// ---------------------------------------------------------------------------

export const QUICKTEST_DEFAULTS = {
  /** The context that will be pre-selected as "default" in the wizard. */
  defaultContext: 'upgrade-internal',

  /**
   * Host URLs shown as choices in the wizard.
   * The first entry is treated as the default selection.
   */
  hostUrls: [
    'http://localhost:3030',
    'https://apps.qa-cli.net/upgrade-service',
    'https://apps.qa-cli.com/upgrade-service',
  ],
};
