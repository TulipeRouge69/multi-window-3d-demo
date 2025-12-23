import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import WindowManager from './WindowManager.js';

let camera, scene, renderer, world;

function init() {
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);

	camera = new THREE.OrthographicCamera(
		0, window.innerWidth,
		window.innerHeight, 0,
		-1000, 1000
	);
	camera.position.z = 10;

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	world = new THREE.Object3D();
	scene.add(world);

	const sphere = new THREE.Mesh(
		new THREE.SphereGeometry(80, 8, 6),
		new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
	);

	sphere.position.set(300, 300, 0);
	world.add(sphere);

	render();
}

function render() {
	renderer.render(scene, camera);
	requestAnimationFrame(render);
}

init();
