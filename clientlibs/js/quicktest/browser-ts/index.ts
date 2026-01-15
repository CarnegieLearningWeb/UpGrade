// Browser TypeScript QuickTest Entry Point
// This file compiles to plain JavaScript and is loaded via script tag
// To compile: npm run quicktest:browser-ts:build

// Declare globals (loaded from other script tags)
declare const UpgradeClient: any;
declare const runTests: any;
// Note: config is declared in config.ts, no need to declare again

// Auto-run tests when page loads
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(async () => {
    try {
      // Access global UpgradeClient from browser bundle
      const client = new UpgradeClient(config.userId, config.hostUrl, config.context, config.options);

      // Run tests using shared functions
      await runTests(client, config);
    } catch (error) {
      console.error('Failed to initialize or run tests:', error);
      const statusDiv = document.getElementById('status');
      if (statusDiv) {
        statusDiv.textContent = '✗ Failed to initialize - check console for details';
        statusDiv.className = 'status error';
      }
    }
  }, 100);
});
