import WindowManager from "./WindowManager.js";

let scene, camera, renderer, world, windowManager;
let spheres = [];
let lines = [];

init();
animate();

function init() {
    windowManager = new WindowManager();
    windowManager.init();

    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Fond noir bien opaque pour éviter les traînées

    // CAMERA
    camera = new THREE.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight, -1000, 1000);
    camera.up.set(0, -1, 0); 

    // RENDERER
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
    // NETTOYAGE : Supprimer les anciens objets pour éviter les doublons
    spheres.forEach(s => world.remove(s.mesh));
    lines.forEach(l => world.remove(l));
    spheres = [];
    lines = [];

    const wins = windowManager.getWindows();
    const myId = windowManager.getThisWindowID();

    wins.forEach((win) => {
        // COULEUR : Jaune/Or pour "Moi", Vert pour les "Autres"
        const color = (win.id === myId) ? 0xffcc00 : 0x00ff88;
        
        // TAILLE : Augmentée à 80
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(80, 20, 20), 
            new THREE.MeshBasicMaterial({ color: color, wireframe: true })
        );
        
        world.add(sphere);
        spheres.push({ mesh: sphere, id: win.id });
    });

    // Création des lignes entre les sphères
    for (let i = 0; i < spheres.length - 1; i++) {
        const geometry = new THREE.BufferGeometry();
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
        world.add(line);
        lines.push(line);
    }
}

function animate() {
    windowManager.update();
    const wins = windowManager.getWindows();
    const currentWin = windowManager.getWinShape();

    // On efface bien l'écran précédent
    renderer.render(scene, camera);

    spheres.forEach((sObj) => {
        const winData = wins.find(w => w.id === sObj.id);
        if (winData) {
            // Calcul de la position globale -> locale
            const absX = winData.shape.x + winData.shape.w / 2;
            const absY = winData.shape.y + winData.shape.h / 2;

            sObj.mesh.position.x = absX - currentWin.x;
            sObj.mesh.position.y = absY - currentWin.y;
            
            sObj.mesh.rotation.y += 0.01;
            sObj.mesh.rotation.x += 0.005;
        }
    });

    // Mise à jour des lignes
    lines.forEach((line, i) => {
        if(spheres[i] && spheres[i+1]) {
            line.geometry.setFromPoints([
                spheres[i].mesh.position.clone(),
                spheres[i + 1].mesh.position.clone()
            ]);
        }
    });

    requestAnimationFrame(animate);
}

function resize() {
    camera.right = window.innerWidth;
    camera.bottom = window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
