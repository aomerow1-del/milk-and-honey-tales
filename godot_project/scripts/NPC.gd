extends Area2D

@export var npc_name: String = "Arava"
@export var greeting_key: String = "greeting"

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
        var text = LocalizationManager.get_string(greeting_key)
        print(npc_name + " says: " + text)

        # Complete quest if interacting with Macabi
        if npc_name == "Macabi":
             QuestManager.complete_quest("quest_start")
             if get_tree().root.has_node("Main/HUD"):
                 get_tree().root.get_node("Main/HUD").update_ui()

        if get_tree().root.has_node("Main/HUD"):
            get_tree().root.get_node("Main/HUD").show_dialogue(npc_name, text)
