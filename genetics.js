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
   return fs.writeFileSync('genetics/' + filename + '.json', JSON.stringify(json, null, 2));
}

function merge(original, json) {
   if (typeof(original) !== 'object')
      original = {};

   for (var key in json) {
      if (typeof(json[key]) === 'object')
         original[key] = merge(original[key], json[key]);
      else
         original[key] = json[key];
   }

   return original;
}

function writeChromosome(filename, json) {
   var chromosome = merge(recursiveRandomJSON(exampleChromosome), json);
   // console.log(chromosome);
   // process.exit(0);

   writeJSON(filename, chromosome);
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
   chromosome.metadata = {parent: null, expectedElo: 1200};

   if (!fs.existsSync('./genetics/' + system_name + '/gen_' + gen))
      fs.mkdirSync('./genetics/' + system_name + '/gen_' + gen);

   writeChromosome(system_name + '/gen_' + gen + '/gen_' + gen + '_child_' + child, chromosome);
}

var PERCENT_MUTATE = 0.15;
function maybeMutate(property) {
   if (Math.random() < PERCENT_MUTATE) {
      console.log('Mutating by', property * (Math.random() - 0.5));
      property += property * (Math.random() - 0.5);
   }
   return property;
}

function produceOffspring(parent1, parent2) {
   var topLevel = Object.keys(parent1);
   var metaNdx = topLevel.indexOf('metadata');
   if (metaNdx >= 0)
      topLevel.splice(metaNdx, 1);

   var offspring = {};
   topLevel.forEach(function(key) {
      var keys = Object.keys(parent1[key]);

      var a = keys.slice(0, Math.floor(keys.length / 2));
      var b = keys.slice(Math.floor(keys.length / 2));

      offspring[key] = {};

      a.forEach(function(prop) {
         offspring[key][prop] = maybeMutate(parent1[key][prop]);
      });
      b.forEach(function(prop) {
         offspring[key][prop] = maybeMutate(parent2[key][prop]);
      });
   });

   offspring.metadata = {
      parents: [parent1.metadata.parent, parent2.metadata.parent],
      expectedElo: (parent1.metadata.expectedElo + parent2.metadata.expectedElo) / 2
   }

   return offspring;
}

function getExistingChromosomeNames(system_name, gen) {
   if (!fs.existsSync('./genetics/' + system_name))
      fs.mkdirSync('./genetics/' + system_name);
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
var PERCENT_CARRY_ON = 0.25;
var PERCENT_BREED = 0.5;
var PERCENT_NEW = 1 - (PERCENT_BREED + PERCENT_CARRY_ON);

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
   console.log(queue.length + ' games remaining');

   var inProgress = 0;
   function next() {
      if (queue.length === 0) {
         if (inProgress === 0)
            callback();
         return;
      }

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
         var winner = line.substr(8).trim();
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
            console.log(victor.name + '\tbeat      ' + loser.name + ' \t(' + queue.length + ' remaining)');
         }
         else if (winner === 'player2') {
            victor = children[1];
            loser = children[0];
            console.log(loser.name + '\tlost to   ' + victor.name + ' \t(' + queue.length + ' remaining)');
         }
         else if (winner === 'draw') {
            console.log(children[0].name + '\ttied with ' + children[1].name + ' \t(' + queue.length + ' remaining)');
            return;
         }
         else {
            console.log('Unrecognized winner:', winner);
         }

         var dscore = 10;

         victor.elo += dscore;
         loser.elo -= dscore;
      }

      function pipeGame(game) {
         game.stdout.on('data', function(data) {
            if (done) return;

            body += data.toString();
            // process.stdout.write(data.toString());

            body.split('\n').forEach(function(line) {
               if (line.indexOf('winner:') >= 0) {
                  finish(line);
               }
            });
         });

         game.stdout.on('end', function() {
            if (done) return;
            console.log('Ended.');

            var foundWinner = false;
            body.split('\n').forEach(function(line) {
               if (line.indexOf('winner:') >= 0) {
                  foundWinner = true;
                  finish(line);
               }
            });

            if (!foundWinner) {
               console.log('ERROR: No winner. Playing again...');

               game = spawn('node', args);
               body = '';
               done = false;
               pipeGame(game);
            }
         });
      }

      pipeGame(game);
   }

   for (var i = 0; i < MAX_FIGHTS_IN_PROGRESS; i ++)
      next();
}

function setupNextGen(system) {
   var previous = system['gen_' + system.generation] = system.population.map(function(child) {
      return {
         name: child.name,
         elo: child.elo,
         gamesPlayed: child.gamesPlayed
      };
   });
   saveSystem();

   var gen = system.generation + 1;
   if (!fs.existsSync('./genetics/' + system.name + '/gen_' + gen))
      fs.mkdirSync('./genetics/' + system.name + '/gen_' + gen);

   var carryOn = previous.sort(function(a, b) {
      return b.elo - a.elo;
   }).slice(0, Math.floor(previous.length * PERCENT_CARRY_ON));

   var childId = 0;
   var parents = [];
   carryOn.forEach(function(child, i) {
      var data = readJSON(system.name + '/gen_' + system.generation + '/' + child.name);
      data.metadata = data.metadata || {};
      data.metadata.parent = child.name;
      data.metadata.expectedElo = child.elo;

      parents.push(data);

      writeChromosome(system.name + '/gen_' + gen + '/' + child.name, data);
      childId ++;
   });

   var matched = [];

   var numBreed = Math.floor(previous.length * PERCENT_BREED);
   for (var i = 0; i < numBreed; i ++) {
      var p1 = -1;
      do {
         p1 = Math.floor(Math.random() * parents.length);
         var p2 = p1;
         do {
            p2 = Math.floor(Math.random() * parents.length);
         } while (p2 === p1);
      } while (matched[p1] && matched[p1][p2]);

      if (!matched[p1])
         matched[p1] = [];

      matched[p1][p2] = true;

      p1 = parents[p1];
      p2 = parents[p2];

      writeChromosome(system.name + '/gen_' + gen + '/gen_' + gen + '_child_' + (childId++), 
         produceOffspring(p1, p2));
   }

   system.generation ++;
   system.population = [];
   saveSystem();
}

function setupAndRun(system) {
   // If there are no children left, create some
   if (system.population.length === 0) {

      // Create random population
      var existing = getExistingChromosomeNames(system.name, system.generation);

      for (var i = existing.length; i < POPULATION_SIZE; i ++) {
         writeRandomChromosome(system.name, system.generation, i);
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

   runGeneration(system, function() {
      setupNextGen(system);

      setupAndRun(system);
   });
}

setupAndRun(system);

console.log('Done.');