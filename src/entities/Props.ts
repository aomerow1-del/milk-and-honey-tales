import { IsoMath } from '../core/IsoMath';

export class Prop {
  public gridX: number;
  public gridY: number;

  constructor(gridX: number, gridY: number) {
    this.gridX = gridX;
    this.gridY = gridY;
  }
}

export class OliveTree extends Prop {
  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, time: number): void {
    const screenPos = IsoMath.tileToScreen(this.gridX, this.gridY);
    const drawX = screenPos.x + cameraX;
    const drawY = screenPos.y + cameraY + IsoMath.TILE_HEIGHT / 2;

    const windSwing = Math.sin(time * 2 + this.gridX) * 3;

    ctx.save();

    // Sharp shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.moveTo(drawX - 25, drawY);
    ctx.lineTo(drawX, drawY + 10);
    ctx.lineTo(drawX + 25, drawY);
    ctx.lineTo(drawX, drawY - 10);
    ctx.fill();

    // Trunk (jagged)
    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#d32f2f'; // glowing red edge
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(drawX - 5, drawY);
    ctx.lineTo(drawX + 5, drawY);
    ctx.lineTo(drawX + 3 + windSwing, drawY - 20);
    ctx.lineTo(drawX + 8 + windSwing, drawY - 30);
    ctx.lineTo(drawX + windSwing, drawY - 45);
    ctx.lineTo(drawX - 3 + windSwing, drawY - 25);
    ctx.lineTo(drawX - 8 + windSwing, drawY - 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Leaves / Canopy (Sharp, ethereal fire/blood)
    ctx.fillStyle = 'rgba(211, 47, 47, 0.8)'; // deep red
    ctx.shadowColor = '#ff5252';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(drawX + windSwing, drawY - 55);
    ctx.lineTo(drawX + windSwing + 25, drawY - 35);
    ctx.lineTo(drawX + windSwing + 5, drawY - 30);
    ctx.lineTo(drawX + windSwing - 20, drawY - 40);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(drawX + windSwing - 15, drawY - 45);
    ctx.lineTo(drawX + windSwing + 10, drawY - 25);
    ctx.lineTo(drawX + windSwing - 30, drawY - 25);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

export class AncientJar extends Prop {
  public broken: boolean = false;

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, time: number): void {
    const screenPos = IsoMath.tileToScreen(this.gridX, this.gridY);
    const drawX = screenPos.x + cameraX;
    const drawY = screenPos.y + cameraY + IsoMath.TILE_HEIGHT / 2;

    const bounce = Math.sin(time * 3 + this.gridX) * 2;

    ctx.save();

    if (this.broken) {
      // Broken jagged shards
      ctx.fillStyle = '#2c2c2c';
      ctx.strokeStyle = '#ff9800'; // glowing ember edges
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(drawX - 10, drawY);
      ctx.lineTo(drawX - 15, drawY - 8);
      ctx.lineTo(drawX - 5, drawY - 4);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(drawX + 8, drawY + 2);
      ctx.lineTo(drawX + 15, drawY - 6);
      ctx.lineTo(drawX + 4, drawY - 2);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else {
      // Sharp Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.moveTo(drawX - 15, drawY);
      ctx.lineTo(drawX, drawY + 8);
      ctx.lineTo(drawX + 15, drawY);
      ctx.lineTo(drawX, drawY - 8);
      ctx.fill();

      const drawJarY = drawY - bounce;

      // Jar Body (angular)
      ctx.fillStyle = '#1c1c1c';
      ctx.strokeStyle = '#ff9800'; // glowing orange edge
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(drawX - 6, drawJarY);
      ctx.lineTo(drawX - 14, drawJarY - 10);
      ctx.lineTo(drawX - 10, drawJarY - 22);
      ctx.lineTo(drawX - 4, drawJarY - 26);
      ctx.lineTo(drawX + 4, drawJarY - 26);
      ctx.lineTo(drawX + 10, drawJarY - 22);
      ctx.lineTo(drawX + 14, drawJarY - 10);
      ctx.lineTo(drawX + 6, drawJarY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing rune
      ctx.strokeStyle = '#ffeb3b';
      ctx.shadowColor = '#ffeb3b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(drawX - 4, drawJarY - 15);
      ctx.lineTo(drawX + 4, drawJarY - 15);
      ctx.lineTo(drawX, drawJarY - 8);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export class OasisPool extends Prop {
  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, time: number): void {
    const screenPos = IsoMath.tileToScreen(this.gridX, this.gridY);
    const drawX = screenPos.x + cameraX;
    const drawY = screenPos.y + cameraY + IsoMath.TILE_HEIGHT / 2;

    ctx.save();

    // Pool border (Jagged Obsidian Rocks)
    ctx.fillStyle = '#0a0a0a';
    ctx.strokeStyle = '#4a148c'; // dark purple highlight
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(drawX - 30, drawY);
    ctx.lineTo(drawX - 15, drawY + 15);
    ctx.lineTo(drawX + 10, drawY + 18);
    ctx.lineTo(drawX + 32, drawY + 5);
    ctx.lineTo(drawX + 20, drawY - 12);
    ctx.lineTo(drawX - 10, drawY - 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Blood/Styx Water
    ctx.fillStyle = '#b71c1c'; // deep blood red
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 20 + Math.sin(time * 4) * 10;

    ctx.beginPath();
    ctx.moveTo(drawX - 22, drawY);
    ctx.lineTo(drawX - 10, drawY + 10);
    ctx.lineTo(drawX + 5, drawY + 12);
    ctx.lineTo(drawX + 24, drawY + 2);
    ctx.lineTo(drawX + 12, drawY - 8);
    ctx.lineTo(drawX - 5, drawY - 12);
    ctx.closePath();
    ctx.fill();

    // Sharp Ripples
    ctx.strokeStyle = '#ff8a80';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0; // reset
    const rippleScale = (time * 2) % 1;
    ctx.beginPath();
    ctx.moveTo(drawX - 10 * rippleScale, drawY);
    ctx.lineTo(drawX, drawY + 5 * rippleScale);
    ctx.lineTo(drawX + 10 * rippleScale, drawY);
    ctx.lineTo(drawX, drawY - 5 * rippleScale);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
}

export class Boulder extends Prop {
  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const screenPos = IsoMath.tileToScreen(this.gridX, this.gridY);
    const drawX = screenPos.x + cameraX;
    const drawY = screenPos.y + cameraY + IsoMath.TILE_HEIGHT / 2;

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.beginPath();
    ctx.moveTo(drawX - 20, drawY);
    ctx.lineTo(drawX, drawY + 12);
    ctx.lineTo(drawX + 20, drawY);
    ctx.lineTo(drawX, drawY - 12);
    ctx.fill();

    // Rock body (sharp and dark)
    ctx.fillStyle = '#111';
    ctx.strokeStyle = '#7b1fa2'; // purple glow
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(drawX - 15, drawY);
    ctx.lineTo(drawX - 25, drawY - 15);
    ctx.lineTo(drawX - 5, drawY - 30);
    ctx.lineTo(drawX + 15, drawY - 20);
    ctx.lineTo(drawX + 25, drawY - 5);
    ctx.lineTo(drawX + 10, drawY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Magma cracks
    ctx.strokeStyle = '#e65100'; // dark orange
    ctx.shadowColor = '#ff9800';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(drawX - 10, drawY - 5);
    ctx.lineTo(drawX, drawY - 15);
    ctx.lineTo(drawX + 10, drawY - 10);
    ctx.stroke();

    ctx.restore();
  }
}

export class ObsidianSpike extends Prop {
  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, _time: number): void {
    const screenPos = IsoMath.tileToScreen(this.gridX, this.gridY);
    const drawX = screenPos.x + cameraX;
    const drawY = screenPos.y + cameraY + IsoMath.TILE_HEIGHT / 2;

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.beginPath();
    ctx.moveTo(drawX - 10, drawY);
    ctx.lineTo(drawX, drawY + 6);
    ctx.lineTo(drawX + 10, drawY);
    ctx.lineTo(drawX, drawY - 6);
    ctx.fill();

    // Spike Body
    ctx.fillStyle = '#100c14'; // very dark slate
    ctx.strokeStyle = '#6200ea'; // deep purple edge
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(drawX - 8, drawY);
    ctx.lineTo(drawX, drawY - 35); // tall and sharp
    ctx.lineTo(drawX + 8, drawY);
    ctx.lineTo(drawX, drawY + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner highlight
    ctx.strokeStyle = 'rgba(156, 39, 176, 0.6)'; // lighter purple
    ctx.beginPath();
    ctx.moveTo(drawX, drawY - 35);
    ctx.lineTo(drawX, drawY + 8);
    ctx.stroke();

    ctx.restore();
  }
}
