/**
 * SuperRegion class
 * Initializes with an id, the super region's bonus
 * and an empty list for regions located in the super region
 * @param int id
 * @param int worth
 */
var PossibleOwners = require('./PossibleOwners');

SuperRegion = function (id, bonus) {
   if (false === ( this instanceof SuperRegion)) {
      return new SuperRegion(arguments);
   }

   this.id = id;
   this.bonus = bonus;
   this.regions = {};
};

SuperRegion.prototype.ownedByPlayer = function() {
   for (var n in this.regions) {
      if (!this.regions.hasOwnProperty(n)) {
         continue;
      }

      if (this.regions[n].owner !== PossibleOwners.PLAYER)
         return false;
   }

   return true;
};

SuperRegion.prototype.mayBeOwnedByEnemy = function() {
   for (var n in this.regions) {
      if (!this.regions.hasOwnProperty(n)) {
         continue;
      }

      if (this.regions[n].owner !== PossibleOwners.OPPONENT && this.regions[n].isVisible())
         return false;
   }

   return true;
};

SuperRegion.prototype.unclaimedByPlayer = function() {
   var unclaimed = 0;

   for (var n in this.regions) {
      if (!this.regions.hasOwnProperty(n)) {
         continue;
      }

      if (this.regions[n].owner !== PossibleOwners.PLAYER)
         unclaimed ++;
   }

   return unclaimed;
};

module.exports = SuperRegion;