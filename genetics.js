var fs = require('fs');
var spawn = require('child_process').spawn;

Array.prototype.shuffle = function() {
  var i = this.length, j, temp;
  if ( i == 0 ) return this;
  while ( --i ) {
     j = Math.floor( Math.random() * ( i + 1 ) );
     temp = this[i];
     this[i] = this[j];
     this[j] = temp;
  }
  return this;
}

function readJSON(filename) {
   if (!fs.existsSync('genetics/' + filename + '.json'))
      return null;
   return JSON.parse(fs.readFileSync('genetics/' + filename + '.json', 'utf8'));
}

function writeJSON(filename, json) {
   return fs.writeFileSync('genetics/' + filename + '.json', JSON.stringify(json));
}

var exampleChromosome = readJSON('example');
function recursiveRandomJSON(json) {
   var randomCopy = {};

   for (var key in json) {
      if (typeof(json[key]) === 'object')
         randomCopy[key] = recursiveRandomJSON(json[key]);
      else if (typeof(json[key]) === 'number')
         randomCopy[key] = Math.random() * 20 - 10;
      else
         console.log(key, typeof(json[key]));
   }

   return randomCopy;
}

function writeRandomChromosome(system_name, gen, child) {
   var chromosome = recursiveRandomJSON(exampleChromosome);

   if (!fs.existsSync('./genetics/' + system_name + '/gen_' + gen))
      fs.mkdirSync('./genetics/' + system_name + '/gen_' + gen);

   writeJSON(system_name + '/gen_' + gen + '/gen_' + gen + '_child_' + child, chromosome);
}

function getExistingChromosomeNames(system_name, gen) {
   if (!fs.existsSync('./genetics/' + system_name + '/gen_' + gen))
      fs.mkdirSync('./genetics/' + system_name + '/gen_' + gen);
   return fs.readdirSync('./genetics/' + system_name + '/gen_' + gen);
}

function getChromosome(system_name, gen, child_name) {
   return readJSON(system_name + '/gen_' + gen + '/' + child_name);
}

// States:
// Playing (# games completed), pruning, breeding

console.log('Initializing Team Get Off My Lawn\'s Genetic Algorithm Runner (GAR)...');

var POPULATION_SIZE = 60;

var system_name = process.argv[2] || 'default';
var system = readJSON('systems/' + system_name) || { 
   name: system_name, 
   generation: 0,
   population: [],
   queue: []
};
var dirname = './genetics/' + system.name;

function saveSystem() {
   writeJSON('systems/' + system.name, system);
}

var fightQueue = [];
var MAX_FIGHTS_IN_PROGRESS = 1;
var fightsInProgress = 0;
function runGeneration(system, callback) {
   var system_name = system.name;
   var gen = system.generation;
   var queue = system.queue;

   system.population.forEach(function(pop) { pop.inProgress = false; });

   var inProgress = 0;
   function next() {
      if (queue.length === 0) {
         if (inProgress === 0)
            callback();
         return;
      }
      console.log(queue.length + ' games remaining');

      var index = 0;
      var children = queue[index].map(function(id) {
         return system.population[id];
      });
      while (children[0].inProgress || children[1].inProgress) {
         if (++index >= queue.length)
            return;

         children = queue[index].map(function(id) {
            return system.population[id];
         });
      }
      var args = ['run_genetic_game.js', system_name + '/gen_' + gen + '/' + children[0].name, system_name + '/gen_' + gen + '/' + children[1].name];

      inProgress ++;
      children[0].inProgress = children[1].inProgress = true;
      var game = spawn('node', args);
      var body = '';
      var done = false;

      function finish(line) {
         var winner = line.substr(8);
         done = true;
         inProgress --;
         children[0].inProgress = children[1].inProgress = false;
         children[0].gamesPlayed ++;
         children[1].gamesPlayed ++;

         queue.splice(index, 1);
         saveSystem();
         next();

         var victor, loser;

         if (winner === 'player1') {
            victor = children[0];
            loser = children[1];
            console.log(victor.name + ' beat ' + loser.name);
         }
         else if (winner === 'player2') {
            victor = children[1];
            loser = children[0];
            console.log(victor.name + ' beat ' + loser.name);
         }
         else if (winner === 'draw') {
            console.log(children[1].name + ' tied with ' + children[0].name);
            return;
         }
         else {
            console.log('Unrecognized winner:', winner);
         }

         var dscore = 10;

         victor.elo += dscore;
         loser.elo -= dscore;
      }

      game.stdout.on('data', function(data) {
         if (done) return;

         body += data.toString();

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

   for (var i = 0; i < MAX_FIGHTS_IN_PROGRESS; i ++)
      next();
}

if (system.population.length === 0) {

   // First gen is different
   if (system.generation === 0) {
      // Create random population
      var existing = getExistingChromosomeNames(system.name, 0);

      for (var i = existing.length; i < POPULATION_SIZE; i ++) {
         writeRandomChromosome(system.name, 0, i);
      }
   }
   else {

   }

   system.population = getExistingChromosomeNames(system.name, system.generation).map(function(name) {
      if (name.indexOf('.json') >= 0)
         name = name.substr(0, name.length - 5);

      return {
         name: name,
         elo: 1200,
         gamesPlayed: 0
      }
   });

   // Create a queue of games
   var queue = [];
   for (var i in system.population) {
      if (!system.population.hasOwnProperty(i))
         continue;

      // Pick 20 random opponents
      var opps = [];
      for (var j in system.population) {
         if (!system.population.hasOwnProperty(j))
            continue;

         if (i === j) 
            continue;
         opps.push(j);
      }
      opps.shuffle();

      for (var j = 0; j < 20; j ++) {
         queue.push([parseInt(i), parseInt(opps[j])]);
      }
   }

   queue.shuffle();

   system.queue = queue;
   saveSystem();
}
else {

}

runGeneration(system);

console.log('Done.');