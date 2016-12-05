process.chdir('warlight2-engine');

const bestof = process.argv[2] || (console.error('Usage: node best_of X [bot1command] [bot2command]') || process.exit(1));

var gamesleft = bestof;
var p1wins = 0;
var p2wins = 0;
var ties = 0;

const spawn = require('child_process').spawn;
function runGame(i) {
   const game = spawn('node', ['run_game.js', process.argv[3] || 'node ../AI/Final/Bot.js', process.argv[4] || 'node ../AI/Final/Bot.js', 'bestof_' + i]);

   var body = '';
   var done = false;

   function finish(line) {
      var winner = line.substr(8);
      done = true;
      gamesleft --;

      if (winner === 'player1') {
         console.log('Player 1 wins!');
         p1wins ++;
      }
      else if (winner === 'player2') {
         console.log('Player 2 wins!');
         p2wins ++;
      }
      else if (winner === 'draw') {
         console.log('Tie!');
         ties ++;
      }
      else {
         console.error('Unrecognized winner');
      }

      if (p1wins > bestof / 2) {
         console.log('Player 1 wins! ' + p1wins + '-' + p2wins);
         return;
      }
      else if (p2wins > bestof / 2) {
         console.log('Player 2 wins! ' + p1wins + '-' + p2wins);
         return;  
      }
      else if (gamesleft === 0) {
         if (p1wins > p2wins) {
            console.log('Player 1 wins! ' + p1wins + '-' + p2wins);
         }
         else if (p2wins > p1wins) {
            console.log('Player 2 wins! ' + p1wins + '-' + p2wins);
         }
         else {
            console.log('Its a tie! ' + p1wins + '-' + p2wins);
         }
         return;
      }

      runGame(i + 1);
   }

   game.stdout.on('data', function(data) {
      if (done) return;

      body += data.toString();
      // process.stdout.write(data);

      body.split('\n').forEach(function(line) {
         if (line.indexOf('winner:') >= 0) {
            finish(line);
         }
      });
   });

   game.stdout.on('end', function() {
      if (done) return;

      body.split('\n').forEach(function(line) {
         if (line.indexOf('winner:') >= 0) {
            finish(line);
         }
      });
   });
}

runGame(1);