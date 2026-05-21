import { IsoMath } from '../core/IsoMath';

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

// Direction label used in placeholder sprite debug stamps
const DIR_LABELS = ['S', 'W', 'E', 'N'];
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
  public moveProgress: number = 0;
  private readonly moveSpeed: number = 4.0; // grid tiles per second

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
  public move(dx: number, dy: number, mapSize: number): void {
    if (this.isMoving) return;

    const nextX = this.gridX + dx;
    const nextY = this.gridY + dy;

    if (nextX >= 0 && nextX < mapSize && nextY >= 0 && nextY < mapSize) {
      this.targetGridX = nextX;
      this.targetGridY = nextY;
      this.isMoving    = true;
      this.moveProgress = 0;

      // 1. Update direction string
      if      (dx > 0)  this.facingDirection = 'down-right';
      else if (dx < 0)  this.facingDirection = 'up-left';
      else if (dy > 0)  this.facingDirection = 'down-left';
      else if (dy < 0)  this.facingDirection = 'up-right';

      // 2. Map to spritesheet row BEFORE the first lerp tick
      this.directionRow = DIRECTION_ROW[this.facingDirection];
    }
  }

  /**
   * Advances the linear-interpolation step and frame-animation counter.
   * Frame ticking only runs while the player is walking; resets on idle.
   */
  public update(deltaTime: number): void {
    if (!this.isMoving) {
      // Return to idle pose (frame 0) on the current direction row
      this.frameIndex = 0;
      this.frameTick  = 0;
      return;
    }

    // ── Screen-coordinate interpolation ──────────────────────────────────
    this.moveProgress += deltaTime * this.moveSpeed;

    if (this.moveProgress >= 1.0) {
      this.gridX = this.targetGridX;
      this.gridY = this.targetGridY;
      this.isMoving     = false;
      this.moveProgress = 0;

      const final = IsoMath.tileToScreen(this.gridX, this.gridY);
      this.screenX = final.x;
      this.screenY = final.y;
    } else {
      const start = IsoMath.tileToScreen(this.gridX, this.gridY);
      const end   = IsoMath.tileToScreen(this.targetGridX, this.targetGridY);
      this.screenX = start.x + (end.x - start.x) * this.moveProgress;
      this.screenY = start.y + (end.y - start.y) * this.moveProgress;
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

    // Transparent background (nothing to clear – default is transparent)

    for (let row = 0; row < 4; row++) {
      const color = DIR_COLORS[row];
      const label = DIR_LABELS[row];

      for (let frame = 0; frame < FRAME_COUNT; frame++) {
        const ox = frame * FRAME_W;
        const oy = row   * FRAME_H;

        // Anchor points
        const cx     = ox + FRAME_W / 2;
        const headCY = oy + 16;

        // ── Hat (direction colour indicator) ─────────────────────────────
        c.fillStyle = color;
        c.fillRect(cx - 9, headCY - 14, 18, 7);  // dome
        c.fillRect(cx - 12, headCY - 8, 24, 4);  // brim

        // ── Head ─────────────────────────────────────────────────────────
        c.fillStyle = '#ffcc80';
        c.beginPath();
        c.arc(cx, headCY, 9, 0, Math.PI * 2);
        c.fill();

        // ── Eyes (direction-aware) ────────────────────────────────────────
        c.fillStyle = '#212121';
        if (row === 0) {
          // South – full face visible
          c.fillRect(cx - 4, headCY - 1, 3, 3);
          c.fillRect(cx + 1,  headCY - 1, 3, 3);
        } else if (row === 2) {
          // East – right eye only visible
          c.fillRect(cx + 2, headCY - 1, 3, 3);
        } else if (row === 1) {
          // West – left eye only visible
          c.fillRect(cx - 5, headCY - 1, 3, 3);
        }
        // North (row === 3) – back of head, no eyes

        // ── Body ─────────────────────────────────────────────────────────
        c.fillStyle = '#556b2f'; // olive green shirt
        c.fillRect(cx - 7, headCY + 9, 14, 18);

        // ── Arms (opposite swing to legs) ─────────────────────────────────
        const armSwing = (frame % 2 === 0) ? 4 : -4;
        c.fillStyle = '#ffcc80'; // skin
        c.fillRect(cx - 12, headCY + 10 + armSwing,  5, 12); // left arm
        c.fillRect(cx +  7, headCY + 10 - armSwing,  5, 12); // right arm

        // ── Shorts ───────────────────────────────────────────────────────
        c.fillStyle = '#8d6e63';
        c.fillRect(cx - 7, headCY + 27, 14, 7);

        // ── Legs ─────────────────────────────────────────────────────────
        const legSwing = (frame % 2 === 0) ? 4 : -4;
        c.fillStyle = '#d7ccc8'; // skin
        c.fillRect(cx - 7, headCY + 34 + legSwing,  5, 14); // left
        c.fillRect(cx + 2, headCY + 34 - legSwing,  5, 14); // right

        // ── Shoes ────────────────────────────────────────────────────────
        c.fillStyle = '#3e2723';
        c.fillRect(cx - 8, headCY + 48 + legSwing,  6, 4);
        c.fillRect(cx + 2, headCY + 48 - legSwing,  6, 4);

        // ── Debug stamp (direction letter + frame number) ─────────────────
        c.fillStyle  = 'rgba(255, 255, 255, 0.35)';
        c.font       = '7px monospace';
        c.textAlign  = 'left';
        c.fillText(`${label}${frame}`, ox + 2, oy + FRAME_H - 3);
      }
    }

    return offscreen.toDataURL('image/png');
  }
}
