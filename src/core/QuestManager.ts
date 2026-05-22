export interface Quest {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
}

export class QuestManager {
  private quests: Map<string, Quest>;

  constructor() {
    this.quests = new Map<string, Quest>();
  }

  public addQuest(quest: Quest): void {
    if (!this.quests.has(quest.id)) {
      this.quests.set(quest.id, quest);
    }
  }

  public completeQuest(id: string): void {
    const quest = this.quests.get(id);
    if (quest) {
      quest.isCompleted = true;
    }
  }

  public getActiveQuests(): Quest[] {
    return Array.from(this.quests.values()).filter(q => !q.isCompleted);
  }

  public hasQuest(id: string): boolean {
    return this.quests.has(id);
  }

  public isQuestCompleted(id: string): boolean {
    const quest = this.quests.get(id);
    return quest ? quest.isCompleted : false;
  }
}
