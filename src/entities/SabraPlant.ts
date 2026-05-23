import { IsoMath } from '../core/IsoMath';

export class SabraPlant {
  public gridX: number;
  public gridY: number;
  public screenX: number;
  public screenY: number;
  public isHarvested: boolean = false;

  constructor(gridX: number, gridY: number) {
    this.gridX = gridX;
    this.gridY = gridY;
    const pos = IsoMath.tileToScreen(gridX, gridY);
    this.screenX = pos.x;
    this.screenY = pos.y;
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const tileApexX = this.screenX + cameraX;
    const tileApexY = this.screenY + cameraY;

    const drawX = tileApexX;
    const drawY = tileApexY + IsoMath.TILE_HEIGHT / 2;

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(drawX, drawY + 4, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.isHarvested) {
      // Draw harvested plant (just a stump or small green bit)
      ctx.fillStyle = '#33691e';
      ctx.beginPath();
      ctx.ellipse(drawX, drawY, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw full Sabra Plant
      // Main pad
      ctx.fillStyle = '#558b2f';
      ctx.beginPath();
      ctx.ellipse(drawX, drawY - 10, 10, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Right pad
      ctx.fillStyle = '#689f38';
      ctx.beginPath();
      ctx.ellipse(drawX + 8, drawY - 14, 6, 10, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // Left pad
      ctx.fillStyle = '#33691e';
      ctx.beginPath();
      ctx.ellipse(drawX - 8, drawY - 8, 7, 11, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Sabra Fruit (Prickly pears)
      ctx.fillStyle = '#e64a19';
      ctx.beginPath();
      ctx.ellipse(drawX + 11, drawY - 20, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(drawX - 2, drawY - 24, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
