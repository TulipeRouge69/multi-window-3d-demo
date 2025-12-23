import WindowManager from "./WindowManager.js";

let scene, camera, renderer, world, windowManager;
let spheres = [];
let lines = [];

init();
animate();

function init() {
    windowManager = new WindowManager();
    windowManager.init();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); 

    camera = new THREE.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight, -1000, 1000);
    camera.up.set(0, -1, 0); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    world = new THREE.Group();
    scene.add(world);

    windowManager.setWinChangeCallback(build);
    windowManager.setWinShapeChangeCallback(build);

    window.addEventListener("resize", resize);
    build();
}

function build() {
    // Nettoyage complet
    spheres.forEach(s => world.remove(s.mesh));
    lines.forEach(l => world.remove(l));
    spheres = [];
    lines = [];

    const wins = windowManager.getWindows();
    const myId = windowManager.getThisWindowID();

    // Création des sphères (Taille 80)
    wins.forEach((win) => {
        const color = (win.id === myId) ? 0xffcc00 : 0x00ff88;
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(80, 20, 20), 
            new THREE.MeshBasicMaterial({ color: color, wireframe: true })
        );
        world.add(sphere);
        spheres.push({ mesh: sphere, id: win.id });
    });

    // Création des lignes
    for (let i = 0; i < spheres.length - 1; i++) {
        const geometry = new THREE.BufferGeometry();
        // On initialise avec des points à zéro
        geometry.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
        world.add(line);
        lines.push(line);
    }
}

function animate() {
    windowManager.update();
    const wins = windowManager.getWindows();
    const currentWin = windowManager.getWinShape();

    // 1. D'abord, on place toutes les sphères
    spheres.forEach((sObj) => {
        const winData = wins.find(w => w.id === sObj.id);
        if (winData) {
            const absX = winData.shape.x + winData.shape.w / 2;
            const absY = winData.shape.y + winData.shape.h / 2;

            sObj.mesh.position.x = absX - currentWin.x;
            sObj.mesh.position.y = absY - currentWin.y;
            
            sObj.mesh.rotation.y += 0.01;
        }
    });

    // 2. Ensuite, on relie les lignes aux nouvelles positions des sphères
    lines.forEach((line, i) => {
        if(spheres[i] && spheres[i+1]) {
            line.geometry.setFromPoints([
                spheres[i].mesh.position,
                spheres[i + 1].mesh.position
            ]);
            line.geometry.attributes.position.needsUpdate = true; // Indispensable pour voir le changement !
        }
    });

    // 3. EN DERNIER, on dessine la scène (évite le glitch en haut à gauche)
    renderer.render(scene, camera);
    
    requestAnimationFrame(animate);
}

function resize() {
    camera.right = window.innerWidth;
    camera.bottom = window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
