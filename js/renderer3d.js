
var Renderer3D = {
    scene: null,
    camera: null,
    renderer: null,

    // Objects
    floor: null,
    hoopGroup: null,
    playerMesh: null,
    playerTexture: null,
    ballMeshes: [], // Pool of ball meshes
    decorGroup: null,

    // Textures
    ballTextures: {}, // Cache

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
        this.createPlayerSprite(); // 2D Sprite in 3D
        this.createDecorContainer();

        // 6. Pre-allocate balls
        this.createBallPool(20);

        this.initialized = true;
        this.resize(window.innerWidth, window.innerHeight);
    },

    createLighting: function() {
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
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
        // Create Canvas Texture for Floor Gradient
        const fCv = document.createElement('canvas');
        fCv.width = 512;
        fCv.height = 512;
        this.floorTexture = new THREE.CanvasTexture(fCv);

        const geometry = new THREE.PlaneGeometry(2000, 4000); // Court size approx
        const material = new THREE.MeshStandardMaterial({
            map: this.floorTexture,
            roughness: 0.8
        });

        this.floor = new THREE.Mesh(geometry, material);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.position.z = -500; // Shift back so 0 is near 3pt line
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);

        // Infinite Grass/Base Plane below
        const baseGeo = new THREE.PlaneGeometry(100000, 100000);
        const baseMat = new THREE.MeshBasicMaterial({ color: 0x228B22 }); // Default grass
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.rotation.x = -Math.PI / 2;
        base.position.y = -1; // Slightly below court
        this.scene.add(base);
        this.baseFloor = base;
    },

    createHoop: function() {
        // Reuse basic hoop for now, maybe billboard later?
        // Let's stick to 3D primitives for hoop but colored correctly
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

    createPlayerSprite: function() {
        // Dynamic Canvas Texture
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 512;
        pCanvas.height = 512;

        this.playerTexture = new THREE.CanvasTexture(pCanvas);
        this.playerTexture.minFilter = THREE.LinearFilter;
        this.playerTexture.magFilter = THREE.LinearFilter;

        // Sprite Material (Transparent)
        const mat = new THREE.MeshBasicMaterial({
            map: this.playerTexture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.1
        });

        // Player is roughly 100x200 in game pixels.
        // Scale factor: 1 unit = 1 pixel.
        // Plane size: 250 x 250 to fit the 512x512 texture.
        const geo = new THREE.PlaneGeometry(250, 250);

        this.playerMesh = new THREE.Mesh(geo, mat);
        this.playerMesh.castShadow = true;
        this.playerMesh.customDepthMaterial = new THREE.MeshDepthMaterial({
            depthPacking: THREE.RGBADepthPacking,
            map: this.playerTexture,
            alphaTest: 0.5
        });

        this.scene.add(this.playerMesh);
    },

    updatePlayerTexture: function() {
        if (!this.playerMesh || !window.drawPlayerToCanvas) return;

        const texture = this.playerTexture;
        const canvas = texture.image;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Mock a player object similar to what render.js expects for 'p'
        // p must have {x, y, scale}
        // We draw at center of canvas
        const p = {
            x: canvas.width / 2,
            y: canvas.height * 0.8, // Feet near bottom
            scale: 2.0, // Scale up for hi-res texture
            type: 'player'
        };

        window.drawPlayerToCanvas(ctx, p);

        texture.needsUpdate = true;
    },

    createBallPool: function(count) {
        // Reuse one geometry
        // 32x32 sphere approx radius 12
        const geo = new THREE.SphereGeometry(12, 32, 32);

        for(let i=0; i<count; i++) {
            // Material will be assigned dynamically based on ball type
            const mat = new THREE.MeshStandardMaterial({ color: 0xFF8800 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.visible = false;
            this.scene.add(mesh);
            this.ballMeshes.push(mesh);
        }
    },

    getBallTexture: function(ballId) {
        if (this.ballTextures[ballId]) return this.ballTextures[ballId];

        // Generate texture
        const size = 128;
        const cvs = document.createElement('canvas');
        cvs.width = size; cvs.height = size;
        const ctx = cvs.getContext('2d');

        const ballObj = BALLS_DB.find(b => b.id === ballId) || BALLS_DB[0];

        // Use the renderer helper
        if (window.drawBallToCanvas) {
            window.drawBallToCanvas(ctx, size, size, ballObj, 0);
        } else {
            ctx.fillStyle = 'orange'; ctx.fillRect(0,0,size,size);
        }

        const tex = new THREE.CanvasTexture(cvs);
        this.ballTextures[ballId] = tex;
        return tex;
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

    updateEnvironment: function() {
        // Update Sky Color based on Court
        let court;
        if (typeof getCourtDetails === 'function') {
            const currentDist = 10 + (distanceLevel * 5);
            court = getCourtDetails(currentDist);
        }

        if (court) {
             // Simple hex parse or just use top color for fog
             // Sky gradient is hard in Three without a shader skybox
             // We can set fog to average sky color
             this.scene.background = new THREE.Color(court.sky1 || 0x87CEEB);
             this.scene.fog.color = new THREE.Color(court.sky2 || 0x87CEEB);

             // Update Floor Texture
             const tex = this.floorTexture;
             const cvs = tex.image;
             const ctx = cvs.getContext('2d');

             // Draw Gradient
             const grad = ctx.createLinearGradient(0, 0, 0, 512);
             grad.addColorStop(0, court.ground1 || '#228B22');
             grad.addColorStop(1, court.ground2 || '#32CD32');
             ctx.fillStyle = grad;
             ctx.fillRect(0, 0, 512, 512);

             tex.needsUpdate = true;

             // Update infinite base color to match ground1 (horizon)
             if (this.baseFloor) {
                 this.baseFloor.material.color.setStyle(court.ground1 || '#228B22');
             }
        }
    },

    update: function(dt) {
        if (!this.initialized) return;

        this.updateEnvironment();

        if (window.g_camSmooth) {
            const cx = window.g_camSmooth.x;
            const cy = window.g_camSmooth.y;

            // Camera Logic (Third Person)
            const camOffsetZ = 600; // Closer for sprite details
            const camOffsetY = 300;

            this.camera.position.set(cx, camOffsetY, cy + camOffsetZ);

            // Look slightly ahead
            const lookTargetZ = cy - 400;
            const lookTargetY = 150;

            this.camera.lookAt(cx, lookTargetY, lookTargetZ);
        }

        if (window.player3D && this.playerMesh) {
            // Position
            this.playerMesh.position.set(player3D.x, player3D.z + 125, player3D.y); // +125 to align feet (plane center is 0,0)

            // Rotation - Always face camera (Billboard) or fixed?
            // "Third person facing basket" implies back view.
            // Our 2D drawing IS the back view.
            // So the sprite should face the camera (which is behind the player).
            // Camera is at +Z relative to player.
            // Sprite faces +Z by default.
            // So rotation 0 is correct.
            // But we might want it to "Billboard" slightly if camera moves side to side?
            // For now, strict back view is consistent with original 2D.
             this.playerMesh.lookAt(this.camera.position.x, this.playerMesh.position.y, this.camera.position.z);

            // Update Texture Animation every frame?
            // Only if anim state changes significantly?
            // To animate smoothly, we need to update every frame.
            this.updatePlayerTexture();
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

                    // Update Material/Texture based on ID
                    const ballId = playerData.currentBall || 'ball_classic';
                    // Optimization: Only update map if changed (not implementing deep check for now)
                    if (!mesh.material.map || mesh.userData.ballId !== ballId) {
                         mesh.material.map = this.getBallTexture(ballId);
                         mesh.userData.ballId = ballId;
                         mesh.material.needsUpdate = true;
                    }
                }
            });
        }
    },

    render: function() {
        if (!this.initialized) return;
        this.renderer.render(this.scene, this.camera);
    }
};
