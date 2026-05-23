import './index.css';
import { IsoMath } from './core/IsoMath';
import { GameMap, MAP_SIZE } from './core/Map';
import { Player } from './entities/Player';
import { NPC } from './entities/NPC';
import { NanoBanano } from './entities/NanoBanano';
import { SabraPlant } from './entities/SabraPlant';
import { Arava } from './entities/Arava';
import { Macabi } from './entities/Macabi';
import { OliveTree, AncientJar, OasisPool, Boulder } from './entities/Props';
import { LocaleManager } from './localization/LocaleManager';
import { Camera } from './core/Camera';
import { InventoryManager } from './core/InventoryManager';
import { QuestManager } from './core/QuestManager';
import { CombatManager, type CombatEntity } from './core/CombatManager';
import { AudioManager } from './core/AudioManager';

// Setup canvas configuration
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Set canvas logical size (16:9 aspect ratio)
canvas.width = 960;
canvas.height = 540;

// Instantiate managers and entities
const map = new GameMap();
const player = new Player(0, 0);
const npc = new NPC(3, 3);
const camera = new Camera();
const localeManager = LocaleManager.getInstance();

// Snap camera immediately on startup to center the player
const initialPlayerScreen = IsoMath.tileToScreen(player.gridX, player.gridY);
camera.snapTo(
  initialPlayerScreen.x,
  initialPlayerScreen.y + IsoMath.TILE_HEIGHT / 2,
  canvas.width,
  canvas.height
);

// Application State
let hoverGridX = -1;
let hoverGridY = -1;
let time = 0;
let lastTime = 0;
let isDialogueOpen = false;
let currentDialogueSpeaker = '';
let isInventoryOpen = false;
let isShopOpen = false;

const inventoryManager = new InventoryManager();
const questManager = new QuestManager();
const combatManager = new CombatManager();
const audioManager = new AudioManager();

const nanoBanano = new NanoBanano(7, 7);

const sabraPlants = [
  new SabraPlant(5, 5),
  new SabraPlant(2, 8),
  new SabraPlant(8, 2)
];

const arava = new Arava(8, 8);
const macabi = new Macabi(4, 7);

// The Uncommon Bamba Golem
// Procedural Props Registry
const props: {
  oliveTrees: OliveTree[];
  ancientJars: AncientJar[];
  oasisPools: OasisPool[];
  boulders: Boulder[];
} = {
  oliveTrees: [],
  ancientJars: [],
  oasisPools: [],
  boulders: []
};

// Seeded RNG for consistent procedural generation
const seededRandom = (seed: number) => {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const populateProps = (regionName: string) => {
  props.oliveTrees = [];
  props.ancientJars = [];
  props.oasisPools = [];
  props.boulders = [];

  let seedOffset = regionName === 'central_district' ? 100 : 500;

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      if (!map.isPassable(x, y)) continue;

      // Don't populate on top of important coordinates (0,0 is player spawn)
      if (x < 2 && y < 2) continue;
      // Avoid existing entity spawns
      if (x === npc.gridX && y === npc.gridY) continue;
      if (x === arava.gridX && y === arava.gridY) continue;
      if (x === macabi.gridX && y === macabi.gridY) continue;
      if (x === nanoBanano.gridX && y === nanoBanano.gridY) continue;

      const rand = seededRandom(x * 13 + y * 7 + seedOffset);

      if (regionName === 'central_district') {
        if (rand < 0.1) props.oliveTrees.push(new OliveTree(x, y));
        else if (rand > 0.9) props.ancientJars.push(new AncientJar(x, y));
      } else if (regionName === 'negev_desert') {
        if (rand < 0.05) props.oasisPools.push(new OasisPool(x, y));
        else if (rand > 0.85) props.boulders.push(new Boulder(x, y));
        else if (rand > 0.75 && rand <= 0.85) props.ancientJars.push(new AncientJar(x, y));
      }
    }
  }

};


interface Boon {
    id: string;
    god: string; // E.g. 'Maccabi', 'Arava'
    nameKey: string;
    descriptionKey: string;
    effect: 'attack_up' | 'dash_speed' | 'max_hp';
    value: number;
}

export const activeBoons: Boon[] = [];

export function grantBoon(boon: Boon) {
    activeBoons.push(boon);
    // Apply stats immediately
    if (boon.effect === 'attack_up') {
        combatManager.playerBaseDamage += boon.value;
    } else if (boon.effect === 'dash_speed') {
        player.dashBaseDuration += 0.05;
        player.dashBaseCooldown -= 0.1;
    }
}

// Populate initial map
populateProps('central_district');



inventoryManager.addItem({
  id: 'apple',
  name: 'Carmel Apple',
  description: 'A crisp apple from the Carmel mountains.',
  iconColor: '#e53935'
}, 3);

// Keyboard input state (supports WASD, arrow keys, and Shift)
const keys = { Space: false,
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  Shift: false,
};

// Dynamic double-click ripple wave state
let waveTriggerTime = 0;
let waveCenterX = -1;
let waveCenterY = -1;

// Transition state
let isTransitioning = false;
let transitionAlpha = 0;
let currentRegion = 'central_district';
let transitionCallback: (() => void) | null = null;

// Transform client coordinates to logical canvas coordinates (handles object-fit)
const getLogicalMousePos = (clientX: number, clientY: number) => {
  const rect = canvas.getBoundingClientRect();
  const canvasAspect = canvas.width / canvas.height;
  const rectAspect = rect.width / rect.height;

  let scaleX = 1;
  let scaleY = 1;
  let offsetX = 0;
  let offsetY = 0;

  if (rectAspect > canvasAspect) {
    const contentWidth = rect.height * canvasAspect;
    scaleX = canvas.width / contentWidth;
    scaleY = canvas.height / rect.height;
    offsetX = (rect.width - contentWidth) / 2;
  } else {
    const contentHeight = rect.width / canvasAspect;
    scaleX = canvas.width / rect.width;
    scaleY = canvas.height / contentHeight;
    offsetY = (rect.height - contentHeight) / 2;
  }

  const mouseX = (clientX - rect.left - offsetX) * scaleX;
  const mouseY = (clientY - rect.top - offsetY) * scaleY;
  return { x: mouseX, y: mouseY };
};

// Setup Keyboard Listeners
window.addEventListener('keydown', (e) => {
  audioManager.init(); // Initialize audio context on first user interaction
  const key = e.key;
  if (key === 'ArrowUp' || key === 'w' || key === 'W') {
    keys.ArrowUp = true;
    e.preventDefault();
  } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
    keys.ArrowDown = true;
    e.preventDefault();
  } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
    keys.ArrowLeft = true;
    e.preventDefault();
  } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
    keys.ArrowRight = true;
    e.preventDefault();
  } else if (key === 'Shift') {
    keys.Shift = true;
    e.preventDefault();
  } else if (key === ' ' || key === 'Enter') {
    keys.Space = true; // Capture Space for combat attack
    e.preventDefault();
    handleInteraction();
  }
});

const handleInteraction = () => {
  if (isTransitioning) return;

  audioManager.playUIBeep();

  if (isDialogueOpen) {
    isDialogueOpen = false; // Close dialogue on next press
    return;
  }

  // Determine facing coordinate
  let faceX = Math.round(player.gridX);
  let faceY = Math.round(player.gridY);

  if (player.facingDirection === 'up-right') faceY -= 1;
  else if (player.facingDirection === 'down-left') faceY += 1;
  else if (player.facingDirection === 'up-left') faceX -= 1;
  else if (player.facingDirection === 'down-right') faceX += 1;

  // Special Encounter at (2, 2) in Central District
  if (currentRegion === 'central_district' && faceX === 2 && faceY === 2) {
      if (!inventoryManager.hasItem('holy_bamba')) {
          inventoryManager.addItem({
              id: 'holy_bamba',
              name: localeManager.getStrings().holyBamba || 'Holy Bamba',
              description: 'A divine peanut snack.',
              iconColor: '#ffca28'
          });
      }

      // Spawn real-time enemies instead of modal combat
      const newEnemy: CombatEntity = {
          id: 'spawned_enemy',
          nameKey: 'Enemy',
          maxHealth: 100,
          health: 100,
          level: 1,
          attackPower: 10,
          elementType: 'Shadow',
          gridX: player.gridX + (Math.random() > 0.5 ? 4 : -4),
          gridY: player.gridY + (Math.random() > 0.5 ? 4 : -4),
          width: 1,
          height: 1,
          isDead: false,
          velocity: {x: 0, y: 0},
          damageFlashTimer: 0
      };
      combatManager.spawnEnemy(newEnemy);

    return;
  }

  // Check if NPC is at facing coordinate in the current region
  if (currentRegion === 'central_district' && faceX === npc.gridX && faceY === npc.gridY) {
    isDialogueOpen = true;
    currentDialogueSpeaker = 'npc';

    // Grant starter quest if not already given
    if (!questManager.hasQuest('starter_quest')) {
      questManager.addQuest({
        id: 'starter_quest',
        title: 'The First Steps',
        description: 'Explore the map and gather your bearings.',
        isCompleted: false
      });
    }
    return;
  }

  if (currentRegion === 'central_district' && faceX === macabi.gridX && faceY === macabi.gridY) {
    isDialogueOpen = true;
    currentDialogueSpeaker = 'macabi';
    return;
  }

  if (currentRegion === 'negev_desert' && faceX === arava.gridX && faceY === arava.gridY) {
    isDialogueOpen = true;
    currentDialogueSpeaker = 'arava';

    if (inventoryManager.hasItem('sabra_fruit')) {
      inventoryManager.removeItem('sabra_fruit');
      inventoryManager.addCurrency(50);
      currentDialogueSpeaker = 'arava_thanks';
    }
    return;
  }

  if (currentRegion === 'negev_desert' && faceX === nanoBanano.gridX && faceY === nanoBanano.gridY) {
    isDialogueOpen = true;
    currentDialogueSpeaker = 'banano';

    if (inventoryManager.hasItem('holy_bamba')) {
      inventoryManager.removeItem('holy_bamba');
      questManager.completeQuest('desert_journey');
    } else if (!questManager.hasQuest('desert_journey')) {
      questManager.addQuest({
        id: 'desert_journey',
        title: 'The Desert Journey',
        description: 'Find the Holy Bamba in the Central District and bring it to Nano Banano in the Negev.',
        isCompleted: false
      });
    }
    return;
  }

  // Harvest Sabra Plants in Negev Desert
  if (currentRegion === 'negev_desert') {
    for (const plant of sabraPlants) {
      if (faceX === plant.gridX && faceY === plant.gridY && !plant.isHarvested) {
        plant.isHarvested = true;
        inventoryManager.addItem({
          id: 'sabra_fruit',
          name: localeManager.getStrings().sabraFruit || 'Sabra Fruit',
          description: 'A prickly pear fruit. Sweet and refreshing.',
          iconColor: '#e64a19'
        }, 1);

        isDialogueOpen = true;
        currentDialogueSpeaker = 'harvest_sabra';
        return;
      }
    }
  }

  // Interactive Procedural Props
  for (const jar of props.ancientJars) {
    if (faceX === jar.gridX && faceY === jar.gridY && !jar.broken) {
      jar.broken = true;
      inventoryManager.addCurrency(Math.floor(Math.random() * 15) + 5);
      isDialogueOpen = true;
      currentDialogueSpeaker = 'jar_broken';
      audioManager.playAttackSound(); // CRACK sound
      return;
    }
  }

  for (const oasis of props.oasisPools) {
    if (faceX === oasis.gridX && faceY === oasis.gridY) {
      combatManager.healPlayer(1000); // Full heal
      // Mana restored // Full mana
      isDialogueOpen = true;
      currentDialogueSpeaker = 'oasis_heal';
      audioManager.playUIBeep();
      return;
    }
  }
};

window.addEventListener('keyup', (e) => {
  const key = e.key;
  if (key === 'ArrowUp' || key === 'w' || key === 'W') {
    keys.ArrowUp = false;
  } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
    keys.ArrowDown = false;
  } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
    keys.ArrowLeft = false;
  } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
    keys.ArrowRight = false;
  } else if (key === 'Shift') {
    keys.Shift = false;
  } else if (key === ' ' || key === 'Enter') {
    keys.Space = false;
  }
});

// Update input logic
const handlePlayerInput = (deltaTime: number) => {
  if (isTransitioning || isDialogueOpen || isInventoryOpen || isShopOpen) {
    player.isMoving = false;
    return;
  }

  let dx = 0;
  let dy = 0;

  if (keys.ArrowUp) {
    dy = -1; // Moves Y negative (Screen Up-Right)
  }
  if (keys.ArrowDown) {
    dy = 1;  // Moves Y positive (Screen Down-Left)
  }
  if (keys.ArrowLeft) {
    dx = -1; // Moves X negative (Screen Up-Left)
  }
  if (keys.ArrowRight) {
    dx = 1;  // Moves X positive (Screen Down-Right)
  }

  player.moveContinuous(dx, dy, deltaTime, map);

  // Map Boundary Transition check
  // Uses > MAP_SIZE - 0.5 because player is floating point now
  if (player.gridX > MAP_SIZE - 0.5) triggerTransition(1, 0);
  else if (player.gridX < -0.5) triggerTransition(-1, 0);
  else if (player.gridY > MAP_SIZE - 0.5) triggerTransition(0, 1);
  else if (player.gridY < -0.5) triggerTransition(0, -1);

  // Dash Support

  if (keys.Space) {
      // Space to attack
      let attackDirX = 0;
      let attackDirY = 0;

      if (player.facingDirection === 'down-right') { attackDirX = 1; attackDirY = 0; }
      else if (player.facingDirection === 'up-left') { attackDirX = -1; attackDirY = 0; }
      else if (player.facingDirection === 'down-left') { attackDirX = 0; attackDirY = 1; }
      else if (player.facingDirection === 'up-right') { attackDirX = 0; attackDirY = -1; }

      const hit = combatManager.playerMeleeAttack(player.gridX, player.gridY, attackDirX, attackDirY);
      if (hit) {
          // audio
      }
  }

  if (keys.Shift) {
      player.dash(dx, dy);
  }

  // Random encounter logic in the Negev Desert
  if (player.isMoving && currentRegion === 'negev_desert') {
    // Very small chance per frame while moving

    if (Math.random() < 0.001 && combatManager.getEnemies().length < 5) {
      const newEnemy: CombatEntity = {
          id: 'random_enc',
          nameKey: 'monster',
          maxHealth: 50,
          health: 50,
          level: 1,
          attackPower: 15,
          elementType: 'Shadow',
          gridX: player.gridX + (Math.random() > 0.5 ? 4 : -4),
          gridY: player.gridY + (Math.random() > 0.5 ? 4 : -4),
          width: 1,
          height: 1,
          isDead: false,
          velocity: {x: 0, y: 0},
          damageFlashTimer: 0
      };
      combatManager.spawnEnemy(newEnemy);
    }
  }
};

// Interface for sorting draw order
interface Drawable {
  depth: number;
  renderOrder: number; // 0 for ground tiles, 1 for entities/players
  draw: () => void;
}

// Render Loop
const tick = (currentTime: number) => {
  time = currentTime / 1000;
  const deltaTime = Math.min(0.1, (currentTime - lastTime) / 1000);
  lastTime = currentTime;

  // 1. Handle keyboard movements & continuous player update
  if (!isTransitioning) {
    handlePlayerInput(deltaTime);
    player.update(deltaTime);
    if (!isDialogueOpen && !isShopOpen && !isInventoryOpen) {
        combatManager.update(deltaTime, player.gridX, player.gridY, player.isDashing);
    }
  }

  // 2. Update Camera position (target the player's center)
  const targetCamX = player.screenX;
  const targetCamY = player.screenY + IsoMath.TILE_HEIGHT / 2;
  camera.update(targetCamX, targetCamY, canvas.width, canvas.height, deltaTime);
  
  // Clear canvas with gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#0c0c12');
  bgGrad.addColorStop(1, '#181824');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Background ambient gridlines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }

  // Compile render lists
  const drawList: Drawable[] = [];

  // Add all grid tiles to drawing list
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const tileX = x;
      const tileY = y;
      drawList.push({
        depth: tileX + tileY,
        renderOrder: 0,
        draw: () => drawTile(tileX, tileY)
      });
    }
  }

  // Player is already at interpolated float coordinates
  const playerDepthX = player.gridX;
  const playerDepthY = player.gridY;
  
  // Add player to drawing list
  drawList.push({
    depth: playerDepthX + playerDepthY,
    renderOrder: 1,
    draw: () => player.draw(ctx, 0, 0)
  });

  // Add Enemies to draw list
  for (const enemy of combatManager.getEnemies()) {
      drawList.push({
          depth: enemy.gridX + enemy.gridY,
          renderOrder: 1,
          draw: () => {
              const sp = IsoMath.tileToScreen(enemy.gridX, enemy.gridY);
              ctx.save();
              ctx.translate(sp.x - camera.x, sp.y - camera.y);

              if (enemy.damageFlashTimer > 0) {
                  ctx.filter = 'brightness(2) drop-shadow(0 0 10px red)';
              }

              // Draw jagged enemy
              ctx.fillStyle = '#b71c1c';
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(20, -30);
              ctx.lineTo(0, -60);
              ctx.lineTo(-20, -30);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#ff5252';
              ctx.lineWidth = 2;
              ctx.stroke();

              // Eyes
              ctx.fillStyle = '#fff';
              ctx.beginPath(); ctx.arc(-8, -40, 3, 0, Math.PI*2); ctx.fill();
              ctx.beginPath(); ctx.arc(8, -40, 3, 0, Math.PI*2); ctx.fill();

              // Health bar
              ctx.fillStyle = '#000';
              ctx.fillRect(-20, -70, 40, 6);
              ctx.fillStyle = '#4caf50';
              ctx.fillRect(-20, -70, 40 * (enemy.health / enemy.maxHealth), 6);

              ctx.restore();
          }
      });
  }

  // Add Dynamic Props to draw list
  for (const tree of props.oliveTrees) {
    drawList.push({ depth: tree.gridX + tree.gridY, renderOrder: 1, draw: () => tree.draw(ctx, 0, 0, time) });
  }
  for (const jar of props.ancientJars) {
    drawList.push({ depth: jar.gridX + jar.gridY, renderOrder: 1, draw: () => jar.draw(ctx, 0, 0, time) });
  }
  for (const oasis of props.oasisPools) {
    drawList.push({ depth: oasis.gridX + oasis.gridY, renderOrder: 0.5, draw: () => oasis.draw(ctx, 0, 0, time) });
  }
  for (const boulder of props.boulders) {
    drawList.push({ depth: boulder.gridX + boulder.gridY, renderOrder: 1, draw: () => boulder.draw(ctx, 0, 0) });
  }

  if (currentRegion === 'central_district') {
    drawList.push({
      depth: npc.gridX + npc.gridY,
      renderOrder: 1,
      draw: () => npc.draw(ctx, 0, 0, time)
    });

    drawList.push({
      depth: macabi.gridX + macabi.gridY,
      renderOrder: 1,
      draw: () => macabi.draw(ctx, 0, 0, time)
    });
  }

  if (currentRegion === 'negev_desert') {
    drawList.push({
      depth: arava.gridX + arava.gridY,
      renderOrder: 1,
      draw: () => arava.draw(ctx, 0, 0, time)
    });
    drawList.push({
      depth: nanoBanano.gridX + nanoBanano.gridY,
      renderOrder: 1,
      draw: () => nanoBanano.draw(ctx, 0, 0, time)
    });

    for (const plant of sabraPlants) {
      drawList.push({
        depth: plant.gridX + plant.gridY,
        renderOrder: 1,
        draw: () => plant.draw(ctx, 0, 0)
      });
    }
  }

  // Sort drawList: ascending depth, then renderOrder
  drawList.sort((a, b) => {
    if (Math.abs(a.depth - b.depth) < 0.001) {
      return a.renderOrder - b.renderOrder;
    }
    return a.depth - b.depth;
  });

  // LAYER 1: World-space rendering (shifted by Camera translation)
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  
  // Draw everything in sorted order
  for (const item of drawList) {
    item.draw();
  }

  // Draw Damage Numbers on top of the world
  for (const dn of combatManager.damageNumbers) {
      const sp = IsoMath.tileToScreen(dn.x, dn.y);
      const alpha = dn.timer / dn.maxTimer;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '800 24px "Outfit", sans-serif';
      ctx.fillStyle = dn.color || '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      // Draw centered above the tile
      const textX = sp.x - ctx.measureText(dn.amount.toString()).width / 2;
      const textY = sp.y - 40;
      ctx.strokeText(dn.amount.toString(), textX, textY);
      ctx.fillText(dn.amount.toString(), textX, textY);
      ctx.restore();
  }
  
  ctx.restore();

  // LAYER 1.5: Dynamic Environment Overlay
  // Day/Night Cycle Overlay
  const cycleDuration = 60; // 60 seconds per full cycle
  const cyclePhase = (time % cycleDuration) / cycleDuration;
  // Let night be the middle of the cycle
  const nightIntensity = Math.max(0, Math.sin(cyclePhase * Math.PI * 2));

  if (nightIntensity > 0.05) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(10, 10, 40, ${nightIntensity * 0.6})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // Weather: Sandstorm in Negev
  if (currentRegion === 'negev_desert') {
    ctx.save();
    ctx.fillStyle = 'rgba(215, 204, 153, 0.6)';
    const particleCount = 100;
    for (let i = 0; i < particleCount; i++) {
      // Procedural drift
      const px = (Math.sin(time + i * 13) * canvas.width + canvas.width + time * 300) % canvas.width;
      const py = (Math.cos(time + i * 7) * canvas.height + canvas.height + time * 100) % canvas.height;
      ctx.fillRect(px, py, 4, 4);
    }
    ctx.restore();
  }

  // LAYER 2: Text-space / interface rendering (Fixed to window)
  drawHUD();
  drawCombatHUD(); // Always draw the new health bar

  if (isShopOpen) {
    drawShop();
  } else if (isDialogueOpen) {
    drawDialogue();
  } else if (isInventoryOpen) {
    drawInventory();
  }

  // LAYER 3: Transitions
  if (isTransitioning) {
    if (transitionCallback) {
      transitionAlpha += deltaTime * 2; // Fade out
      if (transitionAlpha >= 1) {
        transitionAlpha = 1;
        transitionCallback();
        transitionCallback = null;
      }
    } else {
      transitionAlpha -= deltaTime * 2; // Fade in
      if (transitionAlpha <= 0) {
        transitionAlpha = 0;
        isTransitioning = false;
      }
    }

    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // LAYER 4: Post-Processing Vignette (Cinematic polish)
  ctx.save();
  const vignetteGrad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, canvas.height * 0.4,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.7
  );
  vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vignetteGrad.addColorStop(1, 'rgba(10, 5, 20, 0.6)'); // deep rich shadow vignette
  ctx.fillStyle = vignetteGrad;
  // Blend mode for a richer color burn effect
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  requestAnimationFrame(tick);
};

// Render function for individual tiles
const drawTile = (x: number, y: number) => {
  const screenPos = IsoMath.tileToScreen(x, y);

  // Calculate dynamic wave bobbing if ripple is active
  let bob = 0;
  if (waveCenterX !== -1) {
    const dx = x - waveCenterX;
    const dy = y - waveCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const waveTimeElapsed = time - waveTriggerTime;
    const waveSpeed = 8.0;
    const waveRadius = waveTimeElapsed * waveSpeed;
    
    if (waveRadius > dist && waveRadius < dist + 3) {
      const phase = (dist - waveRadius) * Math.PI;
      bob = Math.sin(phase) * 12 * Math.max(0, 1 - waveTimeElapsed * 0.8);
    }
  }

  const ambientBob = Math.sin(time * 2 + x * 0.4 + y * 0.4) * 1.5;
  const drawX = screenPos.x;
  const drawY = screenPos.y + bob + ambientBob;

  const isHovered = x === hoverGridX && y === hoverGridY;
  const type = map.getTile(x, y);
  const obstacle = map.getObstacle(x, y);

  // Hades-style dark fantasy map tiles
  let topColor = type === 0 ? '#263238' : '#37474f';
  let leftColor = type === 0 ? '#101416' : '#263238';
  let rightColor = type === 0 ? '#090a0c' : '#101416';

  if (type === 2) {
    // Magma/Desert
    topColor = '#3e2723';
    leftColor = '#2b1b18';
    rightColor = '#1f1311';
  } else if (type === 3) {
    // Brighter ash/magma
    topColor = '#4e342e';
    leftColor = '#3e2723';
    rightColor = '#2b1b18';
  }

  if (obstacle === 1) {
    if (currentRegion === 'negev_desert') {
      topColor = '#8d6e63';
      leftColor = '#5d4037';
      rightColor = '#3e2723';
    } else {
      topColor = '#424242';
      leftColor = '#212121';
      rightColor = '#111111';
    }
  }

  if (isHovered) {
    topColor = '#4db6ac';
    leftColor = '#00897b';
    rightColor = '#00695c';
  }

  ctx.save();

  // Top Face (Diamond)
  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(drawX, drawY);
  ctx.lineTo(drawX + IsoMath.TILE_WIDTH / 2, drawY + IsoMath.TILE_HEIGHT / 2);
  ctx.lineTo(drawX, drawY + IsoMath.TILE_HEIGHT);
  ctx.lineTo(drawX - IsoMath.TILE_WIDTH / 2, drawY + IsoMath.TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fill();

  // Procedural texture based on coordinates
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  if (type === 0 || type === 1) { // Grass
      ctx.beginPath();
      ctx.arc(drawX, drawY + IsoMath.TILE_HEIGHT / 2, 2 + ((x * y) % 3), 0, Math.PI * 2);
      ctx.fill();
  } else if (type === 2 || type === 3) { // Sand
      ctx.beginPath();
      ctx.fillRect(drawX - 2, drawY + IsoMath.TILE_HEIGHT / 2 - 2, 1 + ((x * y * 2) % 3), 1 + ((x * y * 3) % 2));
      ctx.fill();
  }

  // Wall sides
  const thickness = isHovered ? 12 : 8;
  
  // Left Face
  ctx.fillStyle = leftColor;
  ctx.beginPath();
  ctx.moveTo(drawX - IsoMath.TILE_WIDTH / 2, drawY + IsoMath.TILE_HEIGHT / 2);
  ctx.lineTo(drawX, drawY + IsoMath.TILE_HEIGHT);
  ctx.lineTo(drawX, drawY + IsoMath.TILE_HEIGHT + thickness);
  ctx.lineTo(drawX - IsoMath.TILE_WIDTH / 2, drawY + IsoMath.TILE_HEIGHT / 2 + thickness);
  ctx.closePath();
  ctx.fill();

  // Right Face
  ctx.fillStyle = rightColor;
  ctx.beginPath();
  ctx.moveTo(drawX, drawY + IsoMath.TILE_HEIGHT);
  ctx.lineTo(drawX + IsoMath.TILE_WIDTH / 2, drawY + IsoMath.TILE_HEIGHT / 2);
  ctx.lineTo(drawX + IsoMath.TILE_WIDTH / 2, drawY + IsoMath.TILE_HEIGHT / 2 + thickness);
  ctx.lineTo(drawX, drawY + IsoMath.TILE_HEIGHT + thickness);
  ctx.closePath();
  ctx.fill();

  // Outline
  ctx.strokeStyle = isHovered ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = isHovered ? 1.5 : 1;
  ctx.beginPath();
  ctx.moveTo(drawX, drawY);
  ctx.lineTo(drawX + IsoMath.TILE_WIDTH / 2, drawY + IsoMath.TILE_HEIGHT / 2);
  ctx.lineTo(drawX, drawY + IsoMath.TILE_HEIGHT);
  ctx.lineTo(drawX - IsoMath.TILE_WIDTH / 2, drawY + IsoMath.TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
};

const drawDialogue = () => {
  ctx.save();
  const isRtl = localeManager.getLocale() === 'he';
  ctx.direction = localeManager.getCanvasDirection();
  ctx.textAlign = localeManager.getTextAlign();

  const boxW = 500;
  const boxH = 120;
  const boxX = canvas.width / 2 - boxW / 2;
  const boxY = canvas.height - boxH - 40;

  // Background
  ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
  ctx.strokeStyle = '#81c784';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.font = '16px "Outfit", "Rubik", sans-serif';
  ctx.fillStyle = '#fff';
  const textX = isRtl ? boxX + boxW - 20 : boxX + 20;

  let dialogueText = '';

  if (currentDialogueSpeaker === 'npc') {
    dialogueText = localeManager.getStrings().npcDialogue;
    if (questManager.hasQuest('starter_quest') && !questManager.isQuestCompleted('starter_quest')) {
      dialogueText += localeManager.getStrings().questGranted;
    }
  } else if (currentDialogueSpeaker === 'banano') {
    if (questManager.isQuestCompleted('desert_journey')) {
      dialogueText = localeManager.getStrings().bananoDialogueThanks;
      dialogueText += localeManager.getStrings().questCompleted;
    } else {
      dialogueText = localeManager.getStrings().bananoDialogueNeedBamba;
      if (questManager.hasQuest('desert_journey') && !questManager.isQuestCompleted('desert_journey')) {
         dialogueText += '\n[Quest Granted: The Desert Journey]';
      }
    }
  } else if (currentDialogueSpeaker === 'harvest_sabra') {
      dialogueText = isRtl ? 'קטפת פרי צבר (סברס)! נזהרת מהקוצים.' : 'You harvested a Sabra Fruit! You carefully avoided the prickles.';
  } else if (currentDialogueSpeaker === 'macabi') {
      dialogueText = localeManager.getStrings().macabiDialogue;
  } else if (currentDialogueSpeaker === 'arava') {
      dialogueText = localeManager.getStrings().aravaDialogueNeedSabra;
  } else if (currentDialogueSpeaker === 'arava_thanks') {
      dialogueText = localeManager.getStrings().aravaDialogueThanks;
  } else if (currentDialogueSpeaker === 'jar_broken') {
      dialogueText = localeManager.getStrings().jarBroken;
  } else if (currentDialogueSpeaker === 'oasis_heal') {
      dialogueText = localeManager.getStrings().oasisHeal;
  }

  const lines = dialogueText.split('\n');
  for (let i = 0; i < lines.length; i++) {
     // Highlight quest text in yellow
     if (lines[i].includes('Quest') || lines[i].includes('משימה')) {
         ctx.fillStyle = '#ffd54f';
         ctx.font = 'italic 15px "Outfit", "Rubik", sans-serif';
     } else {
         ctx.fillStyle = '#fff';
         ctx.font = '16px "Outfit", "Rubik", sans-serif';
     }
     ctx.fillText(lines[i], textX, boxY + 40 + (i * 20));
  }

  // Helper text
  ctx.font = '12px "Outfit", sans-serif';
  ctx.fillStyle = '#78909c';
  const helperText = isRtl ? 'הקש רווח להמשך ▼' : 'Press Space to continue ▼';
  ctx.fillText(helperText, textX, boxY + boxH - 20);

  ctx.restore();
};

const drawShop = () => {
  ctx.save();
  const isRtl = localeManager.getLocale() === 'he';
  ctx.direction = localeManager.getCanvasDirection();
  ctx.textAlign = localeManager.getTextAlign();

  const boxW = 500;
  const boxH = 300;
  const boxX = canvas.width / 2 - boxW / 2;
  const boxY = canvas.height / 2 - boxH / 2;

  // Background - Dark fantasy style
  ctx.fillStyle = 'rgba(20, 10, 15, 0.95)';
  ctx.strokeStyle = '#9c27b0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 12);
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.font = '700 24px "Outfit", sans-serif';
  ctx.fillStyle = '#ea80fc';
  const textX = isRtl ? boxX + boxW - 30 : boxX + 30;
  ctx.fillText("Divine Boons", textX, boxY + 40);

  // Line separator
  ctx.strokeStyle = 'rgba(234, 128, 252, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(boxX + 20, boxY + 55);
  ctx.lineTo(boxX + boxW - 20, boxY + 55);
  ctx.stroke();

  // Option 1
  ctx.font = '600 18px "Outfit", sans-serif';
  ctx.fillStyle = '#ff5252';
  ctx.fillText("[1] Maccabi's Wrath: +Attack", textX, boxY + 100);
  ctx.font = '400 14px "Outfit", sans-serif';
  ctx.fillStyle = '#ffcdd2';
  ctx.fillText("Your strikes hit harder.", textX, boxY + 120);

  // Option 2
  ctx.font = '600 18px "Outfit", sans-serif';
  ctx.fillStyle = '#69f0ae';
  ctx.fillText("[2] Arava's Swiftness: +Dash Speed", textX, boxY + 160);
  ctx.font = '400 14px "Outfit", sans-serif';
  ctx.fillStyle = '#b9f6ca';
  ctx.fillText("Your dash covers more distance and recharges faster.", textX, boxY + 180);

  // Option 3
  ctx.font = '600 18px "Outfit", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText("[3] Decline", textX, boxY + 230);

  ctx.restore();
};

const drawInventory = () => {
  ctx.save();
  const isRtl = localeManager.getLocale() === 'he';
  ctx.direction = localeManager.getCanvasDirection();
  ctx.textAlign = localeManager.getTextAlign();

  const boxW = 400;
  const boxH = 300;
  const boxX = canvas.width / 2 - boxW / 2;
  const boxY = canvas.height / 2 - boxH / 2;

  // Background
  ctx.fillStyle = 'rgba(28, 28, 38, 0.98)';
  ctx.strokeStyle = '#ffd54f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 12);
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.font = '600 20px "Outfit", sans-serif';
  ctx.fillStyle = '#ffd54f';
  const textX = isRtl ? boxX + boxW - 30 : boxX + 30;
  ctx.fillText(localeManager.getStrings().inventoryTitle, textX, boxY + 40);

  // Line separator
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(boxX + 20, boxY + 55);
  ctx.lineTo(boxX + boxW - 20, boxY + 55);
  ctx.stroke();

  // Currency
  ctx.font = '600 16px "Outfit", sans-serif';
  ctx.fillStyle = '#4caf50';
  const currencyAmount = inventoryManager.getCurrency();
  const shekelsString = localeManager.getStrings().shekels || 'Shekels';
  const currencyText = isRtl ? `${shekelsString}: ${currencyAmount}` : `${shekelsString}: ${currencyAmount}`;
  ctx.fillText(currencyText, textX, boxY + 80);

  // Items List
  const items = inventoryManager.getItems();
  let itemY = boxY + 110;

  if (items.length === 0) {
    ctx.font = 'italic 16px "Outfit", sans-serif';
    ctx.fillStyle = '#90a4ae';
    ctx.fillText(localeManager.getStrings().emptyInventory, textX, itemY);
  } else {
    for (const item of items) {
      // Draw Icon Placeholder
      const iconX = isRtl ? boxX + boxW - 45 : boxX + 30;
      ctx.fillStyle = item.iconColor || '#fff';
      ctx.beginPath();
      ctx.roundRect(iconX, itemY - 15, 20, 20, 4);
      ctx.fill();

      // Item Name & Quantity
      ctx.font = '500 16px "Outfit", sans-serif';
      ctx.fillStyle = '#fff';
      const nameX = isRtl ? boxX + boxW - 60 : boxX + 65;
      ctx.fillText(`${item.name} x${item.quantity}`, nameX, itemY);

      // Description
      ctx.font = '400 13px "Outfit", sans-serif';
      ctx.fillStyle = '#b0bec5';
      ctx.fillText(item.description, nameX, itemY + 20);

      itemY += 50;
    }
  }

  ctx.restore();
};

const drawCombatHUD = () => {
  ctx.save();
  ctx.direction = localeManager.getCanvasDirection();
  ctx.textAlign = localeManager.getTextAlign();

  const boxW = 200;
  const boxH = 40;
  const boxX = canvas.width / 2 - boxW / 2;
  const boxY = canvas.height - 60;

  // Background
  ctx.fillStyle = 'rgba(20, 10, 10, 0.95)';
  ctx.strokeStyle = '#e53935';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  // Player Health Bar
  const pHealth = combatManager.getPlayerHealth();

  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.roundRect(boxX + 2, boxY + 2, (boxW - 4) * (pHealth.current / pHealth.max), boxH - 4, 6);
  ctx.fill();

  ctx.font = '600 16px "Outfit", sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(`HP: ${Math.ceil(pHealth.current)}/${pHealth.max}`, canvas.width / 2, boxY + 26);

  ctx.restore();
};

const drawHUD = () => {
  ctx.save();
  const isRtl = localeManager.getLocale() === 'he';
  ctx.direction = localeManager.getCanvasDirection();
  ctx.textAlign = localeManager.getTextAlign();

  // Card parameters
  const cardW = 340;
  const cardH = 110;
  const cardX = isRtl ? canvas.width - cardW - 20 : 20;
  const cardY = 20;

  // Background
  ctx.fillStyle = 'rgba(18, 18, 28, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 12);
  ctx.fill();
  ctx.stroke();

  const textX = isRtl ? cardX + cardW - 20 : cardX + 20;

  // Title
  ctx.font = '600 16px "Outfit", sans-serif';
  ctx.fillStyle = '#4db6ac';
  ctx.fillText(
    localeManager.getStrings().title,
    textX,
    cardY + 26
  );

  // Subtitle
  ctx.font = '400 12px "Rubik", sans-serif';
  ctx.fillStyle = '#b0bec5';
  ctx.fillText(
    localeManager.getStrings().subtitle,
    textX,
    cardY + 44
  );

  // Region Loading Logs
  ctx.font = 'italic 400 11px "Outfit", sans-serif';
  ctx.fillStyle = '#ffd54f';
  const displayRegion = localeManager.getStrings().regions[currentRegion] || currentRegion;
  const regionText = `${localeManager.getStrings().regionLabel}${displayRegion}`;
  ctx.fillText(
    regionText,
    textX,
    cardY + 62
  );

  // Player Grid Status
  ctx.font = '500 12px "Outfit", sans-serif';
  ctx.fillStyle = '#81c784';
  const movingText = player.isMoving ? localeManager.getStrings().moving : '';
  const playerText = `${localeManager.getStrings().playerGrid}: [X: ${player.gridX.toFixed(1)}, Y: ${player.gridY.toFixed(1)}]${movingText}`;
  ctx.fillText(
    playerText,
    textX,
    cardY + 82
  );

  // Hover Grid Status
  ctx.font = '400 11px "Outfit", sans-serif';
  ctx.fillStyle = hoverGridX !== -1 ? '#80cbc4' : '#78909c';
  const hoverText = hoverGridX !== -1
    ? `${localeManager.getStrings().hoverTile}: [X: ${hoverGridX}, Y: ${hoverGridY}]`
    : localeManager.getStrings().noHoverTile;
  ctx.fillText(
    hoverText,
    textX,
    cardY + 98
  );

  // Active status circle indicator
  ctx.fillStyle = player.isMoving ? '#ffd54f' : '#66bb6a';
  ctx.beginPath();
  ctx.arc(isRtl ? cardX + 20 : cardX + cardW - 20, cardY + 26, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

// Setup DOM interactions & events
const init = () => {
  window.addEventListener('keydown', (e) => {
    // Debug teleport to Banano

    if (isShopOpen) {
      audioManager.init();
      if (e.key === '1') {
        // Maccabi's Wrath
        grantBoon({
            id: 'maccabi_wrath',
            god: 'Maccabi',
            nameKey: 'maccabiWrath',
            descriptionKey: 'maccabiWrathDesc',
            effect: 'attack_up',
            value: 10
        });
        audioManager.playUIBeep();
        isShopOpen = false;
      } else if (e.key === '2') {
        // Arava's Swiftness
        grantBoon({
            id: 'arava_swiftness',
            god: 'Arava',
            nameKey: 'aravaSwiftness',
            descriptionKey: 'aravaSwiftnessDesc',
            effect: 'dash_speed',
            value: 10
        });
        audioManager.playUIBeep();
        isShopOpen = false;
      } else if (e.key === '3' || e.key === 'Escape') {
        isShopOpen = false;
        audioManager.playUIBeep();
      }
      return;
    }

    // Toggle shop key
    if (e.key.toLowerCase() === 'b') {
      if (!isDialogueOpen) {
        isShopOpen = !isShopOpen;
        audioManager.playUIBeep();
      }
      return;
    }

    // Toggle inventory
    if (e.key.toLowerCase() === 'i') {
      if (!isDialogueOpen && !isShopOpen) {
        isInventoryOpen = !isInventoryOpen;
      }
      return;
    }

    if (isDialogueOpen) {
      return; // Block other inputs while dialogue is open
    }

    if (isInventoryOpen) {
      return; // Block movement while inventory is open
    }
  });

  const langBtn = document.getElementById('lang-switch');
  const hintText = document.getElementById('controls-hint');

  const updateDomLabels = () => {
    if (langBtn) {
      langBtn.innerText = localeManager.getStrings().langSwitch;
    }
    if (hintText) {
      hintText.innerText = localeManager.getStrings().hint;
    }
  };

  if (langBtn) {
    langBtn.addEventListener('click', () => {
      localeManager.toggleLocale();
    });
  }

  localeManager.addChangeListener(() => {
    updateDomLabels();
  });

  updateDomLabels();

  // Mouse move listener to compute hover mapping back to Cartesian
  canvas.addEventListener('mousemove', (e) => {
    const mousePos = getLogicalMousePos(e.clientX, e.clientY);

    // Convert mouse coordinates from canvas/screen space to world space by adding camera offset
    const worldX = mousePos.x + camera.x;
    const worldY = mousePos.y + camera.y;

    const gridPos = IsoMath.screenToTile(worldX, worldY);
    
    const tileX = Math.floor(gridPos.x);
    const tileY = Math.floor(gridPos.y);

    if (tileX >= 0 && tileX < MAP_SIZE && tileY >= 0 && tileY < MAP_SIZE) {
      hoverGridX = tileX;
      hoverGridY = tileY;
    } else {
      hoverGridX = -1;
      hoverGridY = -1;
    }
  });

  canvas.addEventListener('mouseleave', () => {
    hoverGridX = -1;
    hoverGridY = -1;
  });

  canvas.addEventListener('dblclick', () => {
    if (hoverGridX !== -1) {
      waveCenterX = hoverGridX;
      waveCenterY = hoverGridY;
      waveTriggerTime = time;
    }
  });

  // Launch Loop
  lastTime = performance.now();
  requestAnimationFrame(tick);
};

window.addEventListener('DOMContentLoaded', init);

const triggerTransition = (dx: number, dy: number) => {
  isTransitioning = true;
  transitionAlpha = 0;

  // Toggle region based on current region
  currentRegion = currentRegion === 'central_district' ? 'negev_desert' : 'central_district';

  // Set the callback for when screen is fully black
  transitionCallback = () => {
    // Load new map layout
    map.loadRegion(currentRegion);

    // Warp to opposite edge
    if (dx > 0) player.gridX = 0;
    else if (dx < 0) player.gridX = MAP_SIZE - 1;

    if (dy > 0) player.gridY = 0;
    else if (dy < 0) player.gridY = MAP_SIZE - 1;

    // Reset camera and target
    const startScreenPos = IsoMath.tileToScreen(player.gridX, player.gridY);
    player.screenX = startScreenPos.x;
    player.screenY = startScreenPos.y;
    camera.snapTo(startScreenPos.x, startScreenPos.y + IsoMath.TILE_HEIGHT / 2, canvas.width, canvas.height);

    // Repopulate dynamic props based on the new map
    populateProps(currentRegion);
  };
};
