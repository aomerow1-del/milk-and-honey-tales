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

    this.animOffset = Math.sin(time * 2.5) * 1.5; // gentle desert breathing
    const sway = Math.sin(time * 1.5) * 2; // subtle wind sway

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(drawX, drawY, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Body (desert cloak, flowing and rounded)
    const cloakGrad = ctx.createRadialGradient(drawX, drawY - 10, 0, drawX, drawY - 10, 16);
    cloakGrad.addColorStop(0, '#d7ccc8');
    cloakGrad.addColorStop(1, '#a1887f');

    ctx.fillStyle = cloakGrad;
    ctx.beginPath();
    ctx.moveTo(drawX - 9, drawY);
    ctx.quadraticCurveTo(drawX - 12 + sway, drawY - 12 + this.animOffset, drawX - 6 + sway, drawY - 22 + this.animOffset);
    ctx.lineTo(drawX + 6 + sway, drawY - 22 + this.animOffset);
    ctx.quadraticCurveTo(drawX + 12 + sway, drawY - 12 + this.animOffset, drawX + 9, drawY);
    ctx.fill();

    // Head/Hood (Soft and rounded)
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.ellipse(drawX + sway, drawY - 26 + this.animOffset, 7, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Face/Eyes (Soft)
    ctx.fillStyle = '#3e2723';
    ctx.beginPath(); ctx.ellipse(drawX - 2 + sway, drawY - 27 + this.animOffset, 1.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(drawX + 2 + sway, drawY - 27 + this.animOffset, 1.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();

    // Walking stick (Curved, organic wood)
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(drawX - 12, drawY);
    ctx.quadraticCurveTo(drawX - 15, drawY - 15, drawX - 10 + sway, drawY - 32 + this.animOffset);
    ctx.stroke();

    ctx.restore();
  }
}
