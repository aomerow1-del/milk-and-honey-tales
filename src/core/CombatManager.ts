export type ElementType = 'Normal' | 'Water' | 'Fire' | 'Sand' | 'Shadow' | 'Blood';

export interface CombatEntity {
  id: string;
  nameKey: string;
  maxHealth: number;
  health: number;
  level: number;
  attackPower: number;
  elementType: ElementType;
  gridX: number;
  gridY: number;
  width: number;
  height: number;
  isDead: boolean;
  velocity: {x: number, y: number};
  damageFlashTimer: number;
}

export class CombatManager {
  private enemies: CombatEntity[] = [];

  private playerHealth: number = 100;
  private playerMaxHealth: number = 100;
  private playerMana: number = 50;
  private playerMaxMana: number = 50;

  // Real-time attacking
  private playerAttackCooldown: number = 0;
  private playerSpecialCooldown: number = 0;
  public playerBaseDamage: number = 25;

  public damageNumbers: DamageNumber[] = [];

  public getEnemies() {
      return this.enemies;
  }

  public spawnEnemy(enemy: CombatEntity) {
      this.enemies.push(enemy);
  }

  public getPlayerHealth() {
    return { current: this.playerHealth, max: this.playerMaxHealth };
  }

  public getPlayerMana() {
    return { current: this.playerMana, max: this.playerMaxMana };
  }

  public healPlayer(amount: number) {
      this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + amount);
  }

  public update(deltaTime: number, playerX: number, playerY: number, playerDashing: boolean) {
      if (this.playerAttackCooldown > 0) this.playerAttackCooldown -= deltaTime;
      if (this.playerSpecialCooldown > 0) this.playerSpecialCooldown -= deltaTime;

      // Update damage numbers
      for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
          const dn = this.damageNumbers[i];
          dn.timer -= deltaTime;
          dn.y -= deltaTime * 1.5; // Float up
          if (dn.timer <= 0) {
              this.damageNumbers.splice(i, 1);
          }
      }

      // Update enemies
      let bossDied = false;
      for (let i = this.enemies.length - 1; i >= 0; i--) {
          const enemy = this.enemies[i];
          if (enemy.damageFlashTimer > 0) enemy.damageFlashTimer -= deltaTime;

          if (enemy.health <= 0) {
              if (enemy.id === 'spawned_enemy') bossDied = true;
              enemy.isDead = true;
              this.enemies.splice(i, 1);
              continue;
          }

          // Simple AI: Move towards player
          const dx = playerX - enemy.gridX;
          const dy = playerY - enemy.gridY;
          const dist = Math.sqrt(dx*dx + dy*dy);

          if (dist > 0.5 && dist < 10) { // Aggro range
              enemy.gridX += (dx / dist) * 2.0 * deltaTime; // Speed
              enemy.gridY += (dy / dist) * 2.0 * deltaTime;
          }

          // Collision with player
          if (dist < 0.8 && !playerDashing) {
              const damage = enemy.attackPower * deltaTime;
              this.playerHealth -= damage; // DPS

              if (Math.random() < 0.1) { // Throttle player damage numbers so we don't spam
                  this.damageNumbers.push({
                      x: playerX,
                      y: playerY,
                      amount: Math.ceil(damage * 10), // Scale up for visual impact
                      timer: 0.5,
                      maxTimer: 0.5,
                      color: '#f44336'
                  });
              }

              if (this.playerHealth <= 0) {
                  this.playerHealth = 100; // Reset health to simulate respawn for now
                  // In a real Hades style this would trigger a death screen and reset the run
              }
          }
      }
      return bossDied;
  }

  public playerMeleeAttack(playerX: number, playerY: number, facingDirX: number, facingDirY: number): boolean {
      if (this.playerAttackCooldown > 0) return false;
      this.playerAttackCooldown = 0.3; // 300ms cooldown

      let hitAny = false;

      const attackRange = 2.0;
      const attackAngle = Math.PI / 3; // 60 degrees cone

      const pAngle = Math.atan2(facingDirY, facingDirX);

      for (const enemy of this.enemies) {
          const dx = enemy.gridX - playerX;
          const dy = enemy.gridY - playerY;
          const dist = Math.sqrt(dx*dx + dy*dy);

          if (dist <= attackRange) {
              const eAngle = Math.atan2(dy, dx);
              let angleDiff = eAngle - pAngle;

              // Normalize angle diff to -PI to PI
              while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
              while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

              if (Math.abs(angleDiff) <= attackAngle) {
                  enemy.health -= this.playerBaseDamage; // Base damage
                  enemy.damageFlashTimer = 0.2;

                  // Knockback
                  enemy.gridX += (dx/dist) * 1.5;
                  enemy.gridY += (dy/dist) * 1.5;
                  hitAny = true;

                  // Add damage number
                  this.damageNumbers.push({
                      x: enemy.gridX,
                      y: enemy.gridY,
                      amount: this.playerBaseDamage,
                      timer: 1.0,
                      maxTimer: 1.0,
                      color: '#ffeb3b'
                  });
              }
          }
      }

      return hitAny;
  }
}

export interface DamageNumber {
    x: number;
    y: number;
    amount: number;
    timer: number;
    maxTimer: number;
    color?: string;
}
