extends Node

var save_path: String = "user://savegame.save"

func _ready() -> void:
    print("SaveSystem initialized. (Supabase Mock)")

func save_game() -> void:
    var save_data = {
        "health": GameManager.current_health,
        "quests": QuestManager.active_quests,
        "completed": QuestManager.completed_quests,
        "inventory": InventoryManager.items
    }
    var file = FileAccess.open(save_path, FileAccess.WRITE)
    if file:
        file.store_string(JSON.stringify(save_data))
        print("Game saved successfully to cloud mock.")
    else:
        print("Error saving game.")

func load_game() -> void:
    if FileAccess.file_exists(save_path):
        var file = FileAccess.open(save_path, FileAccess.READ)
        var json = JSON.new()
        var error = json.parse(file.get_as_text())
        if error == OK:
            var data = json.get_data()
            GameManager.current_health = data.get("health", 100)
            QuestManager.active_quests = data.get("quests", [])
            QuestManager.completed_quests = data.get("completed", [])
            InventoryManager.items = data.get("inventory", {})
            print("Game loaded successfully.")
