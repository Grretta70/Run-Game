// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft overall light
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Sun-like light
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Player (cylinder body + sphere head)
const playerGroup = new THREE.Group();

// Body
const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
body.position.y = 0.75; // Center body above ground

// Head
const headGeometry = new THREE.SphereGeometry(0.4, 8, 6);
const headMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const head = new THREE.Mesh(headGeometry, headMaterial);
head.position.y = 1.7; // Place head on top of body

playerGroup.add(body);
playerGroup.add(head);
scene.add(playerGroup);
playerGroup.position.y = 0.75; // Adjust group to ground level
playerGroup.velocityY = 0;

// Monster (larger red cylinder)
const monsterGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
const monsterMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const monster = new THREE.Mesh(monsterGeometry, monsterMaterial);
scene.add(monster);
monster.position.set(0, 1, -10); // Start behind player

// Ground
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Forest green
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Trees
function createTree(x, z) {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1, z);

    const leavesGeometry = new THREE.SphereGeometry(1, 8, 6);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 2.5, z);

    scene.add(trunk);
    scene.add(leaves);
}

// Coins
function createCoin(x, z) {
    const coinGeometry = new THREE.SphereGeometry(0.2, 8, 6);
    const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    coin.position.set(x, 0.5, z);
    scene.add(coin);
    return coin;
}

// Initialize environment
const coins = [];
for (let i = -20; i > -500; i -= 5) {
    const x = Math.random() * 4 - 2;
    coins.push(createCoin(x, i));
}
for (let i = -500; i < 500; i += 20) {
    createTree(-10, i);
    createTree(10, i);
}

// Game state
let gameState = 'playing';
let score = 0;
let totalCoins = localStorage.getItem('totalCoins') ? parseInt(localStorage.getItem('totalCoins')) : 0;
let currentLevel = 1;
let monsterSpeed = 0.05;
const levelDistance = 100;

// Skins (applied to player body and head)
const skins = {
    green: { color: 0x00ff00, cost: 0 }, // Default
    red: { color: 0xff0000, cost: 10 },
    blue: { color: 0x0000ff, cost: 10 }
};
let currentSkin = localStorage.getItem('currentSkin') || 'green';
body.material.color.setHex(skins[currentSkin].color);
head.material.color.setHex(skins[currentSkin].color);

// Key controls
const keys = { left: false, right: false, up: false };
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') keys.left = true;
    if (event.key === 'ArrowRight') keys.right = true;
    if (event.key === 'ArrowUp') keys.up = true;
});
document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft') keys.left = false;
    if (event.key === 'ArrowRight') keys.right = false;
    if (event.key === 'ArrowUp') keys.up = false;
});

// Store functionality
function changeSkin(skinName) {
    if (totalCoins >= skins[skinName].cost) {
        totalCoins -= skins[skinName].cost;
        localStorage.setItem('totalCoins', totalCoins);
        currentSkin = skinName;
        localStorage.setItem('currentSkin', skinName);
        body.material.color.setHex(skins[skinName].color);
        head.material.color.setHex(skins[skinName].color);
        document.getElementById('totalCoins').innerText = totalCoins;
    } else {
        alert('Not enough coins!');
    }
}

// Button event listeners
document.getElementById('restart').addEventListener('click', () => {
    playerGroup.position.set(0, 0.75, 0);
    monster.position.set(0, 1, -10);
    score = 0;
    currentLevel = 1;
    monsterSpeed = 0.05;
    coins.forEach(coin => scene.remove(coin));
    coins.length = 0;
    for (let i = -20; i > -500; i -= 5) {
        const x = Math.random() * 4 - 2;
        coins.push(createCoin(x, i));
    }
    gameState = 'playing';
    document.getElementById('gameOver').style.display = 'none';
});

document.getElementById('store').addEventListener('click', () => {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('storeMenu').style.display = 'block';
    document.getElementById('totalCoins').innerText = totalCoins;
});

document.getElementById('back').addEventListener('click', () => {
    document.getElementById('storeMenu').style.display = 'none';
    document.getElementById('gameOver').style.display = 'block';
});

document.getElementById('buyRed').addEventListener('click', () => changeSkin('red'));
document.getElementById('buyBlue').addEventListener('click', () => changeSkin('blue'));

// Game loop
function animate() {
    requestAnimationFrame(animate);

    if (gameState === 'playing') {
        // Player movement
        playerGroup.position.z -= 0.1; // Auto-run
        if (keys.left && playerGroup.position.x > -5) playerGroup.position.x -= 0.1;
        if (keys.right && playerGroup.position.x < 5) playerGroup.position.x += 0.1;
        if (keys.up && playerGroup.position.y === 0.75) playerGroup.velocityY = 0.2;
        if (playerGroup.position.y > 0.75) {
            playerGroup.velocityY -= 0.01; // Gravity
            playerGroup.position.y += playerGroup.velocityY;
        } else {
            playerGroup.position.y = 0.75;
            playerGroup.velocityY = 0;
        }

        // Camera follows player
        camera.position.set(playerGroup.position.x, 5, playerGroup.position.z + 10);
        camera.lookAt(playerGroup.position);

        // Monster movement
        monster.position.z += monsterSpeed;

        // Coin collection
        for (let i = coins.length - 1; i >= 0; i--) {
            const coin = coins[i];
            if (playerGroup.position.distanceTo(coin.position) < 0.5) {
                scene.remove(coin);
                coins.splice(i, 1);
                score += 1;
                totalCoins += 1;
                localStorage.setItem('totalCoins', totalCoins);
            }
        }

        // Update score display
        document.getElementById('scoreDisplay').innerText = 'Score: ' + score;

        // Level progression
        if (Math.abs(playerGroup.position.z) > currentLevel * levelDistance) {
            currentLevel += 1;
            monsterSpeed += 0.01; // Increase difficulty
        }

        // Game over condition
        if (monster.position.z >= playerGroup.position.z) {
            gameState = 'gameOver';
            document.getElementById('gameOver').style.display = 'block';
            document.getElementById('score').innerText = score;
        }
    }

    renderer.render(scene, camera);
}
animate();
