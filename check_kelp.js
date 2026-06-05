const THREE = require('three');
const { mergeGeometries } = require('three/examples/jsm/utils/BufferGeometryUtils.js');

const stipe = new THREE.CylinderGeometry(0.04, 0.08, 1, 6, 12);
const frond = new THREE.PlaneGeometry(0.28, 0.35, 2, 3);
const bladder = new THREE.SphereGeometry(0.035, 4, 3);
const holdfast = new THREE.CylinderGeometry(0.02, 0.14, 0.12, 6);

const allParts = [stipe, frond, bladder, holdfast];
const merged = mergeGeometries(allParts);

if (merged) {
    console.log("Merge successful!");
} else {
    console.log("Merge failed!");
    for (let i = 0; i < allParts.length; i++) {
        console.log(`Geom ${i} attributes:`, Object.keys(allParts[i].attributes));
        console.log(`Geom ${i} index:`, allParts[i].index !== null);
    }
}
