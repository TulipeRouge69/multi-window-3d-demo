import WindowManager from "./WindowManager.js";

let scene, camera, renderer, world, windowManager;
let spheres = [];
let curves = []; // On remplace les lignes par des courbes

const COLORS = [0xff0000, 0x0088ff, 0x00ff88, 0xffcc00, 0xff00ff, 0x00ffff, 0xffffff];

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
    spheres.forEach(s => world.remove(s.mesh));
    curves.forEach(c => world.remove(c.line));
    spheres = [];
    curves = [];

    const wins = windowManager.getWindows();

    wins.forEach((win, index) => {
        const color = COLORS[index % COLORS.length];
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(80, 25, 25), 
            new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.8 })
        );
        world.add(sphere);
        spheres.push({ mesh: sphere, id: win.id });
    });

    // Création des liaisons organiques (Courbes)
    for (let i = 0; i < spheres.length - 1; i++) {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
        const line = new THREE.Line(geometry, material);
        
        world.add(line);
        curves.push({ line: line, indexA: i, indexB: i + 1 });
    }
}

function animate() {
    windowManager.update();
    const wins = windowManager.getWindows();
    const currentWin = windowManager.getWinShape();
    const time = performance.now() * 0.0005; // Temps pour l'animation organique

    spheres.forEach((sObj) => {
        const winData = wins.find(w => w.id === sObj.id);
        if (winData) {
            const absX = winData.shape.x + winData.shape.w / 2;
            const absY = winData.shape.y + winData.shape.h / 2;

            sObj.mesh.position.x = absX - currentWin.x;
            sObj.mesh.position.y = absY - currentWin.y;
            
            // ROTATION PLUS LENTE (0.005 au lieu de 0.01)
            sObj.mesh.rotation.y += 0.005;
            sObj.mesh.rotation.x += 0.002;
        }
    });

    // MISE À JOUR DES LIAISONS ORGANIQUES
    curves.forEach((c) => {
        const p1 = spheres[c.indexA].mesh.position;
        const p2 = spheres[c.indexB].mesh.position;

        // On crée un point de contrôle au milieu qui bouge avec le temps pour l'effet "organique"
        const midX = (p1.x + p2.x) / 2 + Math.sin(time + c.indexA) * 50;
        const midY = (p1.y + p2.y) / 2 + Math.cos(time + c.indexA) * 50;
        const mid = new THREE.Vector3(midX, midY, 0);

        // Création d'une courbe quadratique fluide
        const curve = new THREE.QuadraticBezierCurve3(p1.clone(), mid, p2.clone());
        const points = curve.getPoints(20); // 20 segments pour la fluidité
        
        c.line.geometry.setFromPoints(points);
        c.line.geometry.attributes.position.needsUpdate = true;
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
