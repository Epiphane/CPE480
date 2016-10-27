#!/usr/local/bin/node

var http = require('http');
var fs = require('fs');

process.argv.shift();
process.argv.shift();
if (process.argv.length < 2) {
   console.log('Usage: node run_game.js bot1command bot2command [game_id]');
   process.exit(1);
}

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
var game_id = randomString(8, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')

function timeStamp() {
// Create a date object with the current time
  var now = new Date();

// Create an array with the current month, day and time
  var date = [ now.getFullYear(), now.getMonth() + 1, now.getDate() ];

// Create an array with the current hour, minute and second
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];

// If seconds and minutes are less than 10, add a zero
  for ( var i = 1; i < 3; i++ ) {
    if ( time[i] < 10 ) {
      time[i] = "0" + time[i];
    }
  }

// Return the formatted string
  return date.join("_") + "_" + time.join("_");
}

game_id = timeStamp();

var b1 = process.argv.shift();
var b2 = process.argv.shift();

if (process.argv.length > 0) {
   game_id = process.argv[0];
}

var dir = './replay/games/' + game_id;

var currentGames = fs.readdirSync('./replay/games');
    currentGames.push(game_id);

fs.writeFile('./replay/games.js', 'var Games = ' + JSON.stringify(currentGames));

if (!fs.existsSync(dir)){
   fs.mkdirSync(dir);
}

var maps = fs.readdirSync('./maps');

var mapdir = './maps/' + maps[Math.floor(Math.random() * maps.length)];

fs.createReadStream(mapdir + '/mapdata').pipe(fs.createWriteStream(dir + '/mapdata'));

const spawn = require('child_process').spawn;
const game = spawn('java', ['-cp', 'lib/java-json.jar:bin', 'com.theaigames.game.warlight2.Warlight2', mapdir + '/map', b1, b2, dir + '/data', dir + '/map']);

game.stdout.on('data', function(data) {
   process.stdout.write(data);
});

game.stderr.on('data', function(data) {
   process.stdout.write(data);
});

game.on('close', function(code) {
  console.log("Game " + game_id + " complete");
});
