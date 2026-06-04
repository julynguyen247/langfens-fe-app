const THREE = require('three');
const { mergeGeometries } = require('three/examples/jsm/utils/BufferGeometryUtils.js');

const mantleProfile = [
    new THREE.Vector2(0.001, 0.0),
    new THREE.Vector2(0.15,  0.05),
];
const mantleGeom = new THREE.LatheGeometry(mantleProfile, 8);
const finL = new THREE.PlaneGeometry(0.8, 0.5);

function applyVertexColor(geom, col) {
    const count = geom.attributes.position.count;
    const colors = new Float32Array(count * 3);
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

applyVertexColor(mantleGeom, new THREE.Color("#7C2D12"));
applyVertexColor(finL, new THREE.Color("#A16207"));

console.log("Mantle attributes:", Object.keys(mantleGeom.attributes));
console.log("Fin attributes:", Object.keys(finL.attributes));

const merged = mergeGeometries([mantleGeom, finL]);
if (merged) {
    console.log("Merged attributes:", Object.keys(merged.attributes));
} else {
    console.log("Merge failed!");
}
