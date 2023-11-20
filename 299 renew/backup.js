import * as THREE from '../js/three.module.js';
import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/loaders/GLTFLoader.js';

import { PointerLockControls } from './PointerLockControls.js';
import CannonDebugger from './cannon-es-debugger.js';
import * as CANNON from "../js/cannon-es.js";


//declare variable
let camera, renderer, scene;
let world, cannonDebugger;
let control;
let timeStep = 1 / 60;
let groundMaterial, playerMaterial;
let playerBody;



//setup function
initScence();
initWorld();

//temp----------------------------------------------------------
const playerLight = new THREE.PointLight(0xffffff, 10, 100); // soft white light
scene.add(playerLight);

const boxgeometry = new THREE.BoxGeometry(2, 2, 2);
const basicmaterial = new THREE.MeshPhongMaterial();
const boxmesh = new THREE.Mesh(boxgeometry, basicmaterial);
scene.add(boxmesh);

const groundGeo = new THREE.CylinderGeometry(200, 200, 0, 32);
const groundmesh = new THREE.Mesh(groundGeo, basicmaterial);
scene.add(groundmesh);
//--------------------------------------------------------------

initPointerLockControls();
createGround();
createPlayer();
animate();








// 3js camera,renderer,scene
function initScence() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    //const grid = new THREE.GridHelper(1000,1000);
    //scene.add(grid);
}

// cannon world

function initWorld() {
    world = new CANNON.World();
    world.gravity.set(0, -9.81, 0);

    cannonDebugger = new CannonDebugger(scene, world, {
        color: 0xffffff,
        scale: 1.0,
    });

    const light = new THREE.DirectionalLight(0xffffff, 0.1); // soft white light
    light.position.set(5, 10, 2);
    scene.add(light);
    scene.add.apply(light.target);
}

//pointerlock controls
function initPointerLockControls() {
    control = new PointerLockControls(camera, renderer.domElement);
    document.getElementById('btnPlay').onclick = () => {
        control.lock();
    }

}

//createground
function createGround() {
    groundMaterial = new CANNON.Material("groundMaterial");
    const groundShape = new CANNON.Cylinder(200, 200, 0, 32);
    const groundBody = new CANNON.Body({
        mass: 0,
        shape: groundShape,
        material: groundMaterial
    });
    world.addBody(groundBody);
}


//createplayer
function createPlayer() {
    playerMaterial = new CANNON.Material("playerMaterial");

    const playerBodyShape = new CANNON.Sphere(1);

    playerBody = new CANNON.Body({
        mass: 1,
        shape: playerBodyShape,
        material: playerMaterial
    });
    playerBody.position.set(0, 1, 0);

    playerBody.linearDamping = 0.5;

    world.addBody(playerBody);

}

// function attachCameraToPlayer() {
//     camera.position.copy(playerBody.position);
//     camera.position.y += 2;
// }

//-------------------------------------------------------------------------------------------------------------------
// Declare a keys object to track pressed keys
const keys = {};

document.addEventListener('keydown', (event) => {
    keys[event.key] = true;

    handleKeys();
});

document.addEventListener('keyup', (event) => {
    keys[event.key] = false;

    handleKeys();
});
function handleKeys() {
    const moveSpeed = 5;

    const forward = new THREE.Vector3(0, 0, -1);
    const left = new THREE.Vector3(-1, 0, 0);
    const backward = new THREE.Vector3(0, 0, 1);
    const right = new THREE.Vector3(1, 0, 0);

    forward.applyQuaternion(camera.quaternion);
    left.applyQuaternion(camera.quaternion);
    backward.applyQuaternion(camera.quaternion);
    right.applyQuaternion(camera.quaternion);

    // Initialize velocity components
    let velocityX = 0;
    let velocityZ = 0;

    for (const key in keys) {
        if (keys[key]) {
            switch (key) {
                case "w":
                    velocityX += forward.x * moveSpeed;
                    velocityZ += forward.z * moveSpeed;
                    break;
                case "a":
                    velocityX += left.x * moveSpeed;
                    velocityZ += left.z * moveSpeed;
                    break;
                case "s":
                    velocityX += backward.x * moveSpeed;
                    velocityZ += backward.z * moveSpeed;
                    break;
                case "d":
                    velocityX += right.x * moveSpeed;
                    velocityZ += right.z * moveSpeed;
                    break;
                case " ":
                    if (playerBody.position.y <= 1) {
                        playerBody.velocity.y += 10;
                    }
                    break;
            }
        }
    }

    // Set the total velocity to the player body
    playerBody.velocity.x = velocityX;
    playerBody.velocity.z = velocityZ;
}

function createCirclesOverTime(numCircles, interval) {
    let createdCircles = 0;

    const createCircle = () => {
        // Generate random position within the ground circle
        const theta = Math.random() * Math.PI * 2; // Random angle
        const radius = Math.random() * 20; // Random radius within the ground circle
        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta);

        // Create unique material for each circle
        const circleMaterial = new CANNON.Material(`circleMaterial${createdCircles}`);

        // Create Cannon sphere
        const circleShape = new CANNON.Sphere(1); // Assuming radius 1 for the circles
        const circleBody = new CANNON.Body({
            mass: 1,
            shape: circleShape,
            material: circleMaterial,
        });
        circleBody.position.set(x, 1, z);

        // Add the circle to the world
        world.addBody(circleBody);

        // Increment the count
        createdCircles++;
    };

    const createCirclesInterval = setInterval(() => {
        if (createdCircles < numCircles) {
            createCircle();
        } else {
            clearInterval(createCirclesInterval);
        }
    }, interval);
}

// Call the function to create circles over time (e.g., 1 circle every 2 seconds, total 10 circles)
createCirclesOverTime(10, 2000);






//animate
function animate() {
    cannonDebugger.update();

    world.step(timeStep);

    //attachCameraToPlayer()


    boxmesh.position.copy(playerBody.position);
    
    playerLight.position.copy(playerBody.position);

    renderer.render(scene, camera);

    requestAnimationFrame(animate);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); // Fix the typo here
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

const normalGround_cm = new CANNON.ContactMaterial(groundMaterial, playerMaterial, {
    friction: 0.5,
    restitution: 0.5,
});

world.addContactMaterial(normalGround_cm);