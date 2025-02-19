import figlet from 'figlet';

figlet.text(process.argv[2], (error: any, data: any) => {
  if (error) {
    return process.exit(1);
  }
  import('chalk').then((chalk) => {
    console.log(chalk.default.blue(data));
    return process.exit(0);
  });
});
