extends Node

var items_for_sale: Dictionary = {
    "health_potion": {"cost": 50, "name": "Health Potion"},
    "strength_boon": {"cost": 150, "name": "Strength Boon"},
}

func _ready() -> void:
    print("Shop initialized.")

func buy_item(item_id: String) -> bool:
    if items_for_sale.has(item_id):
        var cost = items_for_sale[item_id].cost
        if InventoryManager.items.has("gold") and InventoryManager.items["gold"] >= cost:
            InventoryManager.items["gold"] -= cost
            InventoryManager.add_item(item_id, 1)
            print("Bought " + item_id)
            return true
        else:
            print("Not enough gold to buy " + item_id)
            return false
    return false
