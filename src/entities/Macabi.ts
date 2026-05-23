import { IsoMath } from '../core/IsoMath';

export class Macabi {
  public gridX: number;
  public gridY: number;

  constructor(gridX: number, gridY: number) {
    this.gridX = gridX;
    this.gridY = gridY;
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const screenPos = IsoMath.tileToScreen(this.gridX, this.gridY);
    const drawX = screenPos.x + cameraX;
    const drawY = screenPos.y + cameraY + IsoMath.TILE_HEIGHT / 2;

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(drawX, drawY, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (Armor)
    ctx.fillStyle = '#607d8b'; // blue-grey armor
    ctx.fillRect(drawX - 8, drawY - 24, 16, 24);

    // Shoulders
    ctx.fillStyle = '#455a64';
    ctx.fillRect(drawX - 12, drawY - 24, 6, 8);
    ctx.fillRect(drawX + 6, drawY - 24, 6, 8);

    // Head
    ctx.fillStyle = '#ffcc80'; // skin
    ctx.beginPath();
    ctx.arc(drawX, drawY - 30, 7, 0, Math.PI * 2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    ctx.arc(drawX, drawY - 32, 8, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(drawX - 8, drawY - 32, 16, 4);

    // Shield (Magen David motif simplified)
    ctx.fillStyle = '#1976d2';
    ctx.beginPath();
    ctx.moveTo(drawX + 8, drawY - 18);
    ctx.lineTo(drawX + 16, drawY - 18);
    ctx.lineTo(drawX + 12, drawY - 6);
    ctx.fill();

    // Spear
    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(drawX - 10, drawY);
    ctx.lineTo(drawX - 10, drawY - 40);
    ctx.stroke();

    // Spear tip
    ctx.fillStyle = '#b0bec5';
    ctx.beginPath();
    ctx.moveTo(drawX - 10, drawY - 45);
    ctx.lineTo(drawX - 12, drawY - 40);
    ctx.lineTo(drawX - 8, drawY - 40);
    ctx.fill();

    ctx.restore();
  }
}
