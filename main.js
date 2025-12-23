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
    
    // On utilise une caméra qui couvre l'écran interne
    camera = new THREE.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight, -1000, 1000);
    // On inverse le Y pour correspondre aux coordonnées écran (0 en haut)
    camera.up.set(0, -1, 0); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
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
    // Nettoyage
    spheres.forEach(s => world.remove(s));
    lines.forEach(l => world.remove(l));
    spheres = [];
    lines = [];

    const wins = windowManager.getWindows();

    wins.forEach((win) => {
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(30, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true })
        );
        world.add(sphere);
        spheres.push({ mesh: sphere, id: win.id });
    });

    // Création des lignes
    for (let i = 0; i < spheres.length - 1; i++) {
        const geometry = new THREE.BufferGeometry();
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
        world.add(line);
        lines.push(line);
    }
}

function animate() {
    windowManager.update();
    const wins = windowManager.getWindows();
    const currentWin = windowManager.getWinShape();

    // Mise à jour des positions des sphères relativement à la fenêtre actuelle
    spheres.forEach((sObj) => {
        const winData = wins.find(w => w.id === sObj.id);
        if (winData) {
            // Position absolue au centre de sa fenêtre parente
            const absX = winData.shape.x + winData.shape.w / 2;
            const absY = winData.shape.y + winData.shape.h / 2;

            // Position relative à NOTRE fenêtre
            sObj.mesh.position.x = absX - currentWin.x;
            sObj.mesh.position.y = absY - currentWin.y;
            
            sObj.mesh.rotation.y += 0.01;
        }
    });

    // Update des lignes
    lines.forEach((line, i) => {
        if(spheres[i] && spheres[i+1]) {
            line.geometry.setFromPoints([
                spheres[i].mesh.position.clone(),
                spheres[i + 1].mesh.position.clone()
            ]);
        }
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function resize() {
    camera.right = window.innerWidth;
    camera.bottom = window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
