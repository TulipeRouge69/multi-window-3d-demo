import WindowManager from './WindowManager.js'



const t = THREE;
let camera, scene, renderer, world;
let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let cubes = [];
let lines = [];
let sceneOffsetTarget = {x: 0, y: 0};
let sceneOffset = {x: 0, y: 0};

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let internalTime = getTime();
let windowManager;
let initialized = false;

// get time in seconds since beginning of the day (so that all windows use the same time)
function getTime ()
{
	return (new Date().getTime() - today) / 1000.0;
}


if (new URLSearchParams(window.location.search).get("clear"))
{
	localStorage.clear();
}
else
{	
	// this code is essential to circumvent that some browsers preload the content of some pages before you actually hit the url
	document.addEventListener("visibilitychange", () => 
	{
		if (document.visibilityState != 'hidden' && !initialized)
		{
			init();
		}
	});

	window.onload = () => {
		if (document.visibilityState != 'hidden')
		{
			init();
		}
	};

	function init ()
	{
		initialized = true;

		// add a short timeout because window.offsetX reports wrong values before a short period 
		setTimeout(() => {
			setupScene();
			setupWindowManager();
			resize();
			updateWindowShape(false);
			render();
			window.addEventListener('resize', resize);
		}, 500)	
	}

	function setupScene ()
	{
		camera = new t.OrthographicCamera(0, 0, window.innerWidth, window.innerHeight, -10000, 10000);
		
		camera.position.z = 2.5;
		near = camera.position.z - .5;
		far = camera.position.z + 0.5;

		scene = new t.Scene();
		scene.background = new t.Color(0.0);
		scene.add( camera );

		renderer = new t.WebGLRenderer({antialias: true, depthBuffer: true});
		renderer.setPixelRatio(pixR);
	    
	  	world = new t.Object3D();
		scene.add(world);

		renderer.domElement.setAttribute("id", "scene");
		document.body.appendChild( renderer.domElement );
	}

	function setupWindowManager ()
	{
		windowManager = new WindowManager();
		windowManager.setWinShapeChangeCallback(updateWindowShape);
		windowManager.setWinChangeCallback(windowsUpdated);

		// here you can add your custom metadata to each windows instance
		let metaData = {foo: "bar"};

		// this will init the windowmanager and add this window to the centralised pool of windows
		windowManager.init(metaData);

		// call update windows initially (it will later be called by the win change callback)
		windowsUpdated();
	}

	function windowsUpdated ()
	{
		updateNumberOfCubes();
	}

function updateNumberOfCubes ()
{
	let wins = windowManager.getWindows();

	// remove all spheres
	cubes.forEach(c => world.remove(c));
	cubes = [];

	// remove all lines
	lines.forEach(l => world.remove(l.line));
	lines = [];

	// create spheres
	for (let i = 0; i < wins.length; i++)
	{
		let win = wins[i];

		let c = new t.Color();
		c.setHSL(i * .1, 1.0, .5);

		let s = 100 + i * 50;
		let sphere = new t.Mesh(
			new t.SphereGeometry(s * 0.5, 8, 6),
			new t.MeshBasicMaterial({ color: c, wireframe: true })
		);

		sphere.position.x = win.shape.x + (win.shape.w * .5);
		sphere.position.y = win.shape.y + (win.shape.h * .5);

		world.add(sphere);
		cubes.push(sphere);
	}

	// ✅ CREATE LINES (ICI, PAS AILLEURS)
	for (let i = 0; i < cubes.length; i++) {
		for (let j = i + 1; j < cubes.length; j++) {

			const geometry = new t.BufferGeometry().setFromPoints([
				cubes[i].position.clone(),
				cubes[j].position.clone()
			]);

			const material = new t.LineBasicMaterial({
				color: 0xffffff,
				opacity: 0.4,
				transparent: true
			});

			const line = new t.Line(geometry, material);
			world.add(line);

			lines.push({ line, i, j });
		}
	}
}
	function updateWindowShape (easing = true)
	{
		// storing the actual offset in a proxy that we update against in the render function
		sceneOffsetTarget = {x: -window.screenX, y: -window.screenY};
		if (!easing) sceneOffset = sceneOffsetTarget;
	}


	function render ()
{
	let t = getTime();

	windowManager.update();

	let falloff = .05;
	sceneOffset.x += (sceneOffsetTarget.x - sceneOffset.x) * falloff;
	sceneOffset.y += (sceneOffsetTarget.y - sceneOffset.y) * falloff;

	world.position.x = sceneOffset.x;
	world.position.y = sceneOffset.y;

	let wins = windowManager.getWindows();

	// update spheres
	for (let i = 0; i < cubes.length; i++)
	{
		let cube = cubes[i];
		let win = wins[i];
		let _t = t;

		let posTarget = {
			x: win.shape.x + (win.shape.w * .5),
			y: win.shape.y + (win.shape.h * .5)
		};

		cube.position.x += (posTarget.x - cube.position.x) * falloff;
		cube.position.y += (posTarget.y - cube.position.y) * falloff;
		cube.rotation.x = _t * .5;
		cube.rotation.y = _t * .3;
	}

	// ✅ UPDATE LINES (ICI, AVANT RENDER)
	lines.forEach(l => {
		const p1 = cubes[l.i].position;
		const p2 = cubes[l.j].position;

		const arr = l.line.geometry.attributes.position.array;

		arr[0] = p1.x;
		arr[1] = p1.y;
		arr[2] = p1.z || 0;

		arr[3] = p2.x;
		arr[4] = p2.y;
		arr[5] = p2.z || 0;

		l.line.geometry.attributes.position.needsUpdate = true;
	});

	// render AFTER all updates
	renderer.render(scene, camera);

	// request next frame LAST
	requestAnimationFrame(render);
}

	// resize the renderer to fit the window size
	function resize ()
	{
		let width = window.innerWidth;
		let height = window.innerHeight
		
		camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
		camera.updateProjectionMatrix();
		renderer.setSize( width, height );
	}
}
