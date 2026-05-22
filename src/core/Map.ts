export const MAP_SIZE = 10;

export const ObstacleMap: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 1, 1, 0],
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 1, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 1, 1, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

// Basic 10x10 grass map layout
// Alternating 0 and 1 values represent different shades of grass tiles
export const GrassMap: number[][] = [
  [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
];

export class GameMap {
  public readonly size = MAP_SIZE;
  private grid: number[][];
  private obstacles: number[][];

  constructor() {
    // Clone layout model to track dynamic ground states/coordinates
    this.grid = GrassMap.map(row => [...row]);
    this.obstacles = ObstacleMap.map(row => [...row]);
  }

  public getTile(x: number, y: number): number {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      return -1; // Out of bounds
    }
    return this.grid[y][x];
  }

  public isValidCoordinate(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  public getObstacle(x: number, y: number): number {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      return 0; // Out of bounds
    }
    return this.obstacles[y][x];
  }

  public isPassable(x: number, y: number): boolean {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      return true; // Assume out-of-bounds is passable to trigger transitions
    }
    return this.obstacles[y][x] === 0;
  }
}
