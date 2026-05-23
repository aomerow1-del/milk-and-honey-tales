import { IsoMath } from '../core/IsoMath';

const FRAME_W = 48;
const FRAME_H = 64;

export class NPC {
  public gridX: number;
  public gridY: number;

  private sprite: HTMLImageElement;
  private spriteLoaded: boolean = false;

  constructor(x: number, y: number) {
    this.gridX = x;
    this.gridY = y;

    this.sprite = new Image();
    this.sprite.onload = () => { this.spriteLoaded = true; };
    this.sprite.onerror = () => {
      this.spriteLoaded = false;
    };
    this.sprite.src = '/assets/npc_spritesheet.png';
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, time: number): void {
    const screenPos = IsoMath.tileToScreen(this.gridX, this.gridY);
    const drawX = screenPos.x + cameraX;
    const drawY = screenPos.y + cameraY + IsoMath.TILE_HEIGHT / 2;

    const animOffset = Math.sin(time * 3) * 2;

    ctx.save();

    // Sharp Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.moveTo(drawX - 15, drawY);
    ctx.lineTo(drawX, drawY + 8);
    ctx.lineTo(drawX + 15, drawY);
    ctx.lineTo(drawX, drawY - 8);
    ctx.fill();

    if (this.spriteLoaded) {
      const destX = drawX - FRAME_W / 2;
      const destY = drawY - FRAME_H;

      ctx.drawImage(
        this.sprite,
        0, 0,
        FRAME_W, FRAME_H,
        destX, destY,
        FRAME_W, FRAME_H
      );
    } else {
      // Celestial/Underworld God figure (Tall, angular, glowing)
      const isMaccabi = this.gridX === 2; // Rough assumption based on main.ts

      ctx.translate(drawX, drawY - 15 + animOffset);

      // Aura
      ctx.shadowColor = isMaccabi ? '#ff1744' : '#00e5ff'; // Red for wrath, cyan for swiftness
      ctx.shadowBlur = 20;
      ctx.fillStyle = isMaccabi ? 'rgba(255, 23, 68, 0.2)' : 'rgba(0, 229, 255, 0.2)';
      ctx.beginPath();
      ctx.ellipse(0, -15, 20, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cloak
      ctx.fillStyle = '#1a1a1a';
      ctx.strokeStyle = isMaccabi ? '#d50000' : '#00b0ff';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(0, -35); // hood top
      ctx.lineTo(15, -10); // shoulder right
      ctx.lineTo(20, 15);  // cloak bottom right
      ctx.lineTo(0, 10);   // cloak bottom center
      ctx.lineTo(-20, 15); // cloak bottom left
      ctx.lineTo(-15, -10); // shoulder left
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing face/mask
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(6, -15);
      ctx.lineTo(0, -10);
      ctx.lineTo(-6, -15);
      ctx.closePath();
      ctx.fill();

      // Floating weapon/symbol
      const floatY = Math.sin(time * 5) * 5;
      ctx.strokeStyle = '#ffeb3b'; // gold
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(25, -20 + floatY);
      ctx.lineTo(25, 0 + floatY);
      ctx.moveTo(15, -10 + floatY);
      ctx.lineTo(35, -10 + floatY);
      ctx.stroke();
    }

    ctx.restore();
  }
}
