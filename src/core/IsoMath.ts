export interface Point2D {
  x: number;
  y: number;
}

export class IsoMath {
  public static readonly TILE_WIDTH = 64;
  public static readonly TILE_HEIGHT = 32;

  /**
   * Projects 2D grid coordinates (Cartesian) into 2D isometric screen space coordinates.
   * @param gridX Cartesian X coordinate
   * @param gridY Cartesian Y coordinate
   * @returns Projected point on the screen (local origin)
   */
  public static gridToScreen(gridX: number, gridY: number): Point2D {
    return {
      x: (gridX - gridY) * (this.TILE_WIDTH / 2),
      y: (gridX + gridY) * (this.TILE_HEIGHT / 2)
    };
  }

  /**
   * Unprojects 2D screen coordinates back to grid (Cartesian) coordinates.
   * @param screenX Screen coordinate X
   * @param screenY Screen coordinate Y
   * @returns Cartesian grid coordinates
   */
  public static screenToGrid(screenX: number, screenY: number): Point2D {
    return {
      x: (screenY / this.TILE_HEIGHT) + (screenX / this.TILE_WIDTH),
      y: (screenY / this.TILE_HEIGHT) - (screenX / this.TILE_WIDTH)
    };
  }
}
