#!/usr/local/bin/node

var http = require('http');
var fs = require('fs');

process.argv.shift();
process.argv.shift();
if (process.argv.length < 1) {
   console.log('Usage: node get_map.js game_id [...]');
   process.exit(1);
}

process.argv.forEach(function(game_id) {
   console.log(game_id);
   if (!fs.existsSync('./maps/' + game_id)){
      fs.mkdirSync('./maps/' + game_id);
   }

   var mapdata = fs.createWriteStream('./maps/' + game_id + '/mapdata');
   http.get('http://theaigames.com/competitions/warlight-ai-challenge-2/games/' + game_id + '/mapdata', (res) => {
      res.pipe(mapdata);
   }).on('error', (e) => {
      console.log(`Got error: ${e.message}`);
   });

   var map = fs.createWriteStream('./maps/' + game_id + '/map');
   http.get('http://theaigames.com/competitions/warlight-ai-challenge-2/games/' + game_id + '/map', (res) => {
      res.pipe(map);
   }).on('error', (e) => {
      console.log(`Got error: ${e.message}`);
   });
});