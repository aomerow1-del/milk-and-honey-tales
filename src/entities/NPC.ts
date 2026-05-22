import { IsoMath } from '../core/IsoMath';

const FRAME_W = 48;
const FRAME_H = 64;

export class NPC {
  public gridX: number;
  public gridY: number;

  private sprite: HTMLImageElement;
  private spriteLoaded: boolean = false;

  constructor(x: number, y: number) {
    this.gridX = x;
    this.gridY = y;

    this.sprite = new Image();
    this.sprite.onload = () => { this.spriteLoaded = true; };
    this.sprite.onerror = () => {
      const dataUrl = this.generatePlaceholderSprite();
      const fallback = new Image();
      fallback.onload = () => { this.sprite = fallback; this.spriteLoaded = true; };
      fallback.src = dataUrl;
    };
    this.sprite.src = '/assets/npc_spritesheet.png';
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const screenPos = IsoMath.tileToScreen(this.gridX, this.gridY);

    // Position at the bottom/center of the tile diamond
    const drawX = screenPos.x + cameraX;
    const drawY = screenPos.y + cameraY + IsoMath.TILE_HEIGHT / 2;

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(drawX, drawY + 2, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.spriteLoaded) {
      const destX = drawX - FRAME_W / 2;
      const destY = drawY - FRAME_H;

      ctx.drawImage(
        this.sprite,
        0, 0, // Only one frame for now
        FRAME_W, FRAME_H,
        destX, destY,
        FRAME_W, FRAME_H
      );
    } else {
      // Fallback shapes
      // Body
      ctx.fillStyle = '#673ab7'; // purple robe
      ctx.fillRect(drawX - 6, drawY - 24, 12, 24);

      // Head
      ctx.fillStyle = '#ffb74d';
      ctx.beginPath();
      ctx.arc(drawX, drawY - 28, 8, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#212121';
      ctx.fillRect(drawX - 3, drawY - 29, 2, 2);
      ctx.fillRect(drawX + 1, drawY - 29, 2, 2);
    }

    ctx.restore();
  }

  private generatePlaceholderSprite(): string {
    const offscreen = document.createElement('canvas');
    offscreen.width = FRAME_W;
    offscreen.height = FRAME_H;
    const c = offscreen.getContext('2d')!;

    const cx = FRAME_W / 2;
    const headCY = 16;

    // Head
    c.fillStyle = '#ffb74d';
    c.beginPath();
    c.arc(cx, headCY, 9, 0, Math.PI * 2);
    c.fill();

    // Eyes
    c.fillStyle = '#212121';
    c.fillRect(cx - 4, headCY - 1, 3, 3);
    c.fillRect(cx + 1, headCY - 1, 3, 3);

    // Body
    c.fillStyle = '#673ab7'; // purple robe
    c.fillRect(cx - 7, headCY + 9, 14, 25);

    // Arms
    c.fillStyle = '#ffb74d'; // skin
    c.fillRect(cx - 12, headCY + 10, 5, 12);
    c.fillRect(cx + 7, headCY + 10, 5, 12);

    // Feet
    c.fillStyle = '#3e2723';
    c.fillRect(cx - 7, headCY + 34, 6, 4);
    c.fillRect(cx + 1, headCY + 34, 6, 4);

    return offscreen.toDataURL('image/png');
  }
}
