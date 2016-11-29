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

   var superRegion = map.superRegions[this.superRegion];

   // TODO
   // "enemyDist": 1,


   // "superRegionSize": -0.1,
   score += priority.superRegionSize * superRegion.regions.length

   // "superRegionBonus": 2,
   score += priority.superRegionBonus * superRegion.bonus

   // superRegionBonusPerRegion": 3,
   score += priority.superRegionBonusPerRegion *
      (superRegion.bonus / superRegion.regions.length)

   for (var i in superRegion.regions) {
      if (superRegion.regions[i].owner == PossibleOwners.PLAYER) {
         // "superRegionClaimedAlly": 0.5,
         score += priority.superRegion.superRegionClaimedAlly
      } else if (superRegion.regions[i].owner == PossibleOwners.OPPONENT) {
         // "superRegionClaimedEnemy": 0.5,
         score += priority.superRegion.superRegionClaimedEnemy
      }

      //  "isSuperRegionBorder": -0.5
      if (superRegion.regions[i].isOnSuperRegionBorder) {
         score += priority.isSuperRegionBorder
      }

      // "superRegionWastelands": -1,
      if (superRegion.regions[i].troopCount == 6) {
         score += priority.superRegionWastelands
      }

      // TODO
      // "superRegionBorders": -1,
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