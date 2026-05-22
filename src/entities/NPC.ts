import { IsoMath } from '../core/IsoMath';

export class NPC {
  public gridX: number;
  public gridY: number;

  constructor(x: number, y: number) {
    this.gridX = x;
    this.gridY = y;
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

    ctx.restore();
  }
}
