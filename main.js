import WindowManager from './WindowManager.js';

const t = THREE;

// ===== GLOBALS =====
let camera, scene, renderer, world;
let pixR = window.devicePixelRatio || 1;

let cubes = [];
let linkLine = null;

let sceneOffsetTarget = { x: 0, y: 0 };
let sceneOffset = { x: 0, y: 0 };

let today = new Date();
today.setHours(0, 0, 0, 0);
today = today.getTime();

let windowManager;
let initialized = false;

// ===== TIME =====
function getTime() {
	return (Date.now() - today) / 1000;
}

// ===== CLEAR STORAGE =====
if (new URLSearchParams(window.location.search).get("clear")) {
	localStorage.clear();
}

// ===== INIT =====
document.addEventListener("visibilitychange", () => {
	if (document.visibilityState !== 'hidden' && !initialized) init();
});

window.onload = () => {
	if (document.visibilityState !== 'hidden') init();
};

function init() {
	initialized = true;

	setTimeout(() => {
		setupScene();
		setupWindowManager();
		resize();
		updateWindowShape(false);
		render();
		window.addEventListener('resize', resize);
	}, 300);
}

// ===== SCENE =====
function setupScene() {
	camera = new t.OrthographicCamera(
		0,
		window.innerWidth,
		0,
		window.innerHeight,
		-10000,
		10000
	);
	camera.position.z = 10;

	scene = new t.Scene();
	scene.background = new t.Color(0x000000);
	scene.add(camera);

	renderer = new t.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(pixR);

	world = new t.Object3D();
	scene.add(world);

	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
}

// ===== WINDOW MANAGER =====
function setupWindowManager() {
	windowManager = new WindowManager();
	windowManager.setWinShapeChangeCallback(updateWindowShape);
	windowManager.setWinChangeCallback(updateNumberOfCubes);
	windowManager.init({ foo: "bar" });

	updateNumberOfCubes();
}

// ===== SPHERES + LINE =====
function updateNumberOfCubes() {
	const wins = windowManager.getWindows();

	// remove spheres
	cubes.forEach(c => world.remove(c));
	cubes = [];

	// remove line
	if (linkLine) {
		world.remove(linkLine);
		linkLine.geometry.dispose();
		linkLine.material.dispose();
		linkLine = null;
	}

	// create spheres
	for (let i = 0; i < wins.length; i++) {
		const win = wins[i];

		const color = new t.Color().setHSL(i * 0.15, 1, 0.5);
		const size = 100 + i * 40;

		const sphere = new t.Mesh(
			new t.SphereGeometry(size * 0.5, 8, 6),
			new t.MeshBasicMaterial({
				color,
				wireframe: true
			})
		);

		sphere.position.set(
			win.shape.x + win.shape.w * 0.5,
			win.shape.y + win.shape.h * 0.5,
			0
		);

		world.add(sphere);
		cubes.push(sphere);
	}

	// create ONE line between first two spheres
	if (cubes.length >= 2) {
		const geometry = new t.BufferGeometry().setFromPoints([
			cubes[0].position.clone(),
			cubes[1].position.clone()
		]);

		const material = new t.LineBasicMaterial({
			color: 0xffffff,
			opacity: 1,
			transparent: true,
			depthTest: false
		});

		linkLine = new t.Line(geometry, material);
		linkLine.position.z = 5;
		world.add(linkLine);
	}
}

// ===== WINDOW OFFSET =====
function updateWindowShape(easing = true) {
	sceneOffsetTarget = {
		x: -window.screenX,
		y: -window.screenY
	};
	if (!easing) sceneOffset = sceneOffsetTarget;
}

// ===== RENDER LOOP =====
function render() {
	const time = getTime();
	windowManager.update();

	const falloff = 0.05;
	sceneOffset.x += (sceneOffsetTarget.x - sceneOffset.x) * falloff;
	sceneOffset.y += (sceneOffsetTarget.y - sceneOffset.y) * falloff;

	world.position.x = sceneOffset.x;
	world.position.y = sceneOffset.y;

	const wins = windowManager.getWindows();

	// update spheres
	for (let i = 0; i < cubes.length; i++) {
		const cube = cubes[i];
		const win = wins[i];

		const tx = win.shape.x + win.shape.w * 0.5;
		const ty = win.shape.y + win.shape.h * 0.5;

		cube.position.x += (tx - cube.position.x) * falloff;
		cube.position.y += (ty - cube.position.y) * falloff;

		cube.rotation.x = time * 0.4;
		cube.rotation.y = time * 0.3;
	}

	// update line
	if (linkLine && cubes.length >= 2) {
		linkLine.geometry.setFromPoints([
			cubes[0].position.clone(),
			cubes[1].position.clone()
		]);
	}

	renderer.render(scene, camera);
	requestAnimationFrame(render);
}

// ===== RESIZE =====
function resize() {
	camera.right = window.innerWidth;
	camera.top = window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
