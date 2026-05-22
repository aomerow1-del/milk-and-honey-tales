import { IsoMath } from '../core/IsoMath';

export class NanoBanano {
  public gridX: number;
  public gridY: number;

  constructor(startX: number, startY: number) {
    this.gridX = startX;
    this.gridY = startY;
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, time: number): void {
    const screenPos = IsoMath.tileToScreen(this.gridX, this.gridY);

    // The visual "floor centre" of the tile
    const floorCentreX = screenPos.x + cameraX;
    const floorCentreY = screenPos.y + cameraY + IsoMath.TILE_HEIGHT / 2;

    ctx.save();

    // Bobbing animation based on time
    const bounce = Math.abs(Math.sin(time * 0.005)) * 15;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(floorCentreX, floorCentreY, 12 + (bounce * 0.2), 6 + (bounce * 0.1), 0, 0, Math.PI * 2);
    ctx.fill();

    // Pulse glow
    const pulse = 0.5 + Math.abs(Math.sin(time * 0.003)) * 0.5;
    ctx.shadowColor = 'rgba(255, 235, 59, 0.8)';
    ctx.shadowBlur = 15 * pulse;

    const drawY = floorCentreY - 20 - bounce;

    // Nano Banano Body (Banana Shape)
    ctx.fillStyle = '#ffeb3b'; // Yellow
    ctx.strokeStyle = '#f57f17';
    ctx.lineWidth = 2;

    ctx.beginPath();
    // Start top tip
    ctx.moveTo(floorCentreX - 5, drawY - 15);
    // Curve right
    ctx.quadraticCurveTo(floorCentreX + 15, drawY, floorCentreX + 5, drawY + 20);
    // Curve back up
    ctx.quadraticCurveTo(floorCentreX, drawY + 10, floorCentreX - 10, drawY - 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.shadowBlur = 0; // Turn off glow for details
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(floorCentreX + 2, drawY - 2, 2, 0, Math.PI * 2); // Right eye
    ctx.arc(floorCentreX - 2, drawY, 2, 0, Math.PI * 2); // Left eye
    ctx.fill();

    // Nano Tech details
    ctx.fillStyle = '#00e5ff'; // Cyan nano details
    ctx.beginPath();
    ctx.arc(floorCentreX + 3, drawY + 10, 2, 0, Math.PI * 2);
    ctx.arc(floorCentreX + 1, drawY + 15, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Name tag text hovering
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nano Banano', floorCentreX, drawY - 25);

    ctx.restore();
  }
}
