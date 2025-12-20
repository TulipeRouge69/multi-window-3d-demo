import WindowManager from './WindowManager.js';

const t = THREE;

let camera, scene, renderer, world;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;

let cubes = [];
let lines = [];

let sceneOffsetTarget = { x: 0, y: 0 };
let sceneOffset = { x: 0, y: 0 };

let today = new Date();
today.setHours(0, 0, 0, 0);
today = today.getTime();

let windowManager;
let initialized = false;

// time in seconds since beginning of the day
function getTime() {
	return (new Date().getTime() - today) / 1000.0;
}

if (new URLSearchParams(window.location.search).get("clear")) {
	localStorage.clear();
} else {

	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState !== 'hidden' && !initialized) {
			init();
		}
	});

	window.onload = () => {
		if (document.visibilityState !== 'hidden') {
			init();
		}
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

	function setupScene() {
		// ✅ CAMERA CORRIGÉE (très important)
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

		renderer.domElement.id = "scene";
		document.body.appendChild(renderer.domElement);
	}

	function setupWindowManager() {
		windowManager = new WindowManager();
		windowManager.setWinShapeChangeCallback(updateWindowShape);
		windowManager.setWinChangeCallback(windowsUpdated);

		windowManager.init({ foo: "bar" });
		windowsUpdated();
	}

	function windowsUpdated() {
		updateNumberOfCubes();
	}

	function updateNumberOfCubes() {
		let wins = windowManager.getWindows();

		// remove spheres
		cubes.forEach(c => world.remove(c));
		cubes = [];

		// remove lines
		lines.forEach(l => world.remove(l.line));
		lines = [];

		// create spheres
		for (let i = 0; i < wins.length; i++) {
			let win = wins[i];

			let color = new t.Color();
			color.setHSL(i * 0.12, 1.0, 0.5);

			let size = 100 + i * 50;
			let sphere = new t.Mesh(
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

		// create lines between spheres
		for (let i = 0; i < cubes.length; i++) {
			for (let j = i + 1; j < cubes.length; j++) {

				const geometry = new t.BufferGeometry().setFromPoints([
					cubes[i].position.clone(),
					cubes[j].position.clone()
				]);

				const material = new t.LineBasicMaterial({
					color: 0xffffff,
					transparent: true,
					opacity: 0.5
				});

				const line = new t.Line(geometry, material);
				world.add(line);

				lines.push({ line, i, j });
			}
		}
	}

	function updateWindowShape(easing = true) {
		sceneOffsetTarget = {
			x: -window.screenX,
			y: -window.screenY
		};
		if (!easing) sceneOffset = sceneOffsetTarget;
	}

	function render() {
		let time = getTime();

		windowManager.update();

		let falloff = 0.05;
		sceneOffset.x += (sceneOffsetTarget.x - sceneOffset.x) * falloff;
		sceneOffset.y += (sceneOffsetTarget.y - sceneOffset.y) * falloff;

		world.position.x = sceneOffset.x;
		world.position.y = sceneOffset.y;

		let wins = windowManager.getWindows();

		// update spheres
		for (let i = 0; i < cubes.length; i++) {
			let cube = cubes[i];
			let win = wins[i];

			let targetX = win.shape.x + win.shape.w * 0.5;
			let targetY = win.shape.y + win.shape.h * 0.5;

			cube.position.x += (targetX - cube.position.x) * falloff;
			cube.position.y += (targetY - cube.position.y) * falloff;

			cube.rotation.x = time * 0.5;
			cube.rotation.y = time * 0.3;
		}

		// update lines
		lines.forEach(l => {
			const p1 = cubes[l.i].position;
			const p2 = cubes[l.j].position;
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

	function resize() {
		let width = window.innerWidth;
		let height = window.innerHeight;

		camera.left = 0;
		camera.right = width;
		camera.bottom = 0;
		camera.top = height;
		camera.updateProjectionMatrix();

		renderer.setSize(width, height);
	}
}
