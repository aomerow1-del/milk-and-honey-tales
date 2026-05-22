export interface Enemy {
  id: string;
  nameKey: string;
  maxHealth: number;
  health: number;
  level: number;
  attackPower: number;
}

export class CombatManager {
  private inCombat: boolean = false;
  private currentEnemy: Enemy | null = null;
  private playerHealth: number = 100;
  private playerMaxHealth: number = 100;
  private playerAttack: number = 15;
  private log: string[] = [];
  private onCombatEnd: ((won: boolean) => void) | null = null;

  public startCombat(enemy: Enemy, onEnd: (won: boolean) => void) {
    this.inCombat = true;
    this.currentEnemy = { ...enemy };
    this.onCombatEnd = onEnd;
    this.log = [];
    this.addLog(`combatEncounter`);
  }

  public getInCombat() {
    return this.inCombat;
  }

  public getEnemy() {
    return this.currentEnemy;
  }

  public getPlayerHealth() {
    return { current: this.playerHealth, max: this.playerMaxHealth };
  }

  public getLog() {
    return this.log;
  }

  public addLog(key: string, args?: Record<string, string | number>) {
    // We will translate log keys in the UI level or pass keys and handle it there.
    let logEntry = key;
    if (args) {
      logEntry += '|' + JSON.stringify(args);
    }
    this.log.push(logEntry);
    if (this.log.length > 5) {
      this.log.shift();
    }
  }

  public playerActionAttack() {
    if (!this.inCombat || !this.currentEnemy) return;

    // Player attacks
    const damage = Math.max(1, Math.floor(this.playerAttack * (0.8 + Math.random() * 0.4)));
    this.currentEnemy.health -= damage;
    this.addLog('combatPlayerAttack', { damage });

    if (this.currentEnemy.health <= 0) {
      this.currentEnemy.health = 0;
      this.addLog('combatWon');
      this.endCombat(true);
    } else {
      this.enemyTurn();
    }
  }

  public playerActionFlee() {
    if (!this.inCombat) return;
    this.addLog('combatFled');
    this.endCombat(false);
  }

  private enemyTurn() {
    if (!this.inCombat || !this.currentEnemy) return;

    const damage = Math.max(1, Math.floor(this.currentEnemy.attackPower * (0.8 + Math.random() * 0.4)));
    this.playerHealth -= damage;
    this.addLog('combatEnemyAttack', { damage, enemy: this.currentEnemy.nameKey });

    if (this.playerHealth <= 0) {
      this.playerHealth = 0;
      this.addLog('combatLost');
      this.endCombat(false);
    }
  }

  private endCombat(won: boolean) {
    setTimeout(() => {
      this.inCombat = false;
      this.currentEnemy = null;
      // Heal player somewhat after combat
      if (this.playerHealth <= 0) this.playerHealth = this.playerMaxHealth;
      if (this.onCombatEnd) this.onCombatEnd(won);
    }, 1500); // 1.5s delay to read the result
  }
}
