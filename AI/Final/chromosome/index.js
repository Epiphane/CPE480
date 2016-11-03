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
   this.genes = JSON.parse(fs.readFileSync('../genetics/' + filename + '.json', 'utf8'));
};