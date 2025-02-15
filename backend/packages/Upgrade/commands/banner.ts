import figlet from 'figlet';

figlet.text(process.argv[2], (error: any, data: any) => {
  if (error) {
    return process.exit(1);
  }
  import('chalk').then((chalk) => {
    chalk.default.blue(data);
    console.log('');
    return process.exit(0);
  });
});
