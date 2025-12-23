import WindowManager from "./WindowManager.js";

let scene, camera, renderer, world, windowManager;
let spheres = [];
let lines = [];

// Liste de couleurs stables (tu peux en ajouter autant que tu veux)
const COLORS = [
    0xff0000, // 1: Rouge
    0x0088ff, // 2: Bleu
    0x00ff88, // 3: Vert
    0xffcc00, // 4: Jaune/Or
    0xff00ff, // 5: Rose
    0x00ffff, // 6: Cyan
    0xffffff  // 7: Blanc
];

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
    lines.forEach(l => world.remove(l));
    spheres = [];
    lines = [];

    const wins = windowManager.getWindows();

    wins.forEach((win, index) => {
        // On choisit la couleur selon l'index (avec % pour boucler si + de 7 fenêtres)
        const colorIndex = index % COLORS.length;
        const color = COLORS[colorIndex];
        
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(80, 20, 20), 
            new THREE.MeshBasicMaterial({ color: color, wireframe: true })
        );
        
        world.add(sphere);
        spheres.push({ mesh: sphere, id: win.id });
    });

    for (let i = 0; i < spheres.length - 1; i++) {
        const geometry = new THREE.BufferGeometry();
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

    lines.forEach((line, i) => {
        if(spheres[i] && spheres[i+1]) {
            line.geometry.setFromPoints([
                spheres[i].mesh.position,
                spheres[i + 1].mesh.position
            ]);
            line.geometry.attributes.position.needsUpdate = true;
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
