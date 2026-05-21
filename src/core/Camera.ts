export class Camera {
  public x: number = 0;
  public y: number = 0;
  private lerpSpeed: number = 4.0; // Lerp speed coefficient for a subtle delayed follow

  constructor(startX: number = 0, startY: number = 0) {
    this.x = startX;
    this.y = startY;
  }

  /**
   * Smoothly interpolates (lerps) the camera towards the target, centering the target in the canvas.
   * @param targetX Target screen X coordinate (player screen x)
   * @param targetY Target screen Y coordinate (player screen y)
   * @param viewportWidth Width of the viewport (canvas width)
   * @param viewportHeight Height of the viewport (canvas height)
   * @param deltaTime Elapsed time in seconds
   */
  public update(targetX: number, targetY: number, viewportWidth: number, viewportHeight: number, deltaTime: number): void {
    // Offset targets to center the player
    const desiredX = targetX - viewportWidth / 2;
    const desiredY = targetY - viewportHeight / 2;

    // Frame-rate independent linear interpolation
    const t = 1 - Math.exp(-this.lerpSpeed * deltaTime);
    this.x += (desiredX - this.x) * t;
    this.y += (desiredY - this.y) * t;
  }

  /**
   * Instantly snaps the camera to center the target coordinates.
   */
  public snapTo(targetX: number, targetY: number, viewportWidth: number, viewportHeight: number): void {
    this.x = targetX - viewportWidth / 2;
    this.y = targetY - viewportHeight / 2;
  }
}
