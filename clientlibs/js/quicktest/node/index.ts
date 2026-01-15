// Node.js QuickTest Entry Point
// To run: npm run quicktest:node

import UpgradeClient from '../../dist/node';
import { runTests, setHTMLReporter } from '../shared/test-functions';
import { config } from './config';
import { reporter, finalizeAndOpenHTML } from './html-reporter';

async function main() {
  try {
    // Configure shared test functions to use HTML reporter
    setHTMLReporter(reporter);

    const client = new UpgradeClient(config.userId, config.hostUrl, config.context, config.options);
    await runTests(client, config);

    // Generate and open HTML report
    await finalizeAndOpenHTML();
  } catch (error) {
    console.error('Test execution failed:', error);
    reporter.log(`Test execution failed: ${(error as Error).message}`, 'error');
    reporter.updateStatus('✗ Tests failed', 'error');
    await finalizeAndOpenHTML();
  }
}

main();
