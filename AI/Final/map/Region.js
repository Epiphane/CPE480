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
   this.nearestAlly = -1;
}

Region.prototype.score = function(chromosome, map) {
   var priority = chromosome.genes.initial;
   var score = 0;

   score += priority.borders * this.neighbors.length;
   if (this.nearestAlly >= 0) {
      score += priority.allyDist * this.nearestAlly;
   }

   return score;
};

Region.prototype.setAllyDist = function(dist) {
   if (dist < this.nearestAlly || this.nearestAlly < 0) {
      this.nearestAlly = dist;

      this.neighbors.forEach(function(neighbor) {
         neighbor.setAllyDist(dist + 1);
      });
   }
};

Region.prototype.pickRegion = function() {
   this.owner = PossibleOwners.PLAYER;
   this.nearestAlly = 0;

   this.neighbors.forEach(function(neighbor) {
      neighbor.setAllyDist(1);
   });
}

module.exports = Region;