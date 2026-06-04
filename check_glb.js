const fs = require('fs');
// read public/models/penguin.glb
// wait, we don't have a glTF parser handy...
// let's just grep the file for 'COLOR_0'
const file = fs.readFileSync('public/models/penguin.glb');
console.log(file.includes('COLOR_0') ? 'Has COLOR_0' : 'No COLOR_0');
