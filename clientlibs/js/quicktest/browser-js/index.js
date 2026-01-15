// Browser JavaScript QuickTest Entry Point
// This file is loaded via script tag after config.js and shared functions

// Auto-run tests when page loads
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(async () => {
    try {
      // Debug: Check if UpgradeClient is available
      console.log('UpgradeClient available:', typeof UpgradeClient);
      console.log('UpgradeClient:', UpgradeClient);

      // Access global UpgradeClient from browser bundle
      const client = new UpgradeClient(
        config.userId,
        config.hostUrl,
        config.context,
        config.options
      );

      console.log('Client instantiated:', client);
      console.log('Client methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)));

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
