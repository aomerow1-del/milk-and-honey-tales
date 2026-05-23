extends Node

var active_quests: Array = []
var completed_quests: Array = []

func _ready() -> void:
    print("QuestManager initialized.")

func add_quest(quest_id: String) -> void:
    if quest_id not in active_quests and quest_id not in completed_quests:
        active_quests.append(quest_id)
        print("Quest added: " + quest_id)

func complete_quest(quest_id: String) -> void:
    if quest_id in active_quests:
        active_quests.erase(quest_id)
        completed_quests.append(quest_id)
        print("Quest completed: " + quest_id)
