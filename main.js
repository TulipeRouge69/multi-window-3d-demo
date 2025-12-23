import WindowManager from "./WindowManager.js";

let scene, camera, renderer, world;
let windowManager;

let spheres = [];
let lines = [];

init();
animate();

function init() {

	// WINDOW MANAGER
	windowManager = new WindowManager();
	windowManager.init();

	// SCENE
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);

	// CAMERA (ORTHO SIMPLE)
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

	// WORLD
	world = new THREE.Group();
	scene.add(world);

	// CALLBACKS
	windowManager.setWinChangeCallback(build);
	windowManager.setWinShapeChangeCallback(build);

	build();

	window.addEventListener("resize", resize);
}

function build() {

	// CLEAR
	spheres.forEach(s => world.remove(s));
	lines.forEach(l => world.remove(l));
	spheres = [];
	lines = [];

	const wins = windowManager.getWindows();

	// SPHERES
	wins.forEach((win, i) => {

		const sphere = new THREE.Mesh(
			new THREE.SphereGeometry(40, 12, 8),
			new THREE.MeshBasicMaterial({
				color: 0xffffff,
				wireframe: true
			})
		);

		sphere.position.set(
			win.shape.x + win.shape.w / 2,
			win.shape.y + win.shape.h / 2,
			0
		);

		world.add(sphere);
		spheres.push(sphere);
	});

	// LINES (entre sphères)
	for (let i = 0; i < spheres.length - 1; i++) {

		const geometry = new THREE.BufferGeometry().setFromPoints([
			spheres[i].position.clone(),
			spheres[i + 1].position.clone()
		]);

		const line = new THREE.Line(
			geometry,
			new THREE.LineBasicMaterial({ color: 0xffffff })
		);

		world.add(line);
		lines.push(line);
	}
}

function animate() {

	windowManager.update();

	const t = performance.now() * 0.001;

	// ROTATION
	spheres.forEach(s => {
		s.rotation.x = t;
		s.rotation.y = t * 0.7;
	});

	// UPDATE LINES
	for (let i = 0; i < lines.length; i++) {
		lines[i].geometry.setFromPoints([
			spheres[i].position,
			spheres[i + 1].position
		]);
	}

	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}

function resize() {
	camera.right = window.innerWidth;
	camera.top = window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
