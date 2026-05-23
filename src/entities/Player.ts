import { IsoMath } from '../core/IsoMath';
import { GameMap } from '../core/Map';

// ---------------------------------------------------------------------------
// Sprite sheet configuration
// Layout: 4 columns (walk frames) × 4 rows (directions)
// Row 0 = South / down-left   Row 1 = West / up-left
// Row 2 = East  / down-right  Row 3 = North / up-right
// ---------------------------------------------------------------------------
const FRAME_COUNT = 4;  // walk cycle frames per direction row
const FRAME_W     = 48; // individual frame width  (pixels)
const FRAME_H     = 64; // individual frame height (pixels)
const FRAME_RATE  = 8;  // animation frames per second while walking

// Maps a facing direction string to the corresponding spritesheet row index.
const DIRECTION_ROW: Record<string, number> = {
  'down-left':  0, // South
  'up-left':    1, // West
  'down-right': 2, // East
  'up-right':   3, // North
};

// Distinct hat colours per direction so frames are easy to identify at a glance
const DIR_COLORS = ['#e53935', '#43a047', '#1e88e5', '#fb8c00'];

export class Player {
  // ── Grid / screen state ──────────────────────────────────────────────────
  public gridX:  number = 0;
  public gridY:  number = 0;
  public screenX: number = 0;
  public screenY: number = 0;

  public targetGridX: number = 0;
  public targetGridY: number = 0;

  // ── Movement ─────────────────────────────────────────────────────────────
  public isMoving: boolean  = false;
  public readonly moveSpeed: number = 4.0; // grid tiles per second

  // ── Facing direction ─────────────────────────────────────────────────────
  public facingDirection: 'down-left' | 'down-right' | 'up-left' | 'up-right'
    = 'down-right';

  // ── Sprite-sheet animation variables ─────────────────────────────────────
  public  directionRow: number = DIRECTION_ROW['down-right']; // active sheet row
  public  frameIndex:   number = 0;    // active column within the row
  private frameTick:    number = 0;    // accumulated time → drives frame advancement

  // ── Asset ─────────────────────────────────────────────────────────────────
  private sprite:       HTMLImageElement;
  private spriteLoaded: boolean = false;

  // ─────────────────────────────────────────────────────────────────────────
  constructor(startX: number = 0, startY: number = 0) {
    this.gridX = startX;
    this.gridY = startY;
    this.targetGridX = startX;
    this.targetGridY = startY;

    const initialScreen = IsoMath.tileToScreen(startX, startY);
    this.screenX = initialScreen.x;
    this.screenY = initialScreen.y;

    // Load external spritesheet; fall back to a procedurally generated one if
    // the file is absent (404 / missing public/assets/player_spritesheet.png).
    this.sprite = new Image();
    this.sprite.onload  = () => { this.spriteLoaded = true; };
    this.sprite.onerror = () => {
      // Generate placeholder at runtime – no extra build step required.
      const dataUrl = this.generatePlaceholderSprite();
      const fallback = new Image();
      fallback.onload = () => { this.sprite = fallback; this.spriteLoaded = true; };
      fallback.src = dataUrl;
    };
    this.sprite.src = '/assets/player_spritesheet.png';
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Attempts to begin movement by one grid cell in the given direction.
   * Updates directionRow immediately (before the lerp starts) so the
   * correct spritesheet row shows from the very first rendered frame.
   * Boundary-clamped to [0, mapSize).
   */
  public moveContinuous(dx: number, dy: number, map: GameMap, deltaTime: number): void {
    this.isMoving = (dx !== 0 || dy !== 0);

    if (this.isMoving) {
      // 1. Update direction string
      if (dx > 0 && dy === 0) this.facingDirection = 'down-right';
      else if (dx < 0 && dy === 0) this.facingDirection = 'up-left';
      else if (dy > 0 && dx === 0) this.facingDirection = 'down-left';
      else if (dy < 0 && dx === 0) this.facingDirection = 'up-right';
      else if (dx > 0 && dy > 0) this.facingDirection = 'down-right'; // Diagonal arbitrary
      else if (dx < 0 && dy > 0) this.facingDirection = 'down-left';
      else if (dx > 0 && dy < 0) this.facingDirection = 'up-right';
      else if (dx < 0 && dy < 0) this.facingDirection = 'up-left';

      // 2. Map to spritesheet row
      this.directionRow = DIRECTION_ROW[this.facingDirection];

      // Normalize diagonal movement
      let mag = Math.sqrt(dx * dx + dy * dy);
      if (mag > 0) {
        dx = (dx / mag) * this.moveSpeed * deltaTime;
        dy = (dy / mag) * this.moveSpeed * deltaTime;
      }

      const nextX = this.gridX + dx;
      const nextY = this.gridY + dy;

      // Calculate the tile coordinate the player is trying to enter
      // Check collision considering a small bounding box
      const checkX = Math.floor(nextX + 0.5);
      const checkY = Math.floor(nextY + 0.5);

      if (map.isPassable(checkX, checkY)) {
        this.gridX = nextX;
        this.gridY = nextY;
      } else {
          // Slide along walls
          if (map.isPassable(Math.floor(nextX + 0.5), Math.floor(this.gridY + 0.5))) {
              this.gridX = nextX;
          } else if (map.isPassable(Math.floor(this.gridX + 0.5), Math.floor(nextY + 0.5))) {
              this.gridY = nextY;
          }
      }
    }

    // Always update screen position to match current precise grid position
    const screenPos = IsoMath.tileToScreen(this.gridX, this.gridY);
    this.screenX = screenPos.x;
    this.screenY = screenPos.y;
  }

  /**
   * Advances the frame-animation counter.
   * Frame ticking only runs while the player is walking; resets on idle.
   */
  public update(deltaTime: number): void {
    if (!this.isMoving) {
      // Return to idle pose (frame 0) on the current direction row
      this.frameIndex = 0;
      this.frameTick  = 0;
      return;
    }

    // ── Walk-cycle frame advancement ──────────────────────────────────────
    this.frameTick += deltaTime * FRAME_RATE;
    if (this.frameTick >= 1) {
      this.frameTick -= 1;
      this.frameIndex = (this.frameIndex + 1) % FRAME_COUNT;
    }
  }

  /**
   * Renders the player avatar.
   *
   * If the spritesheet is loaded, draws one clipped frame via the 9-argument
   * ctx.drawImage signature.  The sprite is anchored so its feet sit at the
   * centre of the isometric tile diamond the player occupies, matching the
   * visual convention of the tile renderer in main.ts.
   *
   * Falls back to a simple ellipse placeholder while the asset is loading
   * (should be near-instant in most cases).
   */
  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    // The iso-math tile apex (top diamond vertex) sits at (screenX, screenY)
    // relative to the cameraX/cameraY offsets supplied by the renderer.
    const tileApexX = this.screenX + cameraX;
    const tileApexY = this.screenY + cameraY;

    // The visual "floor centre" of the tile is half a tile height lower.
    const floorCentreX = tileApexX;
    const floorCentreY = tileApexY + IsoMath.TILE_HEIGHT / 2;

    ctx.save();

    // ── Ground shadow ellipse ─────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(floorCentreX, floorCentreY + 2, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Sprite frame or loading placeholder ───────────────────────────────
    if (this.spriteLoaded) {
      // Source clip rectangle on the spritesheet
      const srcX = this.frameIndex   * FRAME_W;
      const srcY = this.directionRow * FRAME_H;

      // Destination rectangle on the canvas.
      // Horizontally centred on floorCentreX; feet anchored to floorCentreY.
      const destX = floorCentreX - FRAME_W / 2;
      const destY = floorCentreY - FRAME_H;

      ctx.drawImage(
        this.sprite,      // image source
        srcX, srcY,       // source top-left corner
        FRAME_W, FRAME_H, // source clip dimensions
        destX, destY,     // destination top-left corner
        FRAME_W, FRAME_H  // destination draw dimensions (1 : 1 – no scaling)
      );
    } else {
      // Loading placeholder – coloured circle matching the direction
      ctx.fillStyle = DIR_COLORS[this.directionRow] ?? '#888';
      ctx.beginPath();
      ctx.arc(floorCentreX, floorCentreY - 16, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Procedurally renders a 192 × 256 px placeholder spritesheet onto an
   * offscreen canvas and returns it as a PNG data URL.
   *
   * Layout: 4 columns × 4 rows; each cell is FRAME_W × FRAME_H (48 × 64 px).
   * Figures are basic pixel-art stick characters with direction-colour hats
   * and arm / leg swing animation across the four walk frames.
   *
   * Replace `public/assets/player_spritesheet.png` with a real asset at any
   * time – this method will never be called once the file is present.
   */
  private generatePlaceholderSprite(): string {
    const totalW = FRAME_W * FRAME_COUNT; // 192
    const totalH = FRAME_H * 4;           // 256

    const offscreen = document.createElement('canvas');
    offscreen.width  = totalW;
    offscreen.height = totalH;
    const c = offscreen.getContext('2d')!;

    // Transparent background

    for (let row = 0; row < 4; row++) {
      const color = DIR_COLORS[row];

      for (let frame = 0; frame < FRAME_COUNT; frame++) {
        const ox = frame * FRAME_W;
        const oy = row   * FRAME_H;

        // Anchor points
        const cx     = ox + FRAME_W / 2;
        const headCY = oy + 20;

        // Bouncy walk cycle offsets
        const bounce = (frame % 2 !== 0) ? -3 : 0;
        const squash = (frame % 2 === 0) ? 1.05 : 0.95;

        c.save();
        c.translate(cx, headCY + bounce);

        // ── Back Arm (swing) ─────────────────────────────────────────────
        const armSwing = (frame % 2 === 0) ? 4 : -4;
        c.fillStyle = '#ffcc80'; // skin
        c.beginPath();
        if (row === 1 || row === 3) {
            c.ellipse(4, 12 - armSwing, 4, 7, -0.2 * armSwing, 0, Math.PI * 2);
        } else {
            c.ellipse(-4, 12 + armSwing, 4, 7, 0.2 * armSwing, 0, Math.PI * 2);
        }
        c.fill();

        // ── Back Leg ─────────────────────────────────────────────────────
        const legSwing = (frame % 2 === 0) ? 5 : -5;
        c.fillStyle = '#8d6e63'; // pants
        c.beginPath();
        if (row === 1 || row === 3) {
            c.ellipse(3, 24 - legSwing, 5, 8, -0.1 * legSwing, 0, Math.PI * 2);
        } else {
            c.ellipse(-3, 24 + legSwing, 5, 8, 0.1 * legSwing, 0, Math.PI * 2);
        }
        c.fill();

        // ── Body (Rounded, organic) ──────────────────────────────────────
        c.scale(1, squash);

        // Torso gradient
        const bodyGrad = c.createRadialGradient(0, 10, 0, 0, 10, 15);
        bodyGrad.addColorStop(0, '#7cb342'); // soft green
        bodyGrad.addColorStop(1, '#558b2f');

        c.fillStyle = bodyGrad;
        c.beginPath();
        c.ellipse(0, 12, 10, 14, 0, 0, Math.PI * 2);
        c.fill();

        // ── Head ─────────────────────────────────────────────────────────
        c.fillStyle = '#ffcc80'; // skin
        c.beginPath();
        c.ellipse(0, 0, 11, 10, 0, 0, Math.PI * 2);
        c.fill();

        // ── Hat (direction colour indicator, soft beanie) ────────────────
        c.fillStyle = color;
        c.beginPath();
        c.ellipse(0, -7, 10, 6, 0, Math.PI, 0); // top half
        c.fill();
        c.beginPath();
        c.ellipse(0, -7, 11, 3, 0, 0, Math.PI * 2); // brim
        c.fill();

        // ── Eyes (direction-aware, softer and cuter) ──────────────────────
        c.fillStyle = '#3e2723'; // soft dark brown
        if (row === 0) {
          // South – full face visible
          c.beginPath(); c.ellipse(-4, 0, 2, 3, 0, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.ellipse(4, 0, 2, 3, 0, 0, Math.PI * 2); c.fill();
          // Blush
          c.fillStyle = 'rgba(233, 30, 99, 0.3)';
          c.beginPath(); c.ellipse(-6, 3, 3, 1.5, 0, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.ellipse(6, 3, 3, 1.5, 0, 0, Math.PI * 2); c.fill();
        } else if (row === 2) {
          // East – right eye only visible
          c.beginPath(); c.ellipse(5, 0, 2, 3, 0, 0, Math.PI * 2); c.fill();
        } else if (row === 1) {
          // West – left eye only visible
          c.beginPath(); c.ellipse(-5, 0, 2, 3, 0, 0, Math.PI * 2); c.fill();
        }

        c.scale(1, 1/squash); // reset squash

        // ── Front Leg ────────────────────────────────────────────────────
        c.fillStyle = '#6d4c41'; // darker pants
        c.beginPath();
        if (row === 1 || row === 3) {
            c.ellipse(-3, 24 + legSwing, 5, 8, 0.1 * legSwing, 0, Math.PI * 2);
        } else {
            c.ellipse(3, 24 - legSwing, 5, 8, -0.1 * legSwing, 0, Math.PI * 2);
        }
        c.fill();

        // ── Front Arm ────────────────────────────────────────────────────
        c.fillStyle = '#ffe0b2'; // skin highlight
        c.beginPath();
        if (row === 1 || row === 3) {
            c.ellipse(-4, 12 + armSwing, 4, 7, 0.2 * armSwing, 0, Math.PI * 2);
        } else {
            c.ellipse(4, 12 - armSwing, 4, 7, -0.2 * armSwing, 0, Math.PI * 2);
        }
        c.fill();

        c.restore();
      }
    }

    return offscreen.toDataURL('image/png');
  }
}
