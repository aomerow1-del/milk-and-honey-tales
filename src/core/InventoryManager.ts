export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  iconColor: string; // Placeholder for future icon asset
}

export class InventoryManager {
  private items: Map<string, InventoryItem>;
  private currency: number;

  constructor() {
    this.items = new Map<string, InventoryItem>();
    this.currency = 0;
  }

  public getCurrency(): number {
    return this.currency;
  }

  public addCurrency(amount: number): void {
    if (amount > 0) {
      this.currency += amount;
    }
  }

  public removeCurrency(amount: number): boolean {
    if (amount > 0 && this.currency >= amount) {
      this.currency -= amount;
      return true;
    }
    return false;
  }

  public addItem(item: Omit<InventoryItem, 'quantity'>, amount: number = 1): void {
    if (this.items.has(item.id)) {
      const existing = this.items.get(item.id)!;
      existing.quantity += amount;
    } else {
      this.items.set(item.id, { ...item, quantity: amount });
    }
  }

  public removeItem(id: string, amount: number = 1): boolean {
    if (!this.items.has(id)) return false;

    const existing = this.items.get(id)!;
    if (existing.quantity >= amount) {
      existing.quantity -= amount;
      if (existing.quantity === 0) {
        this.items.delete(id);
      }
      return true;
    }
    return false;
  }

  public getItems(): InventoryItem[] {
    return Array.from(this.items.values());
  }

  public hasItem(id: string, amount: number = 1): boolean {
    const item = this.items.get(id);
    return item ? item.quantity >= amount : false;
  }
}
