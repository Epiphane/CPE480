var PossibleOwners = require('./PossibleOwners.js');

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

Region.prototype.initialScore = function(chromosome, map) {
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

Region.prototype.reinforceScore = function(chromosome, map) {
   var priority = chromosome.genes.reinforce;
   var score = 0;

   if (!priority) {
      // console.error('No reinforcement priority. Acting randomly...');
      return Math.random();
   }

   var superRegionId = this.superRegion;
   var superRegion = map.superRegions[superRegionId];

   // TODO
   // "initial": 0.2,

   // "armies": -0.5,
   score += priority.armies * this.troopCount;

   var enemyBorders = 0;
   var enemyArmies = 0;
   var enemyLargeArmy = 0;
   var allyBorders = 0;
   var allyArmies = 0;
   var allyLargeArmy = 0;
   var neutralBorders = 0;
   var wastelandBorders = 0;
   var superRegionNeutralNeighbors = 0;
   var superRegionEnemyNeighbors = 0;
   this.neighbors.forEach(function(neighbor) {
      if (neighbor.owner === PossibleOwners.OPPONENT) {
         enemyBorders ++;
         enemyArmies += neighbor.troopCount;
         if (neighbor.troopCount > enemyLargeArmy)
            enemyLargeArmy = neighbor.troopCount;

         if (neighbor.superRegion === superRegionId)
            superRegionEnemyNeighbors ++;
      }
      else if (neighbor.owner === PossibleOwners.PLAYER) {
         allyBorders ++;
         allyArmies += neighbor.troopCount;
         if (neighbor.troopCount > allyLargeArmy)
            allyLargeArmy = neighbor.troopCount;
      }
      else if (neighbor.owner === PossibleOwners.NEUTRAL) {
         if (neighbor.troopCount <= 2) 
            neutralBorders ++;
         else
            wastelandBorders ++;

         if (neighbor.superRegion === superRegionId)
            superRegionNeutralNeighbors ++;
      }
      else {
         console.error('Unrecognized owner:', neighbor.owner);
      }
   });

   // "enemyBorders": 1,
   score += priority.enemyBorders * enemyBorders;

   // "enemyBigArmy": 1.2,
   score += priority.enemyBigArmy * enemyLargeArmy;

   // "enemyAvgArmy": 2,
   if (enemyBorders)
      score += priority.enemyAvgArmy * enemyArmies / enemyBorders;

   // "allyBorders": -0.5,
   score += priority.allyBorders * allyBorders;

   // "allyBigArmy": -1.0,
   score += priority.allyBigArmy * allyLargeArmy;

   // "allyAvgArmy": -1.5,
   if (allyBorders)
      score += priority.allyAvgArmy * allyArmies / allyBorders;

   // "neutralBorders": 0.2,
   score += priority.neutralBorders * neutralBorders;

   // "wastelandBorders": -0.1,
   score += priority.wastelandBorders * wastelandBorders;

   // "SuperRegionClaimedAlly": 2,
   var superRegionClaimedAlly = 0;
   for (var i in superRegion.regions) {
      if (superRegion.regions[i].owner === PossibleOwners.PLAYER)
         superRegionClaimedAlly ++;
   };
   // console.error('s', score, superRegionClaimedAlly);
   score += priority.superRegionClaimedAlly * superRegionClaimedAlly;
   // console.error(score);

   // "neutralBordersInSuperRegion": 2
   score += priority.enemyBordersInSuperRegion * superRegionEnemyNeighbors;
   score += priority.neutralBordersInSuperRegion * superRegionNeutralNeighbors;
   // console.error(score);

   var unclaimedInSR = superRegion.unclaimedByPlayer();  
   if (unclaimedInSR > 0) {
      score += priority.inverseReminingInSuperRegion / unclaimedInSR;
   }

   return score;
}

Region.prototype.setAllyDist = function(dist) {
   if (dist < this.nearestAlly || this.nearestAlly < 0) {
      this.nearestAlly = dist;

      this.neighbors.forEach(function(neighbor) {
         neighbor.setAllyDist(dist + 1);
      });
   }
};

Region.prototype.isVisible = function() {
   var seen = (this.owner === PossibleOwners.PLAYER);

   this.neighbors.forEach(function(neighbor) {
      if (neighbor.owner === PossibleOwners.PLAYER) {
         seen = true;
      }
   });

   return seen;
}

Region.prototype.pickRegion = function() {
   this.owner = PossibleOwners.PLAYER;
   this.nearestAlly = 0;

   this.neighbors.forEach(function(neighbor) {
      neighbor.setAllyDist(1);
   });
}

module.exports = Region;