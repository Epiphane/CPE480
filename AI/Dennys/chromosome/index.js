/* 
 * Cool genetic algorithm stuff wow
 */
var fs = require('fs');

var Chromosome = module.exports = function() {
   var filename = 'example';
   if (process.argv.length > 2) {
      filename = process.argv[2];
   }

   // Load in a chromosome maybe?
   this.genes = {
     "initial": {
       "borders": 2.985766234342009,
       "allyDist": -6.395982387475669,
       "enemyDist": -6.629966588458046,
       "superRegionSize": 5.416947593679652,
       "superRegionClaimedAlly": 5.399480309803039,
       "superRegionClaimedEnemy": -1.8742730114609003,
       "superRegionBorders": -7.713211071677506,
       "superRegionWastelands": -2.2280854399758336,
       "superRegionBonus": 6.926731679400755,
       "superRegionBonusPerRegion": -4.561646299203858,
       "isSuperRegionBorder": -10.116939378436655
     },
     "reinforce": {
       "initial": 8.100443159829311,
       "armies": -8.371698015602306,
       "enemyBorders": 8.055050875599585,
       "enemyBigArmy": 5.834238836020189,
       "enemyAvgArmy": 9.005595492199063,
       "allyBorders": -2.065778916236013,
       "allyBigArmy": -2.156431532232091,
       "allyAvgArmy": -6.047805552370846,
       "neutralBorders": 8.09802667144686,
       "wastelandBorders": 1.1410725417081267,
       "superRegionClaimedAlly": 6.376773864030838,
       "inverseReminingInSuperRegion": 6.530830139992759,
       "neutralBordersInSuperRegion": 6.5654769454349085,
       "enemyBordersInSuperRegion": 9.970552127575502
     },
     "attack": {
       "neutral": 3.6514370613731444,
       "myExposedBorders": -9.23766671679914,
       "myTroopCount": 1.3260395741090178,
       "enemyTroopCount": 0.8481289017945528,
       "reinforce": -6.7414561049081385,
       "inSameSuperRegion": 5.0060838961508125,
       "inverseReminingInSuperRegion": -2.4317274873610586,
       "isSuperRegionClaimedEnemy": -6.119541180320084,
       "myExpectedLosses": -2.7201935832347575,
       "enemyExpectedLosses": -7.671446255873889,
       "myTroopAdvantagePercent": -0.8611615032423288,
       "myTroopAdvantagePercentBreakEven": -13.39459255126096,
       "gainRegion": 7.4197282968088984
     },
     "transfer": {
       "myTroopCount": -8.655087116368904,
       "myReinforce": 3.1962220231071115,
       "allyReinforce": 3.837503743102472
     },
     "metadata": {
       "parents": {
         "0": "gen_16_child_42",
         "1": "gen_15_child_34"
       },
       "expectedElo": 1330,
       "parent": "gen_17_child_43"
     }
   };
};