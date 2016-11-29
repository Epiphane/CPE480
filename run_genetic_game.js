process.chdir('warlight2-engine');

var p1 = process.argv[2].split('/');
p1 = p1[p1.length - 1];
const spawn = require('child_process').spawn;
const game = spawn('node', ['run_game.js', 'node ../AI/Final/Bot.js ' + process.argv[2], 'node ../AI/Final/Bot.js ' + process.argv[3], 'genetic_' + p1]);

game.stdout.on('data', function(data) {
   process.stdout.write(data);
});

game.stderr.on('data', function(data) {
   process.stdout.write(data);
});
