extends Area2D

@export var npc_name: String = "Merchant"

@onready var prompt_label = $PromptLabel

func _ready() -> void:
    prompt_label.visible = false

func _on_body_entered(body: Node2D) -> void:
    if body.is_in_group("player"):
        prompt_label.visible = true

func _on_body_exited(body: Node2D) -> void:
    if body.is_in_group("player"):
        prompt_label.visible = false

func _process(_delta: float) -> void:
    if prompt_label.visible and Input.is_action_just_pressed("interact"):
        var text = LocalizationManager.get_string("shop") + "\n"
        for item in Shop.items_for_sale:
            text += "- " + Shop.items_for_sale[item].name + ": " + str(Shop.items_for_sale[item].cost) + " " + LocalizationManager.get_string("gold") + "\n"
        text += "(Press B to buy health potion)"

        if get_tree().root.has_node("Main/HUD"):
            get_tree().root.get_node("Main/HUD").show_dialogue(npc_name, text)

func _input(event: InputEvent) -> void:
    if prompt_label.visible and event is InputEventKey and event.pressed and event.keycode == KEY_B:
        if Shop.buy_item("health_potion"):
            if get_tree().root.has_node("Main/HUD"):
                get_tree().root.get_node("Main/HUD").update_ui()
                get_tree().root.get_node("Main/HUD").show_dialogue(npc_name, "Thank you!")
