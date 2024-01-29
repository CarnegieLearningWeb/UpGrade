import * as jsonfile from 'jsonfile';
import * as path from 'path';

import * as tsconfig from '../tsconfig.json';

const content: any = JSON.parse(JSON.stringify(tsconfig)); // Clone tsconfig.json
content.compilerOptions.outDir = 'dist';
content.include = ['src/**/*', 'custom.d.ts'];
content.compilerOptions.paths.upgrade_types = ['./types'];
delete content.references;

const filePath = path.join(process.cwd(), 'tsconfig.build.json');
jsonfile.writeFile(filePath, content, { spaces: 2 }, (err) => {
  if (err === null) {
    process.exit(0);
  } else {
    console.error('Failed to generate the tsconfig.build.json', err);
    process.exit(1);
  }
});
