import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};
let spine, head, hips, leftHand;

export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.player = null;

    this.camera = new THREE.PerspectiveCamera(
      75,
      device.width / device.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 2, 5);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));

    this.controls = new OrbitControls(this.camera, this.canvas);

    this.clock = new THREE.Clock();


    this.setLights();
    this.setGeometry();
    this.render();
    this.setResize();

    document.addEventListener('mousemove', (e) => {
      let mousecoords = this.getMousePos(e);
      if (spine && head) {
        this.moveJoint(mousecoords, head, 50);
        this.moveJoint(mousecoords, spine, 30);
        // this.moveJoint(mousecoords, leftHand, 800);
        // this.moveJoint(mousecoords, hips, 2);
      }
    });
  }

  getMousePos(e) {
    return { x: e.clientX, y: e.clientY };
  }

  moveJoint(mouse, joint, degreeLimit) {
    let degrees = this.getMouseDegrees(mouse.x, mouse.y, degreeLimit);
    joint.rotation.y = THREE.MathUtils.degToRad(degrees.x);
    joint.rotation.x = THREE.MathUtils.degToRad(degrees.y);
  }

  getMouseDegrees(x, y, degreeLimit) {
    let dx = 0,
      dy = 0,
      xdiff,
      xPercentage,
      ydiff,
      yPercentage;

    let w = { x: window.innerWidth, y: window.innerHeight };

    // Left (Rotates neck left between 0 and -degreeLimit)

    // 1. If cursor is in the left half of screen
    if (x <= w.x / 2) {
      // 2. Get the difference between middle of screen and cursor position
      xdiff = w.x / 2 - x;
      // 3. Find the percentage of that difference (percentage toward edge of screen)
      xPercentage = (xdiff / (w.x / 2)) * 100;
      // 4. Convert that to a percentage of the maximum rotation we allow for the neck
      dx = ((degreeLimit * xPercentage) / 100) * -1;
    }
    // Right (Rotates neck right between 0 and degreeLimit)
    if (x >= w.x / 2) {
      xdiff = x - w.x / 2;
      xPercentage = (xdiff / (w.x / 2)) * 100;
      dx = (degreeLimit * xPercentage) / 100;
    }
    // Up (Rotates neck up between 0 and -degreeLimit)
    if (y <= w.y / 2) {
      ydiff = w.y / 2 - y;
      yPercentage = (ydiff / (w.y / 2)) * 100;
      // Note that I cut degreeLimit in half when she looks up
      dy = (((degreeLimit * 0.5) * yPercentage) / 100) * -1;
    }

    // Down (Rotates neck down between 0 and degreeLimit)
    if (y >= w.y / 2) {
      ydiff = y - w.y / 2;
      yPercentage = (ydiff / (w.y / 2)) * 100;
      dy = (degreeLimit * yPercentage) / 100;
    }
    return { x: dx, y: dy };
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(new THREE.Color(1, 1, 1, 1), 1);
    this.directionalLight.position.set(0, 10, 0);
    this.scene.add(this.directionalLight);

    if (head) {

    }
  }

  setGeometry() {
    // this.planeGeometry = new THREE.PlaneGeometry(1, 1, 128, 128);
    // this.planeMaterial = new THREE.ShaderMaterial({
    //   side: THREE.DoubleSide,
    //   wireframe: true,
    //   fragmentShader: fragment,
    //   vertexShader: vertex,
    //   uniforms: {
    //     progress: { type: 'f', value: 0 }
    //   }
    // });

    // this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    // this.scene.add(this.planeMesh);

    // this.loader = new FBXLoader();
    this.loader = new GLTFLoader();
    // this.loader.load('src/assets/character.fbx', (fbx) => {
    //   fbx.traverse((child) => {
    //     if (child.isMesh) {
    //       console.log(child.name);
    //     }
    //   });
    //   this.player = fbx;
    //   this.scene.add(fbx);
    //   this.player.position.y = -50;
    // });

    this.loader.load('src/assets/player2.glb', (glb) => {
      console.log(glb.scene)
      spine = glb.scene.children[0].children[0].children[0].children[0].children[1].children[0].children[0].children[0].children[0]
      glb.scene.traverse((child) => {
        if (child.isBone && child.name === 'mixamorigNeck_05') {
          // console.log(child)
          head = child

          this.pointLight = new THREE.PointLight(new THREE.Color(0xff0000), 1);
          this.pointLight.position.y = head.position.y - 10.5;
          this.pointLight.distance = -100; // Set the distance of the point light
          this.scene.add(this.pointLight);

          // Helper for point light
          const pointLightHelper = new THREE.PointLightHelper(this.pointLight);
          // this.scene.add(pointLightHelper);
        }
        if (child.isBone && child.name === 'mixamorigHips_01') {
          // console.log(child)
          hips = child
        }
        if (child.isMesh) {
          if (child.material.name == "Spartan_Helmet_Mat") {
            child.material.transparent = true;
            child.material.opacity = 1;
          }
        }
      });
      this.player = glb.scene;
      this.scene.add(glb.scene);
      this.player.position.y = -1;
    });
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  setResize() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    device.width = window.innerWidth;
    device.height = window.innerHeight;

    this.camera.aspect = device.width / device.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
  }
}
