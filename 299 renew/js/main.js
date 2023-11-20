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
let groundEnemys = [];
let bullets = [];

let keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    mouse0Clicked: false
};


//setup function
initScence();
initWorld();

//temp----------------------------------------------------------
// playerLight = new THREE.PointLight(0xffffff, 10, 100); // soft white light
//scene.add(playerLight);

const boxgeometry = new THREE.BoxGeometry(2, 2, 2);
const basicmaterial = new THREE.MeshPhongMaterial();
const boxmesh = new THREE.Mesh(boxgeometry, basicmaterial);
scene.add(boxmesh);


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
    
}

// cannon world

function initWorld() {
    world = new CANNON.World();
    world.gravity.set(0, -9.81, 0);

    cannonDebugger = new CannonDebugger(scene, world, {
        color: 0xffffff,
        scale: 1.0,
    });

    const light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.castShadow = true;
    scene.add(light);
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
    const groundShape = new CANNON.Cylinder(50, 50, 0, 32);
    const groundBody = new CANNON.Body({
        mass: 0,
        shape: groundShape,
        material: groundMaterial
    });
    world.addBody(groundBody);

    const groundGeo = new THREE.CircleGeometry(50, 32);
    groundGeo.rotateX(-Math.PI / 2);
    const groundmesh = new THREE.Mesh(groundGeo, basicmaterial);
    groundmesh.receiveShadow = true;
    scene.add(groundmesh);

    for (var i = 0; i < 7; i++) {
        addGroundEnemy();
    }
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

function attachCameraToPlayer() {
    camera.position.copy(playerBody.position);
    camera.position.y += 2;
}

//-------------------------------------------------------------------------------------------------------------------
// Declare a keys object to track pressed keys


document.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
        keys['space'] = true;
    } else {
        keys[event.key] = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === ' ') {
        keys['space'] = false;
    } else {
        keys[event.key] = false;
    }
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

    if (keys.w) {
        velocityX += forward.x * moveSpeed;
        velocityZ += forward.z * moveSpeed;
    }
    if (keys.a) {
        velocityX += left.x * moveSpeed;
        velocityZ += left.z * moveSpeed;
    }
    if (keys.s) {
        velocityX += backward.x * moveSpeed;
        velocityZ += backward.z * moveSpeed;
    }
    if (keys.d) {
        velocityX += right.x * moveSpeed;
        velocityZ += right.z * moveSpeed;
    }
    if (keys.space && playerBody.position.y < 1) {
        playerBody.velocity.y = 18;
    }
    if (keys.mouse0Clicked) {
        shootBullet();
        keys.mouse0Clicked = false; // Reset mouse0Clicked after the shot is triggered
    }

    // Set the total velocity to the player body
    playerBody.velocity.x = velocityX;
    playerBody.velocity.z = velocityZ;
}
//-------------------------------------------------------------------------------------------------------------------

document.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
        keys.mouse0Clicked = true;
    }
})
//-------------------------------------------------------------------------------------------
function getRandomPositionInCircle(excludedRadius) {
    var angle = Math.random() * Math.PI * 2;
    var radius = Math.random() * (50 - excludedRadius) + excludedRadius;
    var x = radius * Math.cos(angle);
    var z = radius * Math.sin(angle);
    return { x: x, y: 1, z: z };
}

function addGroundEnemy() {
    var excludedRadius = 10; // Excluded radius around playerBody
    var randomPosition = getRandomPositionInCircle(excludedRadius);
    var x = randomPosition.x;
    var y = randomPosition.y;
    var z = randomPosition.z;

    var halfExtents = new CANNON.Vec3(1, 1, 1);
    var boxShape = new CANNON.Box(halfExtents);
    var boxGeometry = new THREE.BoxGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2);
    var material = new THREE.MeshLambertMaterial({ color: 0xdddddd });

    var groundEnemyBody = new CANNON.Body({
        mass: 1,
        shape: boxShape,
    });
    var groundEnemyMesh = new THREE.Mesh(boxGeometry, material);

    world.addBody(groundEnemyBody);
    scene.add(groundEnemyMesh);

    groundEnemyBody.position.set(x, y, z);
    groundEnemyMesh.position.set(x, y, z);
    groundEnemyMesh.castShadow = true;
    groundEnemyMesh.receiveShadow = true;
    groundEnemys.push({body:groundEnemyBody,mesh:groundEnemyMesh,helth:2});
}
setInterval(addGroundEnemy, 5000);


function updateGroundEnemy() {
    for (var i = 0; i < groundEnemys.length; i++) {
        const currGroundEnemy = groundEnemys[i];
        currGroundEnemy.mesh.position.copy(currGroundEnemy.body.position);
        currGroundEnemy.mesh.quaternion.copy(currGroundEnemy.body.quaternion);
    }
}


//bullet shooter
function shootBullet() {
    const bulletShape = new CANNON.Sphere(0.2);
    const bulletMaterial = new CANNON.Material("bulletMaterial");

    const bulletBody = new CANNON.Body({
        mass: 1,
        shape: bulletShape,
        material: bulletMaterial,
    });

    const bulletGeometry = new THREE.SphereGeometry(bulletShape.radius, 32, 32);
    const bulletMesh = new THREE.Mesh(bulletGeometry, new THREE.MeshLambertMaterial({ color: 0xff0000 }));

    // Set initial position and velocity
    const startPosition = playerBody.position.clone();
    startPosition.y += 2;
    const shootDirection = camera.getWorldDirection(new THREE.Vector3());
    const bulletVelocity = shootDirection.multiplyScalar(75);
    bulletBody.position.copy(startPosition);
    bulletBody.velocity.copy(bulletVelocity);

    // Add bullet to the world and scene
    world.addBody(bulletBody);
    scene.add(bulletMesh);

    // Store bullet objects for updating
    bullets.push({ body: bulletBody, mesh: bulletMesh ,createdAt: new Date().getTime()});
}



function updateBullets() {
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        bullet.mesh.position.copy(bullet.body.position);
        bullet.mesh.quaternion.copy(bullet.body.quaternion);

        const currentTime = new Date().getTime();
        const timeElapsed = currentTime - bullet.createdAt;
        if (timeElapsed > 5000) { // 5000 milliseconds (5 seconds) as an example
            // Remove the bullet from the world
            world.removeBody(bullet.body);
            // Remove the bullet from the scene
            scene.remove(bullet.mesh);
            // Remove the bullet from our bullets array
            bullets.shift();
        }
    }
}
world.addEventListener('beginContact', function(event) {
    let bulletIndex = bullets.findIndex(bullet => bullet.body === event.bodyA || bullet.body === event.bodyB);
    let enemyIndex = groundEnemys.findIndex(enemy => enemy.body === event.bodyA || enemy.body === event.bodyB);

    if (bulletIndex !== -1 && enemyIndex !== -1) {
        // Collision detected, remove the bullet and the enemy
        let bullet = bullets[bulletIndex];
        let enemy = groundEnemys[enemyIndex];

        setTimeout(() => {
            world.removeBody(bullet.body);
            scene.remove(bullet.mesh);
            bullets.splice(bulletIndex, 1);

            world.removeBody(enemy.body);
            scene.remove(enemy.mesh);
            groundEnemys.splice(enemyIndex, 1);
        }, 0);
    }
});




//animate
function animate() {
    cannonDebugger.update();
    handleKeys();
    world.step(timeStep);

    attachCameraToPlayer()


    boxmesh.position.copy(playerBody.position);
    //boxmesh.quaternion.copy(playerBody.quaternion);

    //playerLight.position.copy(playerBody.position);


    updateBullets();
    updateGroundEnemy()
    

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

