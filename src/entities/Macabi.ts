import { IsoMath } from '../core/IsoMath';

export class Macabi {
  public gridX: number;
  public gridY: number;

  constructor(gridX: number, gridY: number) {
    this.gridX = gridX;
    this.gridY = gridY;
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, time: number): void {
    const screenPos = IsoMath.tileToScreen(this.gridX, this.gridY);
    const drawX = screenPos.x + cameraX;
    const drawY = screenPos.y + cameraY + IsoMath.TILE_HEIGHT / 2;

    const animOffset = Math.sin(time * 1.5) * 1.2; // heavy armor breathing

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(drawX, drawY, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Body (Armor)
    const armorGrad = ctx.createRadialGradient(drawX, drawY - 12, 0, drawX, drawY - 12, 18);
    armorGrad.addColorStop(0, '#78909c');
    armorGrad.addColorStop(1, '#455a64');

    ctx.fillStyle = armorGrad;
    ctx.beginPath();
    ctx.ellipse(drawX, drawY - 12, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shoulders (rounded pads)
    ctx.fillStyle = '#37474f';
    ctx.beginPath(); ctx.ellipse(drawX - 11, drawY - 18 + animOffset, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(drawX + 11, drawY - 18 + animOffset, 5, 7, 0, 0, Math.PI * 2); ctx.fill();

    // Head
    ctx.fillStyle = '#ffcc80'; // skin
    ctx.beginPath();
    ctx.ellipse(drawX, drawY - 26 + animOffset, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#263238';
    ctx.beginPath(); ctx.ellipse(drawX - 3, drawY - 26 + animOffset, 2, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(drawX + 3, drawY - 26 + animOffset, 2, 2, 0, 0, Math.PI * 2); ctx.fill();

    // Helmet (Rounded spartan/knight style)
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    ctx.ellipse(drawX, drawY - 28 + animOffset, 9, 8, 0, Math.PI, 0); // top dome
    ctx.fill();

    ctx.strokeStyle = '#b0bec5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(drawX - 9, drawY - 28 + animOffset);
    ctx.lineTo(drawX + 9, drawY - 28 + animOffset);
    ctx.stroke();

    // Shield (Curved Kite Shield)
    const shieldGrad = ctx.createLinearGradient(drawX + 4, drawY - 20, drawX + 16, drawY);
    shieldGrad.addColorStop(0, '#1976d2');
    shieldGrad.addColorStop(1, '#0d47a1');

    ctx.fillStyle = shieldGrad;
    ctx.beginPath();
    ctx.moveTo(drawX + 6, drawY - 22 + animOffset);
    ctx.quadraticCurveTo(drawX + 18, drawY - 20 + animOffset, drawX + 14, drawY - 4 + animOffset);
    ctx.quadraticCurveTo(drawX + 8, drawY + 2 + animOffset, drawX + 4, drawY - 12 + animOffset);
    ctx.fill();

    // Spear (Tilted slightly and animated)
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(drawX - 12, drawY);
    ctx.lineTo(drawX - 16, drawY - 40 + animOffset * 0.5);
    ctx.stroke();

    // Spear tip (leaf shape)
    ctx.fillStyle = '#eceff1';
    ctx.beginPath();
    ctx.moveTo(drawX - 16, drawY - 40 + animOffset * 0.5);
    ctx.quadraticCurveTo(drawX - 14, drawY - 45 + animOffset * 0.5, drawX - 18, drawY - 50 + animOffset * 0.5);
    ctx.quadraticCurveTo(drawX - 20, drawY - 45 + animOffset * 0.5, drawX - 16, drawY - 40 + animOffset * 0.5);
    ctx.fill();

    ctx.restore();
  }
}
