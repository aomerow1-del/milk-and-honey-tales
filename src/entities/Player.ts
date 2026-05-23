import { IsoMath } from '../core/IsoMath';
import { GameMap } from '../core/Map';

const FRAME_W = 48;
const FRAME_H = 64;
const FRAME_COUNT = 4;
const FRAME_RATE = 6;

// Facing directions mapping to row index in the spritesheet
const DIRECTION_ROW: Record<string, number> = {
  'down-right': 0, // South/Southeast
  'up-left': 1,    // West/Northwest
  'down-left': 2,  // East/Southwest (Isometric convention tweaks)
  'up-right': 3    // North/Northeast
};

export class Player {
  public gridX: number;
  public gridY: number;

  public screenX: number = 0;
  public screenY: number = 0;

  // Hades-style movement physics
  public moveSpeed: number = 6.0;
  public isMoving: boolean = false;

  // Dash mechanics
  public isDashing: boolean = false;
  public dashCooldown: number = 0;
  public dashDuration: number = 0;
  public dashDirectionX: number = 0;
  public dashDirectionY: number = 0;

  public facingDirection: string = 'down-right';

  private frameIndex: number = 0;
  private frameTick: number = 0;
  private directionRow: number = 0;

  private sprite: HTMLImageElement;
  private spriteLoaded: boolean = false;

  constructor(startX: number, startY: number) {
    this.gridX = startX;
    this.gridY = startY;

    // Immediately snap screen coords to initial grid
    const screenPos = IsoMath.tileToScreen(this.gridX, this.gridY);
    this.screenX = screenPos.x;
    this.screenY = screenPos.y;

    this.sprite = new Image();
    this.sprite.onload = () => { this.spriteLoaded = true; };
    this.sprite.onerror = () => {
      const dataUrl = this.generatePlaceholderSprite();
      const fallback = new Image();
      fallback.onload = () => { this.sprite = fallback; this.spriteLoaded = true; };
      fallback.src = dataUrl;
    };
    this.sprite.src = '/assets/player_spritesheet.png';
  }

  public moveContinuous(dx: number, dy: number, deltaTime: number, map: GameMap): void {
    // Handle Dash Timers
    if (this.dashCooldown > 0) this.dashCooldown -= deltaTime;
    if (this.dashDuration > 0) {
        this.dashDuration -= deltaTime;
        // Override input with dash velocity
        dx = this.dashDirectionX * 18; // Super fast dash speed
        dy = this.dashDirectionY * 18;
        if (this.dashDuration <= 0) this.isDashing = false;
    }

    this.isMoving = (dx !== 0 || dy !== 0);

    if (this.isMoving) {
      if (dx > 0 && dy === 0) this.facingDirection = 'down-right';
      else if (dx < 0 && dy === 0) this.facingDirection = 'up-left';
      else if (dy > 0 && dx === 0) this.facingDirection = 'down-left';
      else if (dy < 0 && dx === 0) this.facingDirection = 'up-right';
      else if (dx > 0 && dy > 0) this.facingDirection = 'down-right';
      else if (dx < 0 && dy > 0) this.facingDirection = 'down-left';
      else if (dx > 0 && dy < 0) this.facingDirection = 'up-right';
      else if (dx < 0 && dy < 0) this.facingDirection = 'up-left';

      this.directionRow = DIRECTION_ROW[this.facingDirection];

      let mag = Math.sqrt(dx * dx + dy * dy);
      if (mag > 0 && !this.isDashing) {
        dx = (dx / mag) * this.moveSpeed * deltaTime;
        dy = (dy / mag) * this.moveSpeed * deltaTime;
      } else if (this.isDashing) {
        // Dash velocity is already pre-multiplied
        dx *= deltaTime;
        dy *= deltaTime;
      }

      const nextX = this.gridX + dx;
      const nextY = this.gridY + dy;

      const checkX = Math.floor(nextX + 0.5);
      const checkY = Math.floor(nextY + 0.5);

      // Allow moving out of bounds for region transition triggers, otherwise check passability
      if (checkX < 0 || checkX >= map.size || checkY < 0 || checkY >= map.size || map.isPassable(checkX, checkY)) {
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

    const screenPos = IsoMath.tileToScreen(this.gridX, this.gridY);
    this.screenX = screenPos.x;
    this.screenY = screenPos.y;
  }

  public dashBaseDuration: number = 0.15;
  public dashBaseCooldown: number = 0.5;

  public dash(dx: number, dy: number): void {
      if (this.dashCooldown <= 0 && (dx !== 0 || dy !== 0)) {
          this.isDashing = true;
          this.dashDuration = this.dashBaseDuration;
          this.dashCooldown = this.dashBaseCooldown;

          let mag = Math.sqrt(dx * dx + dy * dy);
          this.dashDirectionX = dx / mag;
          this.dashDirectionY = dy / mag;
      }
  }

  public update(deltaTime: number): void {
    if (!this.isMoving) {
      this.frameIndex = 0;
      this.frameTick  = 0;
      return;
    }

    this.frameTick += deltaTime * FRAME_RATE * (this.isDashing ? 3 : 1);
    if (this.frameTick >= 1) {
      this.frameTick -= 1;
      this.frameIndex = (this.frameIndex + 1) % FRAME_COUNT;
    }
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const tileApexX = this.screenX + cameraX;
    const tileApexY = this.screenY + cameraY;

    const floorCentreX = tileApexX;
    const floorCentreY = tileApexY + IsoMath.TILE_HEIGHT / 2;

    ctx.save();

    // ── Ground shadow (sharp diamond) ─────────────────────────────────────
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.moveTo(floorCentreX, floorCentreY - 4);
    ctx.lineTo(floorCentreX + 16, floorCentreY + 4);
    ctx.lineTo(floorCentreX, floorCentreY + 12);
    ctx.lineTo(floorCentreX - 16, floorCentreY + 4);
    ctx.closePath();
    ctx.fill();

    if (this.isDashing) {
        // Dash afterimage blur
        ctx.shadowColor = '#d50000';
        ctx.shadowBlur = 20;
    }

    if (this.spriteLoaded) {
      const srcX = this.frameIndex   * FRAME_W;
      const srcY = this.directionRow * FRAME_H;
      const destX = floorCentreX - FRAME_W / 2;
      const destY = floorCentreY - FRAME_H;

      ctx.drawImage(this.sprite, srcX, srcY, FRAME_W, FRAME_H, destX, destY, FRAME_W, FRAME_H);
    } else {
      ctx.restore(); // Pop shadow context before drawing procedural sprite
      this.drawProceduralHadesSprite(ctx, floorCentreX, floorCentreY);
    }

    if (this.spriteLoaded) ctx.restore();
  }

  private drawProceduralHadesSprite(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
      ctx.save();
      ctx.translate(cx, cy);

      const bounce = this.isMoving && !this.isDashing ? Math.sin(this.frameTick * Math.PI) * 2 : 0;
      const tilt = this.isDashing ? 0.2 * Math.sign(this.dashDirectionX || 1) : 0;

      ctx.translate(0, -30 + bounce);
      ctx.rotate(tilt);

      // Body / Cape (Sharp, angular)
      ctx.fillStyle = '#111';
      ctx.strokeStyle = '#d50000'; // Blood red outline
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(0, -10); // neck
      ctx.lineTo(12, 5);  // shoulder right
      ctx.lineTo(18, 25); // cape point right
      ctx.lineTo(5, 15);
      ctx.lineTo(0, 30);  // cape center
      ctx.lineTo(-5, 15);
      ctx.lineTo(-18, 25); // cape point left
      ctx.lineTo(-12, 5);  // shoulder left
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing core/heart
      ctx.fillStyle = '#ff1744';
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(4, 5);
      ctx.lineTo(0, 12);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Head (Angular skull/helm)
      ctx.fillStyle = '#eee';
      ctx.strokeStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(8, -20);
      ctx.lineTo(6, -8);
      ctx.lineTo(0, -5);
      ctx.lineTo(-6, -8);
      ctx.lineTo(-8, -20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing Eyes
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.moveTo(-4, -15);
      ctx.lineTo(-2, -13);
      ctx.lineTo(-6, -12);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(4, -15);
      ctx.lineTo(2, -13);
      ctx.lineTo(6, -12);
      ctx.fill();

      // Weapon (Scythe or jagged sword)
      const armSwing = this.isMoving ? Math.sin(this.frameTick * Math.PI * 2) * 0.5 : 0;
      ctx.rotate(armSwing);

      ctx.strokeStyle = '#ffb300'; // gold weapon
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(25, 20); // hilt
      ctx.stroke();

      // Blade
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#ffb300';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(25, 20);
      ctx.lineTo(35, 15);
      ctx.lineTo(45, 30);
      ctx.lineTo(20, 25);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
  }

  private generatePlaceholderSprite(): string {
    return ""; // Unused, we use inline procedural drawing now for better animation
  }
}
