import { IsoMath } from '../core/IsoMath';

export class Arava {
  public gridX: number;
  public gridY: number;
  private animOffset: number = 0;

  constructor(gridX: number, gridY: number) {
    this.gridX = gridX;
    this.gridY = gridY;
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, time: number): void {
    const screenPos = IsoMath.tileToScreen(this.gridX, this.gridY);
    const drawX = screenPos.x + cameraX;
    const drawY = screenPos.y + cameraY + IsoMath.TILE_HEIGHT / 2;

    this.animOffset = Math.sin(time * 3) * 2; // subtle breathing bob

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(drawX, drawY, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (desert cloak)
    ctx.fillStyle = '#bcaaa4';
    ctx.beginPath();
    ctx.moveTo(drawX - 10, drawY);
    ctx.lineTo(drawX + 10, drawY);
    ctx.lineTo(drawX + 6, drawY - 24 + this.animOffset);
    ctx.lineTo(drawX - 6, drawY - 24 + this.animOffset);
    ctx.fill();

    // Head/Hood
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.arc(drawX, drawY - 28 + this.animOffset, 8, 0, Math.PI * 2);
    ctx.fill();

    // Face/Eyes
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(drawX - 4, drawY - 30 + this.animOffset, 2, 2);
    ctx.fillRect(drawX + 2, drawY - 30 + this.animOffset, 2, 2);

    // Walking stick
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(drawX - 12, drawY);
    ctx.lineTo(drawX - 8, drawY - 30 + this.animOffset);
    ctx.stroke();

    ctx.restore();
  }
}
