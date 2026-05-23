extends Node2D

var enemy_scene = preload("res://scenes/Enemy.tscn")
var npc_scene = preload("res://scenes/NPC.tscn")
var hud_scene = preload("res://scenes/HUD.tscn")

func _ready() -> void:
    print("Main scene loaded.")

    # Add HUD
    var hud = hud_scene.instantiate()
    hud.name = "HUD"
    add_child(hud)

    # Initialize a quest
    QuestManager.add_quest("quest_start")
    hud.update_ui()

    # Spawn enemies
    for i in range(5):
        var enemy = enemy_scene.instantiate()
        var angle = randf() * TAU
        var dist = 300.0 + randf() * 200.0
        enemy.position = Vector2(cos(angle), sin(angle)) * dist
        $YSort.add_child(enemy)

    # Spawn NPCs
    var arava = npc_scene.instantiate()
    arava.position = Vector2(-200, -200)
    arava.npc_name = "Arava"
    arava.greeting_key = "greeting"
    $YSort.add_child(arava)

    var macabi = npc_scene.instantiate()
    macabi.position = Vector2(200, -200)
    macabi.npc_name = "Macabi"
    macabi.greeting_key = "boon_offer"
    $YSort.add_child(macabi)
    var shop = load("res://scenes/ShopNPC.tscn").instantiate()
    shop.position = Vector2(0, -200)
    $YSort.add_child(shop)
