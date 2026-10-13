import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function BackAnimation3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Pure Black Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    // Subtle distant fog for 3D geometric objects only (stars will bypass fog for maximum radiance)
    scene.fog = new THREE.FogExp2(0x000000, 0.018);

    // 2. Perspective Camera
    const camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 20);

    // 3. WebGL Renderer with High-Gloss ACES Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: false,
      stencil: false,
      depth: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. Lighting Engine
    const ambientLight = new THREE.AmbientLight(0x080c1c, 1.4);
    scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
    rimLight.position.set(6, 12, 10);
    scene.add(rimLight);

    const blueLight = new THREE.PointLight(0x38bdf8, 5.5, 50, 1.2);
    blueLight.position.set(-10, 6, -2);
    scene.add(blueLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 4.8, 50, 1.2);
    purpleLight.position.set(10, -6, -2);
    scene.add(purpleLight);

    const mouseLight = new THREE.PointLight(0x60a5fa, 3.5, 30, 1.4);
    mouseLight.position.set(0, 0, 8);
    scene.add(mouseLight);

    // 5. Obsidian Black Glass & Metallic Chrome Materials
    const obsidianGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x05060a,
      metalness: 0.18,
      roughness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.95,
      transmission: 0.25,
      ior: 1.52,
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0x222a38,
      metalness: 0.96,
      roughness: 0.12,
    });

    const blueWireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
    });

    const purpleWireMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
    });

    // 6. Floating 3D Geometric Objects (Positioned around periphery for negative space)
    const objects = [];

    const addFloatingObject = (mesh, config) => {
      mesh.position.set(config.x, config.y, config.z);
      scene.add(mesh);
      objects.push({
        mesh,
        baseX: config.x,
        baseY: config.y,
        baseZ: config.z,
        ampX: config.ampX || 0.4,
        ampY: config.ampY || 0.7,
        speed: config.speed || 0.8,
        phase: config.phase || Math.random() * Math.PI * 2,
        rotSpeedX: config.rotSpeedX || 0.003,
        rotSpeedY: config.rotSpeedY || 0.004,
        rotSpeedZ: config.rotSpeedZ || 0.002,
      });
      return mesh;
    };

    // A. Glossy Obsidian Spheres
    const sphereGeo1 = new THREE.SphereGeometry(1.6, 48, 48);
    const sphere1 = new THREE.Mesh(sphereGeo1, obsidianGlassMat);
    addFloatingObject(sphere1, { x: -11.5, y: 5.5, z: -4, speed: 0.6, phase: 0.2, ampY: 0.8 });

    const sphereGeo2 = new THREE.SphereGeometry(1.2, 40, 40);
    const sphere2 = new THREE.Mesh(sphereGeo2, obsidianGlassMat);
    addFloatingObject(sphere2, { x: 12.2, y: -4.5, z: -3, speed: 0.7, phase: 1.8, ampY: 0.6 });

    const sphereGeo3 = new THREE.SphereGeometry(0.85, 36, 36);
    const sphere3 = new THREE.Mesh(sphereGeo3, obsidianGlassMat);
    addFloatingObject(sphere3, { x: -7.5, y: -7.0, z: -6, speed: 0.9, phase: 3.1, ampY: 0.5 });

    // B. Metallic Chrome Polyhedra
    const icosaGeo = new THREE.IcosahedronGeometry(1.3, 0);
    const chromeIcosa = new THREE.Mesh(icosaGeo, chromeMat);
    addFloatingObject(chromeIcosa, { x: 9.8, y: 6.8, z: -5, speed: 0.5, phase: 0.9, rotSpeedX: 0.006, rotSpeedY: 0.005 });

    const icosaWireMesh = new THREE.Mesh(icosaGeo.clone().scale(1.2, 1.2, 1.2), blueWireMat);
    chromeIcosa.add(icosaWireMesh);

    const octaGeo = new THREE.OctahedronGeometry(1.1, 0);
    const chromeOcta = new THREE.Mesh(octaGeo, chromeMat);
    addFloatingObject(chromeOcta, { x: -10.5, y: -2.8, z: -5, speed: 0.75, phase: 2.2, rotSpeedX: 0.005, rotSpeedZ: 0.004 });

    const octaWireMesh = new THREE.Mesh(octaGeo.clone().scale(1.22, 1.22, 1.22), purpleWireMat);
    chromeOcta.add(octaWireMesh);

    // C. Sleek Floating Toruses & Cyber Orbit Rings
    const torusGeo1 = new THREE.TorusGeometry(1.9, 0.22, 28, 64);
    const chromeTorus1 = new THREE.Mesh(torusGeo1, chromeMat);
    addFloatingObject(chromeTorus1, { x: 11.0, y: 0.8, z: -7, speed: 0.45, phase: 1.1, rotSpeedX: 0.004, rotSpeedY: 0.007 });

    const torusGeo2 = new THREE.TorusGeometry(2.3, 0.15, 24, 64);
    const obsidianTorus2 = new THREE.Mesh(torusGeo2, obsidianGlassMat);
    addFloatingObject(obsidianTorus2, { x: -9.0, y: 2.5, z: -8, speed: 0.55, phase: 2.7, rotSpeedX: 0.005, rotSpeedZ: 0.003 });

    // D. Futuristic Chrome Torus Knot
    const knotGeo = new THREE.TorusKnotGeometry(1.0, 0.28, 80, 16, 2, 3);
    const chromeKnot = new THREE.Mesh(knotGeo, chromeMat);
    addFloatingObject(chromeKnot, { x: -13.5, y: -6.5, z: -10, speed: 0.35, phase: 0.5, rotSpeedX: 0.004, rotSpeedY: 0.006 });

    // Satellite Orbit Rings
    const satRingGeo = new THREE.TorusGeometry(2.1, 0.04, 16, 64);
    const satRing1 = new THREE.Mesh(satRingGeo, chromeMat);
    satRing1.rotation.x = Math.PI / 3;
    sphere1.add(satRing1);

    const satRing2 = new THREE.Mesh(satRingGeo.clone(), blueWireMat);
    satRing2.rotation.y = Math.PI / 4;
    sphere2.add(satRing2);

    // 7. Subtle 3D Perspective Cyber Floor Grid
    const gridHelper = new THREE.GridHelper(80, 36, 0x1e3a8a, 0x090d16);
    gridHelper.position.set(0, -9.5, -6);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.35;
    scene.add(gridHelper);

    // =========================================================================
    // 8. RADIANT STAR LIGHT 3D ANIMATION ENGINE (Multi-Tier Cosmic Lighting)
    // =========================================================================

    // Generator 1: Radiant Supernova 8-Point Lens Flare Star Texture
    const createNovaStarTexture = () => {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d');

      // Brilliant core aura
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.08, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.2, 'rgba(224, 242, 254, 0.85)');
      grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.45)');
      grad.addColorStop(0.7, 'rgba(168, 85, 247, 0.15)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);

      // Major Horizontal & Vertical Starlight Beams
      const beamH = ctx.createLinearGradient(0, 64, 128, 64);
      beamH.addColorStop(0, 'rgba(255, 255, 255, 0)');
      beamH.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      beamH.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = beamH;
      ctx.fillRect(4, 62, 120, 4);

      const beamV = ctx.createLinearGradient(64, 0, 64, 128);
      beamV.addColorStop(0, 'rgba(255, 255, 255, 0)');
      beamV.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      beamV.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = beamV;
      ctx.fillRect(62, 4, 4, 120);

      // Diagonal Starlight Beams (45° angle)
      ctx.save();
      ctx.translate(64, 64);
      ctx.rotate(Math.PI / 4);
      const beamDiag1 = ctx.createLinearGradient(-40, 0, 40, 0);
      beamDiag1.addColorStop(0, 'rgba(255, 255, 255, 0)');
      beamDiag1.addColorStop(0.5, 'rgba(224, 242, 254, 0.7)');
      beamDiag1.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = beamDiag1;
      ctx.fillRect(-40, -1, 80, 2);

      const beamDiag2 = ctx.createLinearGradient(0, -40, 0, 40);
      beamDiag2.addColorStop(0, 'rgba(255, 255, 255, 0)');
      beamDiag2.addColorStop(0.5, 'rgba(224, 242, 254, 0.7)');
      beamDiag2.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = beamDiag2;
      ctx.fillRect(-1, -40, 2, 80);
      ctx.restore();

      const texture = new THREE.CanvasTexture(c);
      texture.needsUpdate = true;
      return texture;
    };

    // Generator 2: Diamond 4-Point Starlight Sparkle Texture
    const createDiamondStarTexture = () => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d');

      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.18, 'rgba(224, 242, 254, 0.9)');
      grad.addColorStop(0.45, 'rgba(96, 165, 250, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(32, 6);
      ctx.lineTo(32, 58);
      ctx.moveTo(6, 32);
      ctx.lineTo(58, 32);
      ctx.stroke();

      const texture = new THREE.CanvasTexture(c);
      texture.needsUpdate = true;
      return texture;
    };

    const novaTexture = createNovaStarTexture();
    const diamondTexture = createDiamondStarTexture();

    // -------------------------------------------------------------------------
    // TIER 1: Radiant Supernova Star Lights (80 prominent, brilliant star lights)
    // -------------------------------------------------------------------------
    const novaCount = 80;
    const novaPositions = new Float32Array(novaCount * 3);
    const novaColors = new Float32Array(novaCount * 3);
    const novaPhases = new Float32Array(novaCount);
    const novaSpeeds = new Float32Array(novaCount);

    const cWhite = new THREE.Color(0xffffff);
    const cCyan = new THREE.Color(0x38bdf8);
    const cPurple = new THREE.Color(0xc084fc);

    for (let i = 0; i < novaCount; i++) {
      novaPositions[i * 3] = (Math.random() - 0.5) * 70;
      novaPositions[i * 3 + 1] = (Math.random() - 0.5) * 44;
      novaPositions[i * 3 + 2] = -50 + Math.random() * 65;

      const pick = Math.random();
      const col = pick < 0.65 ? cWhite : pick < 0.85 ? cCyan : cPurple;
      novaColors[i * 3] = col.r;
      novaColors[i * 3 + 1] = col.g;
      novaColors[i * 3 + 2] = col.b;

      novaPhases[i] = Math.random() * Math.PI * 2;
      novaSpeeds[i] = 1.2 + Math.random() * 2.0;
    }

    const novaGeometry = new THREE.BufferGeometry();
    novaGeometry.setAttribute('position', new THREE.BufferAttribute(novaPositions, 3));
    novaGeometry.setAttribute('color', new THREE.BufferAttribute(novaColors, 3));

    const novaMaterial = new THREE.PointsMaterial({
      size: 1.85,
      map: novaTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false, // Bypasses fog to shine brilliantly against deep black
    });

    const novaField = new THREE.Points(novaGeometry, novaMaterial);
    scene.add(novaField);

    // -------------------------------------------------------------------------
    // TIER 2: Shimmering Diamond Star Lights (600 sparkling stars with forward drift)
    // -------------------------------------------------------------------------
    const diamondCount = 600;
    const diamondPositions = new Float32Array(diamondCount * 3);
    const diamondColors = new Float32Array(diamondCount * 3);
    const diamondVelocities = new Float32Array(diamondCount);
    const diamondTwinkles = new Float32Array(diamondCount);

    for (let i = 0; i < diamondCount; i++) {
      diamondPositions[i * 3] = (Math.random() - 0.5) * 80;
      diamondPositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      diamondPositions[i * 3 + 2] = -75 + Math.random() * 90;

      const pick = Math.random();
      const col = pick < 0.7 ? cWhite : pick < 0.88 ? cCyan : cPurple;
      diamondColors[i * 3] = col.r * 0.95;
      diamondColors[i * 3 + 1] = col.g * 0.95;
      diamondColors[i * 3 + 2] = col.b * 0.95;

      diamondVelocities[i] = 0.02 + Math.random() * 0.05;
      diamondTwinkles[i] = 1.0 + Math.random() * 2.5;
    }

    const diamondGeometry = new THREE.BufferGeometry();
    diamondGeometry.setAttribute('position', new THREE.BufferAttribute(diamondPositions, 3));
    diamondGeometry.setAttribute('color', new THREE.BufferAttribute(diamondColors, 3));

    const diamondMaterial = new THREE.PointsMaterial({
      size: 0.85,
      map: diamondTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });

    const diamondField = new THREE.Points(diamondGeometry, diamondMaterial);
    scene.add(diamondField);

    // -------------------------------------------------------------------------
    // TIER 3: Dense Cosmic Starlight Cloud (1,200 background stars)
    // -------------------------------------------------------------------------
    const dustCount = 1200;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    const dustVelocities = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 95;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      dustPositions[i * 3 + 2] = -85 + Math.random() * 100;

      const pick = Math.random();
      const col = pick < 0.75 ? cWhite : pick < 0.9 ? cCyan : cPurple;
      dustColors[i * 3] = col.r * 0.8;
      dustColors[i * 3 + 1] = col.g * 0.8;
      dustColors[i * 3 + 2] = col.b * 0.8;

      dustVelocities[i] = 0.015 + Math.random() * 0.035;
    }

    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMaterial = new THREE.PointsMaterial({
      size: 0.42,
      map: diamondTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });

    const dustField = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustField);

    // =========================================================================
    // 9. RADIANT SHOOTING STARS / METEORS WITH STARLIGHT HEADS
    // =========================================================================
    const maxShootingStars = 4;
    const shootingStars = [];

    for (let i = 0; i < maxShootingStars; i++) {
      const trailPoints = new Float32Array(6);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPoints, 3));

      const trailMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0x93c5fd : 0xd8b4fe,
        transparent: true,
        opacity: 0.0,
        linewidth: 2,
        blending: THREE.AdditiveBlending,
      });

      const lineMesh = new THREE.Line(trailGeo, trailMat);
      scene.add(lineMesh);

      // Glowing starlight sprite at the meteor head
      const headGeo = new THREE.BufferGeometry();
      headGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
      const headMat = new THREE.PointsMaterial({
        size: 1.6,
        map: novaTexture,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      });
      const headSprite = new THREE.Points(headGeo, headMat);
      scene.add(headSprite);

      shootingStars.push({
        line: lineMesh,
        headSprite,
        active: false,
        head: new THREE.Vector3(),
        tail: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        tailLength: 5.5 + Math.random() * 3.5,
        speed: 42 + Math.random() * 26,
        life: 0,
        maxLife: 1.1,
        nextSpawnTime: 1.0 + i * 2.0 + Math.random() * 2.5,
      });
    }

    const spawnShootingStar = (ss) => {
      const startX = -25 + Math.random() * 50;
      const startY = 14 + Math.random() * 8;
      const startZ = -28 + Math.random() * 20;

      ss.head.set(startX, startY, startZ);
      ss.tail.copy(ss.head);

      const angle = Math.PI * (0.68 + Math.random() * 0.18);
      ss.velocity.set(
        Math.cos(angle) * ss.speed,
        -Math.sin(angle) * ss.speed,
        (Math.random() - 0.5) * 6
      );

      ss.active = true;
      ss.life = 0;
      ss.maxLife = 0.85 + Math.random() * 0.55;
    };

    // 10. Interactive Mouse-Following Parallax Damping
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Window Resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // 11. Animation Loop
    let animationFrameId;
    const startTime = performance.now();
    let lastTime = startTime;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const currentTime = performance.now();
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      const elapsedTime = (currentTime - startTime) / 1000;

      // Smooth mouse damping (Lerp for cinematic fluid parallax)
      mouse.x += (mouse.targetX - mouse.x) * 0.045;
      mouse.y += (mouse.targetY - mouse.y) * 0.045;

      // Parallax camera panning
      camera.position.x = mouse.x * 2.4;
      camera.position.y = mouse.y * 1.6;
      camera.lookAt(0, 0, 0);

      // Move Interactive Mouse Spotlight
      mouseLight.position.x = mouse.x * 14;
      mouseLight.position.y = mouse.y * 10;

      // Orbital paths for accent neon point lights
      blueLight.position.x = Math.sin(elapsedTime * 0.35) * 14;
      blueLight.position.y = Math.cos(elapsedTime * 0.25) * 9;
      blueLight.position.z = Math.sin(elapsedTime * 0.18) * 6 - 3;

      purpleLight.position.x = Math.cos(elapsedTime * 0.3) * 14;
      purpleLight.position.y = Math.sin(elapsedTime * 0.38) * 9;
      purpleLight.position.z = Math.cos(elapsedTime * 0.22) * 6 - 3;

      // Floating 3D Geometric Objects Motion
      for (let i = 0; i < objects.length; i++) {
        const item = objects[i];
        const t = elapsedTime * item.speed + item.phase;

        item.mesh.position.y = item.baseY + Math.sin(t) * item.ampY;
        item.mesh.position.x = item.baseX + Math.cos(t * 0.8) * item.ampX;

        item.mesh.rotation.x += item.rotSpeedX;
        item.mesh.rotation.y += item.rotSpeedY;
        item.mesh.rotation.z += item.rotSpeedZ;
      }

      // =======================================================================
      // TIER 1 Star Light Animation: Pulsing Stellar Nova & Lens Flare Twinkle
      // =======================================================================
      const novaPos = novaGeometry.attributes.position.array;
      for (let i = 0; i < novaCount; i++) {
        // Subtle levitation of major star lights
        novaPos[i * 3 + 1] += Math.sin(elapsedTime * 1.5 + novaPhases[i]) * 0.003;
      }
      novaGeometry.attributes.position.needsUpdate = true;

      // Dynamic size pulse for radiant starlight twinkling
      novaMaterial.size = 1.85 + Math.sin(elapsedTime * 2.8) * 0.35;
      novaField.rotation.z = elapsedTime * 0.004;

      // =======================================================================
      // TIER 2 Star Light Animation: Infinite Forward Z-Flight & Twinkle
      // =======================================================================
      const dPos = diamondGeometry.attributes.position.array;
      const dCol = diamondGeometry.attributes.color.array;

      for (let i = 0; i < diamondCount; i++) {
        dPos[i * 3 + 2] += diamondVelocities[i];

        if (dPos[i * 3 + 2] > 18) {
          dPos[i * 3 + 2] = -75;
          dPos[i * 3] = (Math.random() - 0.5) * 80;
          dPos[i * 3 + 1] = (Math.random() - 0.5) * 50;
        }

        // Shimmering twinkle pulse
        const twinkle = 0.78 + 0.22 * Math.sin(elapsedTime * diamondTwinkles[i] + i);
        dCol[i * 3] = Math.min(1.0, dCol[i * 3] * twinkle);
      }
      diamondGeometry.attributes.position.needsUpdate = true;
      diamondField.rotation.y = elapsedTime * 0.006;
      diamondField.rotation.z = -elapsedTime * 0.003;

      // =======================================================================
      // TIER 3 Star Light Animation: Cosmic Dust Drift
      // =======================================================================
      const dustPos = dustGeometry.attributes.position.array;
      for (let i = 0; i < dustCount; i++) {
        dustPos[i * 3 + 2] += dustVelocities[i];

        if (dustPos[i * 3 + 2] > 18) {
          dustPos[i * 3 + 2] = -85;
          dustPos[i * 3] = (Math.random() - 0.5) * 95;
          dustPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
        }
      }
      dustGeometry.attributes.position.needsUpdate = true;
      dustField.rotation.y = elapsedTime * 0.003;

      // =======================================================================
      // Radiant Shooting Stars & Starlight Flares
      // =======================================================================
      for (let i = 0; i < maxShootingStars; i++) {
        const ss = shootingStars[i];

        if (ss.active) {
          ss.life += delta;
          const progress = ss.life / ss.maxLife;

          if (progress >= 1.0) {
            ss.active = false;
            ss.line.material.opacity = 0.0;
            ss.headSprite.material.opacity = 0.0;
            ss.nextSpawnTime = elapsedTime + 2.0 + Math.random() * 4.0;
          } else {
            ss.head.x += ss.velocity.x * delta;
            ss.head.y += ss.velocity.y * delta;
            ss.head.z += ss.velocity.z * delta;

            const dir = ss.velocity.clone().normalize();
            ss.tail.copy(ss.head).sub(dir.multiplyScalar(ss.tailLength));

            const fade = progress < 0.15 ? progress / 0.15 : 1.0 - (progress - 0.15) / 0.85;
            ss.line.material.opacity = Math.max(0, fade * 0.9);
            ss.headSprite.material.opacity = Math.max(0, fade * 0.95);

            // Update line
            const posArray = ss.line.geometry.attributes.position.array;
            posArray[0] = ss.tail.x;
            posArray[1] = ss.tail.y;
            posArray[2] = ss.tail.z;
            posArray[3] = ss.head.x;
            posArray[4] = ss.head.y;
            posArray[5] = ss.head.z;
            ss.line.geometry.attributes.position.needsUpdate = true;

            // Update head sprite position
            const headPos = ss.headSprite.geometry.attributes.position.array;
            headPos[0] = ss.head.x;
            headPos[1] = ss.head.y;
            headPos[2] = ss.head.z;
            ss.headSprite.geometry.attributes.position.needsUpdate = true;
          }
        } else {
          if (elapsedTime >= ss.nextSpawnTime) {
            spawnShootingStar(ss);
          }
        }
      }

      // Floor grid scroll
      gridHelper.position.z = -6 + (elapsedTime * 0.6 % 2);

      renderer.render(scene, camera);
    };

    animate();

    // 12. WebGL Resource Disposal on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      // Geometries
      sphereGeo1.dispose();
      sphereGeo2.dispose();
      sphereGeo3.dispose();
      icosaGeo.dispose();
      octaGeo.dispose();
      torusGeo1.dispose();
      torusGeo2.dispose();
      knotGeo.dispose();
      satRingGeo.dispose();
      gridHelper.geometry.dispose();
      novaGeometry.dispose();
      diamondGeometry.dispose();
      dustGeometry.dispose();
      novaTexture.dispose();
      diamondTexture.dispose();

      shootingStars.forEach((ss) => {
        ss.line.geometry.dispose();
        ss.line.material.dispose();
        ss.headSprite.geometry.dispose();
        ss.headSprite.material.dispose();
      });

      // Materials
      obsidianGlassMat.dispose();
      chromeMat.dispose();
      blueWireMat.dispose();
      purpleWireMat.dispose();
      novaMaterial.dispose();
      diamondMaterial.dispose();
      dustMaterial.dispose();
      gridHelper.material.dispose();

      // Renderer
      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-black">
      {/* 1. Real Three.js WebGL Radiant Star Light Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 2. Soft Edge Vignette framing pure black borders while keeping stars fully radiant */}
      <div 
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_60%,#000000_100%)] opacity-40" 
      />

      {/* 3. Subtle ambient electric cosmic starlight aura */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
