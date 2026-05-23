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

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(drawX, drawY, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // Trunk
    const trunkGrad = ctx.createLinearGradient(drawX - 5, drawY, drawX + 5, drawY);
    trunkGrad.addColorStop(0, '#5D4037');
    trunkGrad.addColorStop(1, '#3E2723');
    ctx.fillStyle = trunkGrad;
    ctx.beginPath();
    ctx.moveTo(drawX - 4, drawY);
    ctx.lineTo(drawX + 4, drawY);
    ctx.quadraticCurveTo(drawX + 2 + windSwing * 0.2, drawY - 20, drawX + windSwing, drawY - 40);
    ctx.lineTo(drawX - 2 + windSwing, drawY - 40);
    ctx.quadraticCurveTo(drawX - 2 + windSwing * 0.2, drawY - 20, drawX - 4, drawY);
    ctx.fill();

    // Leaves / Canopy
    const canopyGrad = ctx.createRadialGradient(drawX + windSwing - 5, drawY - 50, 5, drawX + windSwing, drawY - 45, 30);
    canopyGrad.addColorStop(0, '#81C784');
    canopyGrad.addColorStop(0.7, '#388E3C');
    canopyGrad.addColorStop(1, '#1B5E20');

    ctx.fillStyle = canopyGrad;
    ctx.beginPath();
    ctx.ellipse(drawX + windSwing, drawY - 50, 25, 20 + Math.sin(time + this.gridY) * 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(drawX + windSwing - 15, drawY - 40, 20, 15, Math.PI/6, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(drawX + windSwing + 15, drawY - 45, 18, 15, -Math.PI/6, 0, Math.PI * 2);
    ctx.fill();

    // Olives
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(drawX + windSwing - 10, drawY - 45, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(drawX + windSwing + 5, drawY - 55, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(drawX + windSwing + 12, drawY - 35, 2, 0, Math.PI * 2);
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

    // Optional magic glow/bobbing
    const bounce = Math.sin(time * 2 + this.gridX) * 2;

    ctx.save();

    if (this.broken) {
      // Broken shards
      ctx.fillStyle = '#8D6E63';
      ctx.beginPath();
      ctx.moveTo(drawX - 10, drawY);
      ctx.lineTo(drawX - 5, drawY - 5);
      ctx.lineTo(drawX, drawY);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(drawX + 10, drawY + 2);
      ctx.lineTo(drawX + 4, drawY - 2);
      ctx.lineTo(drawX + 12, drawY - 4);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(drawX - 2, drawY + 3);
      ctx.lineTo(drawX + 3, drawY + 1);
      ctx.lineTo(drawX, drawY - 3);
      ctx.fill();
    } else {
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(drawX, drawY, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      const drawJarY = drawY - bounce; // apply bounce to the jar body

      // Jar Body
      const jarGrad = ctx.createLinearGradient(drawX - 10, drawJarY, drawX + 10, drawJarY);
      jarGrad.addColorStop(0, '#795548');
      jarGrad.addColorStop(0.8, '#A1887F');
      jarGrad.addColorStop(1, '#5D4037');

      ctx.fillStyle = jarGrad;
      ctx.beginPath();
      ctx.moveTo(drawX - 6, drawJarY);
      ctx.bezierCurveTo(drawX - 16, drawJarY - 5, drawX - 14, drawJarY - 20, drawX - 4, drawJarY - 22);
      ctx.lineTo(drawX + 4, drawJarY - 22);
      ctx.bezierCurveTo(drawX + 14, drawJarY - 20, drawX + 16, drawJarY - 5, drawX + 6, drawJarY);
      ctx.fill();

      // Jar Neck/Opening
      ctx.fillStyle = '#3E2723';
      ctx.beginPath();
      ctx.ellipse(drawX, drawJarY - 22, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Jar Rim
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(drawX, drawJarY - 22, 5, 2, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Decorative banding
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(drawX, drawJarY - 10, 11, 4, 0, 0, Math.PI * 2);
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

    // Pool border (Rocks)
    ctx.fillStyle = '#757575';
    ctx.beginPath();
    ctx.ellipse(drawX, drawY + 2, 28, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Water
    const waterGrad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, 25);
    waterGrad.addColorStop(0, '#4DD0E1');
    waterGrad.addColorStop(1, '#0097A7');

    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.ellipse(drawX, drawY, 24, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ripples
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    const rippleRadius = (time * 10) % 20;
    ctx.beginPath();
    ctx.ellipse(drawX, drawY, rippleRadius, rippleRadius * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();

    const rippleRadius2 = ((time * 10) + 10) % 20;
    ctx.beginPath();
    ctx.ellipse(drawX, drawY, rippleRadius2, rippleRadius2 * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Bloom/Glow around the oasis
    ctx.shadowColor = '#00BCD4';
    ctx.shadowBlur = 15 + Math.sin(time * 3) * 5;
    ctx.fillStyle = 'rgba(0, 188, 212, 0.2)';
    ctx.beginPath();
    ctx.ellipse(drawX, drawY, 24, 11, 0, 0, Math.PI * 2);
    ctx.fill();

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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(drawX, drawY, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rock body
    const rockGrad = ctx.createRadialGradient(drawX - 5, drawY - 10, 2, drawX, drawY, 20);
    rockGrad.addColorStop(0, '#BDBDBD');
    rockGrad.addColorStop(0.7, '#757575');
    rockGrad.addColorStop(1, '#424242');

    ctx.fillStyle = rockGrad;
    ctx.beginPath();
    ctx.moveTo(drawX - 15, drawY);
    ctx.quadraticCurveTo(drawX - 20, drawY - 15, drawX - 5, drawY - 20);
    ctx.quadraticCurveTo(drawX + 10, drawY - 25, drawX + 18, drawY - 10);
    ctx.quadraticCurveTo(drawX + 15, drawY + 2, drawX, drawY + 2);
    ctx.quadraticCurveTo(drawX - 10, drawY + 3, drawX - 15, drawY);
    ctx.fill();

    // Highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.ellipse(drawX - 8, drawY - 12, 6, 3, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
