import * as jsonfile from 'jsonfile';
import * as path from 'path';
import dockerRun from '../Dockerrun.raw.aws.json';

const content: any = dockerRun;
//content.Image.Name = `${content.Image.Name}:${process.argv[2]}`;
content.Image.Name =  `${process.argv[3]}.dkr.ecr.${process.argv[4]}.amazonaws.com/${process.argv[5]}:${process.argv[2]}`

const filePath = path.join(process.cwd(), 'Dockerrun.aws.json');
jsonfile.writeFile(filePath, content, { spaces: 2 }, err => {
  if (err === null) {
    process.exit(0);
  } else {
    console.error('Failed to generate the Dockerrun.aws.json', err);
    process.exit(1);
  }
});
