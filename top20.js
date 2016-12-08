var fs = require('fs');
var system = JSON.parse(fs.readFileSync('./genetics/systems/' + process.argv[2] + '.json'));

system.population.sort(function(a, b) { return b.elo - a.elo }).slice(0, 20).forEach(function(bot) {
   console.log(bot.name, bot.elo, bot.gamesPlayed);
})