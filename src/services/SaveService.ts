export class SaveService {
  public static async saveState(region: string, playerX: number, playerY: number): Promise<void> {
    console.log(`[SaveService] Mock saving state... Region: ${region}, X: ${playerX}, Y: ${playerY}`);
    return new Promise(resolve => setTimeout(resolve, 500));
  }
}
