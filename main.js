import WindowManager from "./WindowManager.js";

let scene, camera, renderer;
let world;

let windowManager;
let spheres = [];
let lines = [];

let sceneOffset = { x: 0, y: 0 };
let sceneOffsetTarget = { x: 0, y: 0 };

init();
render();

function init() {

	// WINDOW MANAGER
	windowManager = new WindowManager();
	windowManager.init();

	// SCENE
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);

	// CAMERA
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

	// WORLD (pour le décalage des fenêtres)
	world = new THREE.Group();
	scene.add(world);

	// CALLBACKS
	windowManager.setWinChangeCallback(rebuild);
	windowManager.setWinShapeChangeCallback(updateOffset);

	// INIT
	rebuild();
	updateOffset();

	window.addEventListener("resize", onResize);
}

function rebuild() {

	// CLEAR
	spheres.forEach(s => world.remove(s));
	lines.forEach(l => world.remove(l.line));

	spheres = [];
	lines = [];

	const wins = windowManager.getWindows();

	// CREATE SPHERES
	for (let i = 0; i < wins.length; i++) {

		const sphere = new THREE.Mesh(
			new THREE.SphereGeometry(50, 12, 8),
			new THREE.MeshBasicMaterial({
				color: 0xffffff,
				wireframe: true
			})
		);

		world.add(sphere);
		spheres.push(sphere);
	}

	// CREATE LINES (entre chaque sphère)
	for (let i = 0; i < spheres.length - 1; i++) {

		const geometry = new THREE.BufferGeometry().setFromPoints([
			new THREE.Vector3(),
			new THREE.Vector3()
		]);

		const material = new THREE.LineBasicMaterial({ color: 0xffffff });
		const line = new THREE.Line(geometry, material);

		world.add(line);
		lines.push({ line, i, j: i + 1 });
	}
}

function updateOffset() {
	const win = windowManager.getThisWindowData().shape;
	sceneOffsetTarget.x = -win.x;
	sceneOffsetTarget.y = -win.y;
}

function render() {

	windowManager.update();

	const falloff = 0.05;

	sceneOffset.x += (sceneOffsetTarget.x - sceneOffset.x) * falloff;
	sceneOffset.y += (sceneOffsetTarget.y - sceneOffset.y) * falloff;

	world.position.x = sceneOffset.x;
	world.position.y = sceneOffset.y;

	const wins = windowManager.getWindows();
	const t = performance.now() * 0.001;

	// UPDATE SPHERES
	for (let i = 0; i < spheres.length; i++) {

		const win = wins[i];
		const sphere = spheres[i];

		const targetX = win.shape.x + win.shape.w * 0.5;
		const targetY = win.shape.y + win.shape.h * 0.5;

		sphere.position.x += (targetX - sphere.position.x) * falloff;
		sphere.position.y += (targetY - sphere.position.y) * falloff;

		// ROTATION
		sphere.rotation.x = t;
		sphere.rotation.y = t * 0.7;
	}

	// UPDATE LINES
	lines.forEach(l => {
		const p1 = spheres[l.i].position;
		const p2 = spheres[l.j].position;

		const arr = l.line.geometry.attributes.position.array;

		arr[0] = p1.x;
		arr[1] = p1.y;
		arr[2] = 0;

		arr[3] = p2.x;
		arr[4] = p2.y;
		arr[5] = 0;

		l.line.geometry.attributes.position.needsUpdate = true;
	});

	renderer.render(scene, camera);
	requestAnimationFrame(render);
}

function onResize() {
	camera.right = window.innerWidth;
	camera.top = window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
