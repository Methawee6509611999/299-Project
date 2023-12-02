import * as THREE from '../js/three.module.js';
import { GLTFLoader } from '../js/GLTFLoader.js';

import { PointerLockControls } from './PointerLockControls.js';
import CannonDebugger from './cannon-es-debugger.js';
import * as CANNON from "../js/cannon-es.js";


//declare variable
let isPaused = true;
let camera, renderer, scene;
let world, cannonDebugger;
let control;
//timestep for cannon
let timeStep = 1 / 60;
let playerMaterial;
let playerBody,gun;
let playerLight;
//ground enemy array
let groundEnemys = []; let groundEnemySpeed = 3;
//bullets array
let bullets = [];
let score = 0;
//animation time
let time = 0;
// Create an Audio object
var audio = new Audio();

let keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    mouse0Clicked: false
};


//setup function
initAudio();
initScence();
initWorld();

//temp----------------------------------------------------------




//--------------------------------------------------------------

initPointerLockControls();
createPlayer();
createGround();
animate();






function initAudio(){
    audio.src = '../models/ghost choir.mp3';
    audio.play();
    audio.loop = true;
    audio.volume = 0.3;
}

// 3js camera,renderer,scene
function initScence() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);

    //quality,size
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    //shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.background = new THREE.CubeTextureLoader()
        .setPath('../models/')
        .load([
            'posx.jpg',
            'negx.jpg',
            'posy.jpg',
            'negy.jpg',
            'posz.jpg',
            'negz.jpg'
        ]);
    {
        const skyColor = 0xffcd61;  // average sky color
        const groundColor = 0xB97A20;  // brownish orange
        const intensity = 2;
        const skylight = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        scene.add(skylight);
    }
    const light = new THREE.DirectionalLight(0xffffff, 2);

    //shadows
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 1000;
    light.shadow.camera.left = -500;
    light.shadow.camera.right = 500;
    light.shadow.camera.top = 500;
    light.shadow.camera.bottom = -500;


    light.position.set(0, 10, 10);
    
    scene.add(light);

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
    
}

//pointerlock controls
function initPointerLockControls() {
    control = new PointerLockControls(camera, renderer.domElement);
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    blocker.onclick = () => {
        control.lock();
        if (isPaused) {
            isPaused = false;
            control.enabled = true;
        }
    }

    // Add event listeners for the 'lock' and 'unlock' events
    control.addEventListener('lock', () => {
        blocker.style.display = 'none';
        instructions.style.display = 'none';
    });

    control.addEventListener('unlock', () => {
        control.enabled = false;

        blocker.style.display = '-webkit-box';
        blocker.style.display = '-moz-box';
        blocker.style.display = 'box';

        instructions.style.display = '';
        pauseGame();
    });

}

function pauseGame() {
    isPaused = true;
}

//createground
function createGround() {
    //create groundbody
    groundMaterial = new CANNON.Material("groundMaterial");
    const groundShape = new CANNON.Cylinder(50, 50, 0, 32);
    const groundBody = new CANNON.Body({
        mass: 0,
        shape: groundShape,
        material: groundMaterial
    });

    world.addBody(groundBody);

    //create groundmesh
    // Load the texture
    var texture = new THREE.TextureLoader().load('../models/cobble_stone.png');

    // Repeat the texture
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(32, 32); // Adjust these values to change the size of the tiles

    // Create a material using the texture
    var groundMaterial = new THREE.MeshPhongMaterial({ map: texture });
    groundMaterial.receiveShadow = true;


    const groundGeo = new THREE.CircleGeometry(50, 32);
    groundGeo.rotateX(-Math.PI / 2);

    // Use MeshToonMaterial for ground
    const groundmesh = new THREE.Mesh(groundGeo, groundMaterial);

    // Add shadows to the ground
    groundmesh.receiveShadow = true;

    
    const gltfLoader = new GLTFLoader();
    gltfLoader.load("../models/light2.gltf", (gltf) => {
        if (!gltf) {
            console.log('Model not loaded');
            return;
        }
        var lamp = gltf.scene;
        lamp.position.set(0, 0, 0);
        lamp.receiveShadow = true;
        lamp.castShadow = true;
        const lampLight1 = new THREE.PointLight(0xffd469, 100, 100); // soft white light
        lampLight1.position.set(2, 12, 0);
        scene.add(lampLight1);
        const lampLight2 = new THREE.PointLight(0xffd469, 100, 100); // soft white light
        lampLight2.position.set(-2, 12, 0);
        scene.add(lampLight2);
        const lampLight3 = new THREE.PointLight(0xffd469, 100, 100); // soft white light
        lampLight3.position.set(0, 12, 2);
        scene.add(lampLight3);
        const lampLight4 = new THREE.PointLight(0xffd469, 100, 100); // soft white light
        lampLight4.position.set(0, 12, -2);
        scene.add(lampLight4);
        // glass = lamp.getObjectByName('Cube.001');
        // glass.material= new THREE.MeshPhongMaterial({color: 0x000000, transparent: true, opacity: 0.5});
        lamp.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        scene.add(lamp);

    });
    //add ground to tree.js scene
    scene.add(groundmesh);

    //add initial ground enemy
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
    const gltfLoader = new GLTFLoader();
    gltfLoader.load("../models/Point_hand.gltf", (gltf) => {
        if (!gltf) {
            console.log('Model not loaded');
            return;
        }
        gun = gltf.scene;
        gun.scale.set(0.5, 0.5, 0.5);
        gun.position.set(0, 0, 0);
        gun.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        scene.add(gun);

    });

    playerLight = new THREE.PointLight(0xffd469, 70, 70); // soft white light
    playerLight.shadow.mapSize.width = 512; // default
    playerLight.shadow.mapSize.height = 512; // default
    playerLight.shadow.camera.near = 0.5; // defaults
    playerLight.shadow.camera.far = 500; // default
    playerLight.castShadow = true;
    playerLight.shadow.bias = -0.0001;
    playerLight.position.set(0, 0, 0);
    
    scene.add(playerLight);
}

function updateGunPosition() {
    // Get the camera's direction vector
    var direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    
    // Multiply the direction vector by the desired distance from the camera to the gun
    direction.multiplyScalar(1);

    // Add the resulting vector to the camera's position to get the gun's position
    var gunPosition = camera.position.clone().add(direction);
    

    // Set the gun's position to the calculated position
    gun.position.copy(gunPosition);
    gun.position.y -= 0.5; // Adjust the gun's height to match the player's height
    gun.position.x += 0.5; // Adjust the gun's position to match the player's position

    // Set the gun's rotation to match the camera's rotation
    gun.rotation.copy(camera.rotation);
    gun.rotateY(-Math.PI/2); // Rotate the gun 180 degrees on the y-axis to point the gun backwards
    // Add the gun to the scene
    scene.add(gun);
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
    const moveSpeed = 10;

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
function getRandomPositionInCircle(radius, exclusionRadius) {
    let x, z;
    do {
        x = (Math.random() * 2 - 1) * radius;
        z = (Math.random() * 2 - 1) * radius;
    } while (x * x + z * z > radius * radius || x * x + z * z < exclusionRadius * exclusionRadius);

    x += playerBody.position.x;
    z += playerBody.position.z;

    return { x: x, y: 2, z: z };
}

function addGroundEnemy() {
    var excludedRadius = 30; // Excluded radius around playerBody
    var randomPosition = getRandomPositionInCircle(50, excludedRadius);
    var x = randomPosition.x;
    var y = randomPosition.y;
    var z = randomPosition.z;

    var halfExtents = new CANNON.Vec3(1, 1, 1);
    var boxShape = new CANNON.Box(halfExtents);

    var groundEnemyBody = new CANNON.Body({
        mass: 0.0001,
        shape: boxShape,
    });

    world.addBody(groundEnemyBody);
    groundEnemyBody.position.set(x, y, z);

    const gltfLoader = new GLTFLoader();
    gltfLoader.load("../models/ghost2.gltf", (gltf) => {
        if (!gltf) {
            console.log('Model not loaded');
            return;
        }
        var groundEnemyMesh = gltf.scene;

        groundEnemyMesh.scale.set(0.4, 0.4, 0.4);
        groundEnemyMesh.position.set(x, y, z);

        groundEnemyMesh.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });

        scene.add(groundEnemyMesh);

        groundEnemys.push({ body: groundEnemyBody, mesh: groundEnemyMesh });
    });
}
for (var i = 0; i < 2; i++) {
    setInterval(addGroundEnemy, 3000);
}

function updateGroundEnemy() {
    //update three.js mesh position
    for (var i = 0; i < groundEnemys.length; i++) {
        const currGroundEnemy = groundEnemys[i];
        currGroundEnemy.mesh.position.copy(currGroundEnemy.body.position);
        currGroundEnemy.mesh.position.y += 0.5;


        //find player position
        let direction = new CANNON.Vec3(
            playerBody.position.x - currGroundEnemy.body.position.x,
            playerBody.position.y - currGroundEnemy.body.position.y,
            playerBody.position.z - currGroundEnemy.body.position.z
        );
        direction.normalize();

        //move towards player
        currGroundEnemy.body.velocity.x = direction.x * groundEnemySpeed;
        currGroundEnemy.body.velocity.y = direction.y * groundEnemySpeed;
        currGroundEnemy.body.velocity.z = direction.z * groundEnemySpeed;

        


        // Make the enemy face the player
        currGroundEnemy.mesh.lookAt(playerBody.position.x, playerBody.position.y, playerBody.position.z);
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
    const bulletVelocity = shootDirection.multiplyScalar(100);
    bulletBody.position.copy(startPosition);
    bulletBody.velocity.copy(bulletVelocity);

    // Add bullet to the world and scene
    world.addBody(bulletBody);
    scene.add(bulletMesh);

    // Store bullet objects for updating
    bullets.push({ body: bulletBody, mesh: bulletMesh, createdAt: new Date().getTime() });
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

//enemydeath
world.addEventListener('beginContact', function (event) {
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
            updateScore();
        }, 0);
    }
});

//playerdeath
world.addEventListener('beginContact', function (event) {
    let playerIndex = event.bodyA === playerBody ? 0 : event.bodyB === playerBody ? 1 : -1;
    let enemyIndex = groundEnemys.findIndex(enemy => enemy.body === event.bodyA || enemy.body === event.bodyB);

    if (playerIndex !== -1 && enemyIndex !== -1) {
        // Collision with ground enemy detected, reset game
        console.log("Game over!");
        location.reload();
    }
});

function updateScore() {
    score++;
    document.getElementById('score').innerText = 'Score: ' + score;
}



//animate
function animate() {
    requestAnimationFrame(animate);
    if (!isPaused) {
        time += 0.01;

        //cannonDebugger.update();
        handleKeys();
        world.step(timeStep);

        attachCameraToPlayer();

        playerLight.position.copy(playerBody.position);

        groundEnemys.forEach((groundEnemy) => {
            groundEnemy.mesh.position.y = Math.sin(time)*1/4;
        });

        updateBullets();
        updateGroundEnemy();
        updateGunPosition();


        renderer.render(scene, camera);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); // Fix the typo here
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);


