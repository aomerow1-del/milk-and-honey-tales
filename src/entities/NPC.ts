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

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, time: number): void {
    const screenPos = IsoMath.tileToScreen(this.gridX, this.gridY);

    // Position at the bottom/center of the tile diamond
    const drawX = screenPos.x + cameraX;
    const drawY = screenPos.y + cameraY + IsoMath.TILE_HEIGHT / 2;

    const animOffset = Math.sin(time * 2) * 1.5; // gentle breathing

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(drawX, drawY, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

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
      // Body (Robe, organic)
      const robeGrad = ctx.createRadialGradient(drawX, drawY - 12, 0, drawX, drawY - 12, 18);
      robeGrad.addColorStop(0, '#9575cd'); // lighter purple
      robeGrad.addColorStop(1, '#512da8');

      ctx.fillStyle = robeGrad;
      ctx.beginPath();
      ctx.ellipse(drawX, drawY - 12, 11, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#ffb74d';
      ctx.beginPath();
      ctx.ellipse(drawX, drawY - 26 + animOffset, 9, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes (soft)
      ctx.fillStyle = '#3e2723';
      ctx.beginPath(); ctx.ellipse(drawX - 3, drawY - 26 + animOffset, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(drawX + 3, drawY - 26 + animOffset, 2, 3, 0, 0, Math.PI * 2); ctx.fill();

      // Beard / Mustache
      ctx.fillStyle = '#bdbdbd'; // grey beard
      ctx.beginPath();
      ctx.ellipse(drawX, drawY - 20 + animOffset, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private generatePlaceholderSprite(): string {
    const offscreen = document.createElement('canvas');
    offscreen.width = FRAME_W;
    offscreen.height = FRAME_H;
    return offscreen.toDataURL('image/png');
  }
}
