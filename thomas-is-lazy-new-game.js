process.chdir('warlight2-engine');

const spawn = require('child_process').spawn;
const game = spawn('node', ['run_game.js', process.argv[2] || 'node ../AI/Final/Bot.js', process.argv[3] || 'node ../AI/Final/Bot.js', 'onereplay']);

game.stdout.on('data', function(data) {
   process.stdout.write(data);
});

game.stderr.on('data', function(data) {
   process.stdout.write(data);
});
