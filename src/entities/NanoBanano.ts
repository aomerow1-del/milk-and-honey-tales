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

    // Smooth organic bounce
    const bounce = Math.abs(Math.sin(time * 3)) * 10;
    const squash = 1 + Math.sin(time * 6) * 0.05;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(floorCentreX, floorCentreY, 14 + (bounce * 0.2), 7 + (bounce * 0.1), 0, 0, Math.PI * 2);
    ctx.fill();

    // Pulse glow
    const pulse = 0.5 + Math.abs(Math.sin(time * 2)) * 0.5;
    ctx.shadowColor = `rgba(255, 235, 59, ${0.4 + pulse * 0.4})`;
    ctx.shadowBlur = 20 * pulse;

    const drawY = floorCentreY - 20 - bounce;

    ctx.translate(floorCentreX, drawY);
    ctx.scale(1/squash, squash);

    // Nano Banano Body (Rounded organic Banana)
    const bodyGrad = ctx.createRadialGradient(-2, -5, 0, 0, 0, 20);
    bodyGrad.addColorStop(0, '#fff59d'); // bright yellow highlight
    bodyGrad.addColorStop(0.7, '#fdd835');
    bodyGrad.addColorStop(1, '#fbc02d');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(-5, -20);
    ctx.bezierCurveTo(15, -15, 20, 5, 5, 20);
    ctx.bezierCurveTo(-5, 10, -15, -5, -5, -20);
    ctx.fill();

    // Eyes (Cute, soft)
    ctx.shadowBlur = 0; // Turn off glow for details
    ctx.fillStyle = '#3e2723';
    ctx.beginPath(); ctx.ellipse(3, -2, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-3, 0, 2, 3, 0, 0, Math.PI * 2); ctx.fill();

    // Blush
    ctx.fillStyle = 'rgba(255, 138, 101, 0.5)';
    ctx.beginPath(); ctx.ellipse(6, 2, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-6, 4, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();

    // Nano Tech details (Glowing circuits)
    ctx.fillStyle = '#18ffff'; // Cyan glow
    ctx.shadowColor = '#18ffff';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.ellipse(3, 10, 2, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(1, 15, 1.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.scale(squash, 1/squash);
    ctx.translate(-floorCentreX, -drawY);

    // Name tag text hovering
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '700 11px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nano Banano', floorCentreX, drawY - 30);

    ctx.restore();
  }
}
