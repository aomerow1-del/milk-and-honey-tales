extends Node

var items: Dictionary = {"gold": 100}

func _ready() -> void:
    print("InventoryManager initialized.")

func add_item(item_id: String, amount: int = 1) -> void:
    if item_id in items:
        items[item_id] += amount
    else:
        items[item_id] = amount
    print("Added " + str(amount) + " " + item_id + " to inventory.")
