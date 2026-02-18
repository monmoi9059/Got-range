
var Renderer3D = {
    scene: null,
    camera: null,
    renderer: null,

    // Objects
    floor: null,
    hoopGroup: null,
    playerGroup: null,
    playerParts: { lArm: null, rArm: null },
    ballMeshes: [], // Pool of ball meshes
    decorGroup: null,

    // State
    initialized: false,

    init: function() {
        if (this.initialized) return;

        console.log("Initializing Renderer3D...");

        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky Blue default
        this.scene.fog = new THREE.Fog(0x87CEEB, 2000, 15000);

        // 2. Camera (Perspective)
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 10, 20000);

        // 3. Renderer
        const existingCanvas = document.getElementById('gameCanvas');
        const webglCanvas = document.createElement('canvas');
        webglCanvas.id = 'webglCanvas';
        webglCanvas.style.position = 'absolute';
        webglCanvas.style.top = '0';
        webglCanvas.style.left = '0';
        webglCanvas.style.width = '100%';
        webglCanvas.style.height = '100%';
        webglCanvas.style.zIndex = '0'; // Behind UI

        existingCanvas.style.position = 'absolute';
        existingCanvas.style.top = '0';
        existingCanvas.style.left = '0';
        existingCanvas.style.zIndex = '10';
        existingCanvas.style.backgroundColor = 'transparent';

        existingCanvas.parentNode.insertBefore(webglCanvas, existingCanvas);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: webglCanvas,
            alpha: false
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 4. Lights
        this.createLighting();

        // 5. World
        this.createFloor();
        this.createHoop();
        this.createPlayer();
        this.createDecorContainer();

        // 6. Pre-allocate balls
        this.createBallPool(20);

        this.initialized = true;
        this.resize(window.innerWidth, window.innerHeight);
    },

    createLighting: function() {
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(500, 2000, 1000);
        dirLight.castShadow = true;

        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 5000;
        dirLight.shadow.camera.left = -2000;
        dirLight.shadow.camera.right = 2000;
        dirLight.shadow.camera.top = 2000;
        dirLight.shadow.camera.bottom = -2000;

        this.scene.add(dirLight);
    },

    createFloor: function() {
        const geometry = new THREE.PlaneGeometry(100000, 100000);
        const material = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 0.8
        });

        this.floor = new THREE.Mesh(geometry, material);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);
    },

    createHoop: function() {
        this.hoopGroup = new THREE.Group();

        const rimHeight = 130;

        const poleGeo = new THREE.CylinderGeometry(5, 5, rimHeight, 16);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = rimHeight / 2;
        pole.castShadow = true;
        this.hoopGroup.add(pole);

        const bbGeo = new THREE.BoxGeometry(70, 45, 5);
        const bbMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.9 });
        const bb = new THREE.Mesh(bbGeo, bbMat);
        bb.position.y = rimHeight + 20;
        bb.position.z = 10;
        bb.castShadow = true;
        this.hoopGroup.add(bb);

        const rimGeo = new THREE.TorusGeometry(15, 2, 16, 32);
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xFF4500 });
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = rimHeight;
        rim.position.z = 30;
        this.hoopGroup.add(rim);

        const netGeo = new THREE.CylinderGeometry(15, 10, 20, 16, 1, true);
        const netMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, wireframe: true, transparent: true, opacity: 0.5 });
        const net = new THREE.Mesh(netGeo, netMat);
        net.position.y = rimHeight - 10;
        net.position.z = 30;
        this.hoopGroup.add(net);

        if (typeof HOOP_POS !== 'undefined') {
            this.hoopGroup.position.set(HOOP_POS.x, 0, HOOP_POS.y);
        } else {
            this.hoopGroup.position.set(733, 0, 150);
        }

        this.scene.add(this.hoopGroup);
    },

    createPlayer: function() {
        this.playerGroup = new THREE.Group();

        const mat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });

        // Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(30, 50, 20), mat);
        body.position.y = 50;
        body.castShadow = true;
        this.playerGroup.add(body);

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(15, 16, 16), mat);
        head.position.y = 85;
        head.castShadow = true;
        this.playerGroup.add(head);

        // Arms
        const armGeo = new THREE.CylinderGeometry(4, 4, 30);
        armGeo.translate(0, -15, 0); // Pivot at top

        const lArm = new THREE.Mesh(armGeo, mat);
        lArm.position.set(-20, 70, 0);
        this.playerGroup.add(lArm);
        this.playerParts.lArm = lArm;

        const rArm = new THREE.Mesh(armGeo, mat);
        rArm.position.set(20, 70, 0);
        this.playerGroup.add(rArm);
        this.playerParts.rArm = rArm;

        this.scene.add(this.playerGroup);
    },

    createBallPool: function(count) {
        const geo = new THREE.SphereGeometry(12, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: 0xFF8800, roughness: 0.4 });

        for(let i=0; i<count; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.visible = false;
            this.scene.add(mesh);
            this.ballMeshes.push(mesh);
        }
    },

    createDecorContainer: function() {
        this.decorGroup = new THREE.Group();
        this.scene.add(this.decorGroup);
    },

    resize: function(w, h) {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    },

    update: function(dt) {
        if (!this.initialized) return;

        if (window.g_camSmooth) {
            const cx = window.g_camSmooth.x;
            const cy = window.g_camSmooth.y;
            this.camera.position.set(cx, 400, cy + 600);
            this.camera.lookAt(cx, 100, cy - 200);
        }

        if (window.player3D) {
            this.playerGroup.position.set(player3D.x, player3D.z, player3D.y);

            // Animation
            if (window.g_animState) {
                // Map 2D angles to 3D rotations
                // 2D: 0 is Right, PI/2 is Down.
                // 3D Arms: Default vertical down is rotation 0 (if geometry is vertical)
                // My geometry is pivot at top, length -30 (down).
                // So rotation 0 points down.

                // 2D Angle conversion:
                // Down is PI/2. Up is -PI/2.
                // 3D X Rot: 0 is Down? No, depends on mapping.
                // 2D: Up (-PI/2) -> Should be Arm Up (X Rot 180?)

                // Simplified mapping:
                // 2D Left Arm (shoulder): la
                // 2D Right Arm (shoulder): ra

                const leftAngle = g_animState.la;
                const rightAngle = g_animState.ra;

                // Map:
                // PI/2 (Down) -> 0
                // 0 (Right/Out) -> -PI/2 (Z axis)
                // -PI/2 (Up) -> -PI

                // Actually, shooting motion is forward (X axis rotation).
                // Let's map (angle - PI/2) to X rotation.

                if (this.playerParts.lArm) {
                    this.playerParts.lArm.rotation.x = -(leftAngle - Math.PI/2);
                }
                if (this.playerParts.rArm) {
                    this.playerParts.rArm.rotation.x = -(rightAngle - Math.PI/2);
                }
            }
        }

        this.ballMeshes.forEach(b => b.visible = false);

        if (window.activeBalls) {
            window.activeBalls.forEach((b, i) => {
                if (b.active && i < this.ballMeshes.length) {
                    const mesh = this.ballMeshes[i];
                    mesh.visible = true;
                    mesh.position.set(b.x, b.z, b.y);
                    mesh.rotation.x = b.rotationX;
                    mesh.rotation.y = b.rotationY || 0;
                }
            });
        }
    },

    render: function() {
        if (!this.initialized) return;
        this.renderer.render(this.scene, this.camera);
    }
};
