require('./PossibleOwners.js');

/**
 * Region class
 * Initializes with an id and a reference to the super region
 * @param int id
 * @param SuperRegion superRegion
 */
Region = function (id, superRegion) {
   if (false === ( this instanceof Region)) {
      return new Region(arguments);
   }

   this.id = id;
   this.superRegion = superRegion;
   this.owner = PossibleOwners.NEUTRAL;
   this.neighbors = [];
   this.troopCount = 2;
   this.isOnEmpireBorder = false;
   this.isOnSuperRegionBorder = false;

   this.pickingScore = 0;
}

Region.prototype.score = function(chromosome, map) {
   var priority = chromosome.initial;

   return this.neighbors.length * priority.borders;
};

module.exports = Region;