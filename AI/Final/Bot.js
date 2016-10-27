/**
 * Warlight AI Game Bot
 *
 * Last update: December 17, 2014
 *
 * @author Niko van Meurs
 * @version 2.0
 * @License MIT License (http://opensource.org/Licenses/MIT)
 */

var bot,
    Bot,
    Map             = require('./map/Map.js'),
    SuperRegion     = require('./map/SuperRegion.js'),
    Region          = require('./map/Region.js'),
    PossibleOwners  = require('./map/PossibleOwners.js'),
    readline        = require('readline'),
    http            = require('http');

/**
 * Main class
 * Initializes a map instance and an empty settings object
 */
Bot = function () {
   if (false === (this instanceof Bot)) {
      return new Bot();
   }

   // initialize options object
   this.options = {};

   // initialize map
   this.map = new Map();
}

/**
 * 
 */
Bot.prototype.run = function () {
   var io = readline.createInterface(process.stdin, process.stdout);

   io.on('line', function (data) {
      var line, lines, lineParts, command, response;

      // stop if line doesn't contain anything
      if (data.length === 0) {
         return;
      }

      lines = data.trim().split('\n');

      while (lines.length > 0) {
         line = lines.shift().trim();
         lineParts = line.split(" ")

         // stop if lineParts doesn't contain anything
         if (lineParts.length === 0) {
            return;
         }

         // get the input command and convert to camel case
         command = lineParts.shift().toCamelCase();

         // invoke command if function exists and pass the data along
         // then return response if exists
         if (command in bot) {
            response = bot[command](lineParts);

            if (response && 0 < response.length) {
               process.stdout.write(response + '\n');
            }
         } else {
            process.stderr.write('Unable to execute command: ' + command + ', with data: ' + lineParts + '\n');
         }
      }
   });

   io.on('close', function () {
      process.exit(0);
   });
};

/**
 * Respond to settings command
 * @param Array data
 */
Bot.prototype.settings = function (data) {
   var key   = data[0],
       value = data[1];

   // set key to value
   this.options[key] = value;
};

Bot.prototype.setupMap = function (data) {
   var command = ('setup_' + data.shift()).toCamelCase();

   if (command in bot) {
      bot[command](data);
   }
   else {
      process.stderr.write('Unable to understand command: ' + command + ', with data: ' + data + '\n');
   }
};

/**
 * Bot.setupSuperRegions
 * Initializes all super regions and assigns their bonuses
 *
 * @param Array data
 */
Bot.prototype.setupSuperRegions = function (data) {
   var continentId, continentBonus;

   // loop through data in pairs of two
   for (var i = 0; i + 1 < data.length; i += 2) {
      // get continent id
      continentId = parseInt(data[i], 10);

      // get continent bonus
      continentBonus = parseInt(data[i + 1], 10);

      // store content in continents object
      this.map.superRegions[continentId] = new SuperRegion(continentId, continentBonus);
   }
};

/**
 * Bot.setupRegions
 * Initializes all regions and sets their superRegions
 *
 * @param Array data
 */
Bot.prototype.setupRegions = function (data) {
   var regionId, continentId;

   // loop through data in pairs of two
   for (var i = 0; i + 1 < data.length; i += 2) {
      // get region id
      regionId = parseInt(data[i], 10);

      // get continent id
      continentId = parseInt(data[i + 1], 10);

      // store region in regions object
      this.map.regions[regionId] = new Region(regionId, continentId);
   }
};

/**
 * Bot.setupNeighbors
 * Is used to update each regions neighbors according to data
 *
 * @param Array data
 */
Bot.prototype.setupNeighbors = function (data) {
   var region, neighbor, neighborIds;

   // loop through data in pairs of two
   for (var i = 0; i + 1 < data.length; i += 2) {
      // get region by id
      region = this.map.getRegion(data[i]);

      // strip the string of brackets and convert to array
      neighborIds = data[i + 1].replace('[', '').replace(']', '').split(',');

      for (var j = 0; j < neighborIds.length; j++) {
         // get the neighbor by Id
         neighbor = this.map.getRegion(neighborIds[j]);

         // connect region with its neighbor
         neighbor.neighbors.push(region);
         region.neighbors.push(neighbor);
      }
   }
};

/**
 * Bot.setupWastelands
 * Is used to set the amount of armies on the wastelands
 *
 * @param Array data
 */
Bot.prototype.setupWastelands = function (data) {
   // loop through data in pairs of two
   for (var i = 0; i < data.length; i += 1) {
      // get region by id
      var region = this.map.getRegion(data[i]);

      // this really shouldn't be hard coded
      region.troopCount = 6;
   }
};

/**
 * Bot.updateMap
 * Is used to update our map every round
 *
 * @param Array data
 */
Bot.prototype.updateMap = function (data) {
   // loop through data in pais of three
   for (var i = 0; i < data.length; i += 3) {
      // get region by id
      var region = this.map.getRegionById(data[i]);

      // update region owner
      region.owner = data[i + 1];

      // update troopcount
      region.troopCount = parseInt(data[i + 2], 10);
   }
};

/**
 * Bot.pickStartingRegion
 * Is used to select initial starting regions.
 * Currently selects six random regions.
 *
 * @param Array data
 * @return String
 */
Bot.prototype.pickStartingRegion = function (data) {
   // shuffle the regions and return the first item
   var randomRegion = data.shuffle().slice(0, 1);

   // parse to string
   return '' + randomRegion;
};

/**
 * Bot.go
 * Calls placeArmies or attackTransfer depending on first item in data
 *
 * @param Array data
 * @return string
 */
Bot.prototype.go = function (data) {
   // get the input command and convert to camel case
   command = data.shift().toCamelCase();

   // invoke command if function exists and pass the data along
   // then return response if exists
   if (command in bot) {
      return bot[command](data);
   } 
   else {
      process.stderr.write('Unable to understand command: ' + command + ', with data: ' + data + '\n');
   }
};

/**
 * Bot.placeArmies
 * Is used to place troops. Currently places each army on a random region
 *
 * @param Array data
 * @return string
 */
Bot.prototype.placeArmies = function (data) {
   var region,
       parsedPlacements = '',
       placements = [],
       regionIndex = 0,
       troopsRemaining = parseInt(this.options['starting_armies'], 10),
       ownedRegions = this.map.getOwnedRegions(this.options['your_bot']),
       your_bot = this.options['your_bot'];

   while (0 < troopsRemaining) {
      // get a random region
      regionIndex = Math.floor(Math.random() * ownedRegions.length);
      region = ownedRegions[regionIndex];

      // place a single army
      placements.push([region.id, 1]);

      region.troopCount += 1;
      troopsRemaining -= 1;
      regionIndex += 1;
   }

   // parse the placements
   return placements.map(function(placement) {
      return your_bot + ' place_armies ' + placement.join(' ');
   }).join(', ');
};

/**
 * Bot.attackTransfer
 * Method to attack another region or transfer troops to allied regions
 *
 * @param Array data
 * @return string
 */
Bot.prototype.attackTransfer = function (data) {
   var moves = [],
       ownedRegions = this.map.getOwnedRegions(this.options['your_bot']),
       neighbors,
       parsedMoves = [],
       region,
       targetRegion,
       your_bot = this.options['your_bot'];

   for(var i = 0; i < ownedRegions.length; i++) {
      region = ownedRegions[i];

      // attack neighboring enemy / neutral region if troopCount > 6
      if (region.troopCount > 6) {

         // shuffle the neighbours for some randomness
         for (var n in region.neighbors.shuffle()) {
            // continue if n is a property of the neighbors array,
            // instead of an item in the array
            if (!region.neighbors.hasOwnProperty(n)) {
               continue;
            }

            // set the target region
            targetRegion = region.neighbors[n];

            // attack with all available troops if target region is not owned by bot
            if (your_bot !== targetRegion.owner) {
               moves.push([region.id, targetRegion.id, region.troopCount - 1]);
               region.troopCount = 1;
               break;
            }
         }
      }

      // transfer troops to neighboring friendly region if troopCount > 1
      if (region.troopCount > 1) {

         // shuffle the neighbours for some randomness
         for (var n in region.neighbors.shuffle()) {
            // continue with the next iteration if n is a property of the neighbors array,
            // instead of an item in the array
            if (!region.neighbors.hasOwnProperty(n)) {
               continue;
            }

            // set the target region
            targetRegion = region.neighbors[n];

            // transfer all available troops if target region is owned by bot
            if (your_bot === targetRegion.owner) {
               moves.push([region.id, targetRegion.id, region.troopCount - 1]);
               region.troopCount = 1;
               break;
            }
         }
      }
   }

   // Return 'No moves' if no moves are made
   if (0 === moves.length) {
      return 'No moves';
   }

   return moves.map(function(move) {
      return your_bot + ' attack/transfer ' + move.join(' ');
   }).join(',');
};

/**
 * Bot.opponentMoves
 * Can be used to parse the opponent_moves data, isn't used in the starter bot
 *
 * @param Array data
 */
Bot.prototype.opponentMoves = function (data) {

};

Array.prototype.shuffle = function () {
   var o = this;

   for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);

   return o;
};

String.prototype.toCamelCase = function () {
   return this.replace('/', '_').replace(/_[a-z]/g, function (match) {
      return match.toUpperCase().replace('_', '');
   });
};

/**
 * Initialize bot
 * __main__
 */
bot = new Bot();
bot.run();