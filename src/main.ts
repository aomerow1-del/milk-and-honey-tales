import './index.css';
import { IsoMath } from './core/IsoMath';
import { GameMap, MAP_SIZE } from './core/Map';
import { Player } from './entities/Player';
import { NPC } from './entities/NPC';
import { LocaleManager } from './localization/LocaleManager';
import { Camera } from './core/Camera';
import { SaveService } from './services/SaveService';

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

// Keyboard input state (supports WASD and arrow keys)
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
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
  } else if (key === ' ' || key === 'Enter') {
    e.preventDefault();
    handleInteraction();
  }
});

const handleInteraction = () => {
  if (isTransitioning) return;

  if (isDialogueOpen) {
    isDialogueOpen = false; // Close dialogue on next press
    return;
  }

  // Determine facing coordinate
  let faceX = player.gridX;
  let faceY = player.gridY;

  if (player.facingDirection === 'up-right') faceY -= 1;
  else if (player.facingDirection === 'down-left') faceY += 1;
  else if (player.facingDirection === 'up-left') faceX -= 1;
  else if (player.facingDirection === 'down-right') faceX += 1;

  // Check if NPC is at facing coordinate in the current region
  if (currentRegion === 'central_district' && faceX === npc.gridX && faceY === npc.gridY) {
    isDialogueOpen = true;
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
  }
});

// Update input logic
const handlePlayerInput = () => {
  if (player.isMoving || isTransitioning || isDialogueOpen) return;

  let dx = 0;
  let dy = 0;

  if (keys.ArrowUp) {
    dy = -1; // Moves Y negative (Screen Up-Right)
  } else if (keys.ArrowDown) {
    dy = 1;  // Moves Y positive (Screen Down-Left)
  } else if (keys.ArrowLeft) {
    dx = -1; // Moves X negative (Screen Up-Left)
  } else if (keys.ArrowRight) {
    dx = 1;  // Moves X positive (Screen Down-Right)
  }

  if (dx !== 0 || dy !== 0) {
    const nextX = player.gridX + dx;
    const nextY = player.gridY + dy;

    // Check if player steps off map boundary
    if (nextX < 0 || nextX >= MAP_SIZE || nextY < 0 || nextY >= MAP_SIZE) {
      triggerTransition(dx, dy);
    } else {
      player.move(dx, dy, map);
    }
  }
};

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

    player.targetGridX = player.gridX;
    player.targetGridY = player.gridY;

    // Instantly snap screen coords & camera to avoid lerping across map
    const newScreen = IsoMath.tileToScreen(player.gridX, player.gridY);
    player.screenX = newScreen.x;
    player.screenY = newScreen.y;
    camera.snapTo(newScreen.x, newScreen.y + IsoMath.TILE_HEIGHT / 2, canvas.width, canvas.height);

    // Async save to Supabase
    SaveService.saveState(currentRegion, player.gridX, player.gridY).catch(err => {
      console.error('Failed to save state during transition', err);
    });
  };
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

  // 1. Handle keyboard movements
  handlePlayerInput();

  // 2. Update player position interpolation
  if (!isTransitioning) {
    player.update(deltaTime);
  }

  // 3. Update Camera position (target the player's center)
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

  // Calculate interpolated depth coordinate for player
  const playerInterpX = player.gridX + (player.targetGridX - player.gridX) * player.moveProgress;
  const playerInterpY = player.gridY + (player.targetGridY - player.gridY) * player.moveProgress;
  
  // Add player to drawing list
  drawList.push({
    depth: playerInterpX + playerInterpY,
    renderOrder: 1,
    draw: () => player.draw(ctx, 0, 0)
  });

  if (currentRegion === 'central_district') {
    drawList.push({
      depth: npc.gridX + npc.gridY,
      renderOrder: 1,
      draw: () => npc.draw(ctx, 0, 0)
    });
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
  
  ctx.restore();

  // LAYER 2: Text-space / interface rendering (Fixed to window)
  drawHUD();
  if (isDialogueOpen) {
    drawDialogue();
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

  let topColor = type === 0 ? '#1b5e20' : '#2e7d32';
  let leftColor = type === 0 ? '#124116' : '#1b5e20';
  let rightColor = type === 0 ? '#0a270d' : '#124116';

  if (type === 2) {
    topColor = '#ffb300';
    leftColor = '#ff8f00';
    rightColor = '#ff6f00';
  } else if (type === 3) {
    topColor = '#ffca28';
    leftColor = '#ffb300';
    rightColor = '#ff8f00';
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
  const boxH = 100;
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
  ctx.fillText(localeManager.getStrings().npcDialogue, textX, boxY + 40);

  // Helper text
  ctx.font = '12px "Outfit", sans-serif';
  ctx.fillStyle = '#78909c';
  const helperText = isRtl ? 'הקש רווח להמשך ▼' : 'Press Space to continue ▼';
  ctx.fillText(helperText, textX, boxY + boxH - 20);

  ctx.restore();
};

// HUD Canvas drawing logic
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
  const playerText = `${localeManager.getStrings().playerGrid}: [X: ${player.gridX}, Y: ${player.gridY}]${movingText}`;
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
