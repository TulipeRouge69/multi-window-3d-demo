import WindowManager from "./WindowManager.js";

let scene, camera, renderer, world, windowManager;
let spheres = [];
let tubes = []; 

const COLORS = [0xff4444, 0x0088ff, 0x00ff88, 0xffcc00, 0xff44ff, 0x00ffff, 0xffffff];

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

// Courbe personnalisée avec mouvement organique
class OrganicCurve extends THREE.Curve {
    constructor(p1, p2, time, offset) {
        super();
        this.p1 = p1;
        this.p2 = p2;
        this.time = time;
        this.offset = offset;
    }
    getPoint(t, optionalTarget = new THREE.Vector3()) {
        const mid = new THREE.Vector3().addVectors(this.p1, this.p2).multiplyScalar(0.5);
        // Flottement organique du milieu
        mid.x += Math.sin(this.time + this.offset) * 40;
        mid.y += Math.cos(this.time + this.offset) * 40;
        
        const curve = new THREE.QuadraticBezierCurve3(this.p1, mid, this.p2);
        return curve.getPoint(t, optionalTarget);
    }
}

function build() {
    spheres.forEach(s => world.remove(s.mesh));
    tubes.forEach(t => world.remove(t.mesh));
    spheres = [];
    tubes = [];

    const wins = windowManager.getWindows();

    wins.forEach((win, index) => {
        const color = COLORS[index % COLORS.length];
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(80, 32, 32), 
            new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.6 })
        );
        world.add(sphere);
        spheres.push({ mesh: sphere, id: win.id });
    });

    for (let i = 0; i < spheres.length - 1; i++) {
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, wireframe: true });
        const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
        world.add(mesh);
        tubes.push({ mesh: mesh, indexA: i, indexB: i + 1 });
    }
}

function animate() {
    windowManager.update();
    const wins = windowManager.getWindows();
    const currentWin = windowManager.getWinShape();
    const time = performance.now() * 0.001;

    // Mise à jour des sphères
    spheres.forEach((sObj) => {
        const winData = wins.find(w => w.id === sObj.id);
        if (winData) {
            const absX = winData.shape.x + winData.shape.w / 2;
            const absY = winData.shape.y + winData.shape.h / 2;
            sObj.mesh.position.set(absX - currentWin.x, absY - currentWin.y, 0);
            
            // ROTATION CALME
            sObj.mesh.rotation.y += 0.003;
            sObj.mesh.rotation.z += 0.001;
        }
    });

    // Mise à jour des tubes à épaisseur variable
    tubes.forEach((tObj) => {
        const p1 = spheres[tObj.indexA].mesh.position.clone();
        const p2 = spheres[tObj.indexB].mesh.position.clone();
        const curve = new OrganicCurve(p1, p2, time, tObj.indexA);

        // On génère la géométrie de base
        const tubeGeom = new THREE.TubeGeometry(curve, 40, 6, 12, false);
        
        // MODIFICATION DE L'ÉPAISSEUR (le pincement au milieu)
        const pos = tubeGeom.attributes.position;
        const p = new THREE.Vector3();
        const centerPoint = new THREE.Vector3();

        for (let i = 0; i < pos.count; i++) {
            p.fromBufferAttribute(pos, i);
            
            // On retrouve à quel segment du tube appartient le point (de 0 à 40)
            const segmentIndex = Math.floor(i / 13); // 13 points par cercle de tube (radialSegments + 1)
            const t = segmentIndex / 40; // t va de 0 à 1 (début à fin du tube)

            // Facteur d'épaisseur : 1 aux bouts, 0.1 au milieu
            const thickness = 1.2 - Math.sin(t * Math.PI) * 1.1;

            // On récupère le point central de la courbe pour ce segment
            curve.getPoint(t, centerPoint);
            
            // On réduit la distance entre le point et le centre de la courbe
            p.sub(centerPoint).multiplyScalar(thickness).add(centerPoint);
            pos.setXYZ(i, p.x, p.y, p.z);
        }

        if (tObj.mesh.geometry) tObj.mesh.geometry.dispose();
        tObj.mesh.geometry = tubeGeom;
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
