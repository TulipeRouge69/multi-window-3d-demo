import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';

let scene, camera, renderer;

init();
animate();

function init() {
	// SCENE
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);

	// CAMERA (orthographique, simple)
	camera = new THREE.OrthographicCamera(
		0,
		window.innerWidth,
		window.innerHeight,
		0,
		-1000,
		1000
	);
	camera.position.z = 10;

	// RENDERER
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	// ===== SPHERE 1 =====
	const sphere1 = new THREE.Mesh(
		new THREE.SphereGeometry(60, 8, 6),
		new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
	);
	sphere1.position.set(300, 300, 0);
	scene.add(sphere1);

	// ===== SPHERE 2 =====
	const sphere2 = new THREE.Mesh(
		new THREE.SphereGeometry(60, 8, 6),
		new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
	);
	sphere2.position.set(600, 500, 0);
	scene.add(sphere2);

	// ===== LINE ENTRE LES DEUX =====
	const geometry = new THREE.BufferGeometry().setFromPoints([
		sphere1.position.clone(),
		sphere2.position.clone()
	]);

	const material = new THREE.LineBasicMaterial({
		color: 0xffffff,
		linewidth: 2
	});

	const line = new THREE.Line(geometry, material);
	scene.add(line);

	// RESIZE
	window.addEventListener('resize', onResize);
}

function animate() {
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}

function onResize() {
	camera.right = window.innerWidth;
	camera.top = window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
