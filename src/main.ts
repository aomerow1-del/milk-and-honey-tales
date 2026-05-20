import './index.css';
import { IsoMath } from './core/IsoMath';
import { GrassMap, MAP_SIZE } from './core/Map';
import { Player } from './entities/Player';

// Setup canvas configuration
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Set canvas logical size (16:9 aspect ratio)
canvas.width = 960;
canvas.height = 540;

// Application State
let language: 'en' | 'he' = 'en';
let hoverGridX = -1;
let hoverGridY = -1;
let time = 0;
let lastTime = 0;

// Keyboard input state
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

// Instantiate player at grid (0,0)
const player = new Player(0, 0);

// Dynamic double-click ripple wave state
let waveTriggerTime = 0;
let waveCenterX = -1;
let waveCenterY = -1;

// Translation dictionary
const strings = {
  en: {
    title: 'Isometric Movement Engine',
    subtitle: '10x10 alternated grid with smooth sliding player',
    langName: 'עברית (HE)',
    hint: 'Use Keyboard Arrow Keys to walk. Hover cursor over tiles. Double-click to ripple.',
  },
  he: {
    title: 'מנוע תנועה איזומטרי',
    subtitle: 'גריד 10x10 עם שחקן מחליק בצורה חלקה',
    langName: 'English (EN)',
    hint: 'השתמש במקשי החצים כדי ללכת. רחף עם העכבר מעל האריחים. קליק כפול לגל גלים.',
  }
};

// Center offsets for drawing the 10x10 isometric grid centered on canvas
const getMapCenterOffsets = () => {
  const cx = canvas.width / 2;
  const cy = (canvas.height - (MAP_SIZE * IsoMath.TILE_HEIGHT)) / 2;
  return { cx, cy };
};

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
  if (e.key in keys) {
    e.preventDefault();
    keys[e.key as keyof typeof keys] = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key in keys) {
    e.preventDefault();
    keys[e.key as keyof typeof keys] = false;
  }
});

// Update input logic
const handlePlayerInput = () => {
  if (player.isMoving) return;

  if (keys.ArrowUp) {
    player.move(0, -1, MAP_SIZE); // Moves Y negative (Screen Up-Right)
  } else if (keys.ArrowDown) {
    player.move(0, 1, MAP_SIZE);  // Moves Y positive (Screen Down-Left)
  } else if (keys.ArrowLeft) {
    player.move(-1, 0, MAP_SIZE); // Moves X negative (Screen Up-Left)
  } else if (keys.ArrowRight) {
    player.move(1, 0, MAP_SIZE);  // Moves X positive (Screen Down-Right)
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

  // 1. Handle keyboard movements
  handlePlayerInput();

  // 2. Update player position interpolation
  player.update(deltaTime);
  
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

  const { cx, cy } = getMapCenterOffsets();

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
        draw: () => drawTile(tileX, tileY, cx, cy)
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
    draw: () => player.draw(ctx, cx, cy)
  });

  // Sort drawList: ascending depth, then renderOrder
  drawList.sort((a, b) => {
    if (Math.abs(a.depth - b.depth) < 0.001) {
      return a.renderOrder - b.renderOrder;
    }
    return a.depth - b.depth;
  });

  // Draw everything in sorted order
  for (const item of drawList) {
    item.draw();
  }

  // Draw localized overlay interface
  drawHUD();

  requestAnimationFrame(tick);
};

// Render function for individual tiles
const drawTile = (x: number, y: number, cx: number, cy: number) => {
  const screenPos = IsoMath.gridToScreen(x, y);

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
  const drawX = screenPos.x + cx;
  const drawY = screenPos.y + cy + bob + ambientBob;

  const isHovered = x === hoverGridX && y === hoverGridY;
  const type = GrassMap[y][x];

  let topColor = type === 0 ? '#1b5e20' : '#2e7d32';
  let leftColor = type === 0 ? '#124116' : '#1b5e20';
  let rightColor = type === 0 ? '#0a270d' : '#124116';

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

// HUD Canvas drawing logic
const drawHUD = () => {
  ctx.save();
  const isRtl = language === 'he';
  ctx.direction = isRtl ? 'rtl' : 'ltr';

  // Card parameters
  const cardW = 340;
  const cardH = 95;
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

  // Title
  ctx.font = '600 16px "Outfit", sans-serif';
  ctx.fillStyle = '#4db6ac';
  ctx.fillText(
    strings[language].title,
    isRtl ? cardX + cardW - 20 : cardX + 20,
    cardY + 28
  );

  // Subtitle
  ctx.font = '400 12px "Rubik", sans-serif';
  ctx.fillStyle = '#b0bec5';
  ctx.fillText(
    strings[language].subtitle,
    isRtl ? cardX + cardW - 20 : cardX + 20,
    cardY + 48
  );

  // Player Grid Status
  ctx.font = '500 12px "Outfit", sans-serif';
  ctx.fillStyle = '#ffd54f';
  const playerText = `${isRtl ? 'מיקום שחקן' : 'Player Grid'}: [X: ${player.gridX}, Y: ${player.gridY}]${player.isMoving ? ' (Moving...)' : ''}`;
  ctx.fillText(
    playerText,
    isRtl ? cardX + cardW - 20 : cardX + 20,
    cardY + 68
  );

  // Hover Grid Status
  ctx.font = '400 11px "Outfit", sans-serif';
  ctx.fillStyle = hoverGridX !== -1 ? '#80cbc4' : '#78909c';
  const hoverText = hoverGridX !== -1
    ? `${isRtl ? 'רחף אריח' : 'Hover Tile'}: [X: ${hoverGridX}, Y: ${hoverGridY}]`
    : `${isRtl ? 'אין אריח מסומן' : 'No hover tile'}`;
  ctx.fillText(
    hoverText,
    isRtl ? cardX + cardW - 20 : cardX + 20,
    cardY + 84
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
      langBtn.innerText = strings[language].langName;
    }
    if (hintText) {
      hintText.innerText = strings[language].hint;
    }
  };

  if (langBtn) {
    langBtn.addEventListener('click', () => {
      language = language === 'en' ? 'he' : 'en';
      updateDomLabels();
    });
  }

  updateDomLabels();

  // Mouse move listener to compute hover mapping back to Cartesian
  canvas.addEventListener('mousemove', (e) => {
    const mousePos = getLogicalMousePos(e.clientX, e.clientY);
    const { cx, cy } = getMapCenterOffsets();

    const localX = mousePos.x - cx;
    const localY = mousePos.y - cy;

    const gridPos = IsoMath.screenToGrid(localX, localY);
    
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
