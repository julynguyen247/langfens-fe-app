const fs = require('fs');
const json = JSON.parse(fs.readFileSync('public/models/penguin.glb').slice(20, 20 + 2000).toString('utf-8').replace(/\x00/g, ''));
// The slicing is hacky but we just want to look at the nodes array in the JSON.
// Let's do a proper parse with python instead since we already have it.
