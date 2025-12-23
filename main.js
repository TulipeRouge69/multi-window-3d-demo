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

    // Caméra avec une profondeur (Z) plus large pour éviter que les objets disparaissent
    camera = new THREE.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight, -2000, 2000);
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

// Classe de courbe pour les liaisons
class OrganicCurve extends THREE.Curve {
    constructor(p1, p2, time, offset) {
        super();
        this.p1 = p1.clone();
        this.p2 = p2.clone();
        this.time = time;
        this.offset = offset;
    }
    getPoint(t, optionalTarget = new THREE.Vector3()) {
        const mid = new THREE.Vector3().addVectors(this.p1, this.p2).multiplyScalar(0.5);
        mid.x += Math.sin(this.time + this.offset) * 30;
        mid.y += Math.cos(this.time + this.offset) * 30;
        const curve = new THREE.QuadraticBezierCurve3(this.p1, mid, this.p2);
        return curve.getPoint(t, optionalTarget);
    }
}

function build() {
    // Nettoyage propre
    while(world.children.length > 0){ 
        world.remove(world.children[0]); 
    }
    spheres = [];
    tubes = [];

    const wins = windowManager.getWindows();
    if (!wins) return;

    wins.forEach((win, index) => {
        const color = COLORS[index % COLORS.length];
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(80, 24, 24), 
            new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.7 })
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

    if (wins.length !== spheres.length) {
        build();
    }

    // 1. Positionnement des sphères
    spheres.forEach((sObj) => {
        const winData = wins.find(w => w.id === sObj.id);
        if (winData) {
            const absX = winData.shape.x + winData.shape.w / 2;
            const absY = winData.shape.y + winData.shape.h / 2;
            
            sObj.mesh.position.set(absX - currentWin.x, absY - currentWin.y, 0);
            sObj.mesh.rotation.y += 0.003; // Vitesse lente
        }
    });

    // 2. Mise à jour des tubes (liaisons)
    tubes.forEach((tObj) => {
        if (spheres[tObj.indexA] && spheres[tObj.indexB]) {
            const p1 = spheres[tObj.indexA].mesh.position;
            const p2 = spheres[tObj.indexB].mesh.position;
            
            const curve = new OrganicCurve(p1, p2, time, tObj.indexA);
            const tubeGeom = new THREE.TubeGeometry(curve, 32, 5, 8, false);
            
            // Appliquer le pincement au milieu
            const posAttr = tubeGeom.attributes.position;
            const p = new THREE.Vector3();
            const cp = new THREE.Vector3();

            for (let i = 0; i < posAttr.count; i++) {
                p.fromBufferAttribute(posAttr, i);
                const t = (Math.floor(i / 9) / 32); // 9 = radialSegments + 1
                const thickness = 1.1 - Math.sin(t * Math.PI) * 0.95; 
                curve.getPoint(t, cp);
                p.sub(cp).multiplyScalar(thickness).add(cp);
                posAttr.setXYZ(i, p.x, p.y, p.z);
            }

            if (tObj.mesh.geometry) tObj.mesh.geometry.dispose();
            tObj.mesh.geometry = tubeGeom;
        }
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.right = window.innerWidth;
    camera.bottom = window.innerHeight;
    camera.updateProjectionMatrix();
}
