import 'reflect-metadata';
import 'zone.js';
import 'zone.js/testing';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();
Object.defineProperty(global, 'crypto', {
  value: {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    randomUUID: () => require('crypto').randomUUID(),
  },
});
