export const MAP_SIZE = 10;

// Central District Map Configuration
export const CentralDistrictObstacles: number[][] = [
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

export const CentralDistrictGrass: number[][] = [
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

// Negev Desert Map Configuration
export const NegevDesertObstacles: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 0, 0]
];

// 2 and 3 represent sand tiles
export const NegevDesertSand: number[][] = [
  [2, 3, 2, 3, 2, 3, 2, 3, 2, 3],
  [3, 2, 3, 2, 3, 2, 3, 2, 3, 2],
  [2, 3, 2, 3, 2, 3, 2, 3, 2, 3],
  [3, 2, 3, 2, 3, 2, 3, 2, 3, 2],
  [2, 3, 2, 3, 2, 3, 2, 3, 2, 3],
  [3, 2, 3, 2, 3, 2, 3, 2, 3, 2],
  [2, 3, 2, 3, 2, 3, 2, 3, 2, 3],
  [3, 2, 3, 2, 3, 2, 3, 2, 3, 2],
  [2, 3, 2, 3, 2, 3, 2, 3, 2, 3],
  [3, 2, 3, 2, 3, 2, 3, 2, 3, 2]
];

export interface RegionData {
  grid: number[][];
  obstacles: number[][];
}

const REGION_REGISTRY: Record<string, RegionData> = {
  'central_district': {
    grid: CentralDistrictGrass,
    obstacles: CentralDistrictObstacles
  },
  'negev_desert': {
    grid: NegevDesertSand,
    obstacles: NegevDesertObstacles
  }
};

export class GameMap {
  public readonly size = MAP_SIZE;
  private grid: number[][];
  private obstacles: number[][];

  constructor(initialRegion: string = 'central_district') {
    this.grid = [];
    this.obstacles = [];
    this.loadRegion(initialRegion);
  }

  public loadRegion(regionName: string): void {
    const data = REGION_REGISTRY[regionName] || REGION_REGISTRY['central_district'];
    this.grid = data.grid.map(row => [...row]);
    this.obstacles = data.obstacles.map(row => [...row]);
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
