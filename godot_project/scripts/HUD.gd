extends CanvasLayer

@onready var health_label = $MarginContainer/VBoxContainer/HealthLabel
@onready var quest_label = $MarginContainer/VBoxContainer/QuestLabel
@onready var inventory_label = $MarginContainer/VBoxContainer/InventoryLabel
@onready var dialogue_panel = $DialoguePanel
@onready var dialogue_name = $DialoguePanel/MarginContainer/VBoxContainer/NameLabel
@onready var dialogue_text = $DialoguePanel/MarginContainer/VBoxContainer/TextLabel

func _ready() -> void:
    dialogue_panel.visible = false
    update_ui()

func _process(_delta: float) -> void:
    if Input.is_action_just_pressed("toggle_lang"):
        LocalizationManager.toggle_language()
        update_ui()

func update_ui() -> void:
    # Handle RTL text alignment
    if LocalizationManager.is_rtl:
        health_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
        quest_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
        inventory_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
        dialogue_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
        dialogue_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
    else:
        health_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
        quest_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
        inventory_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
        dialogue_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
        dialogue_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT

    var health_str = LocalizationManager.get_string("health")
    var inv_str = LocalizationManager.get_string("inventory")
    var gold_str = LocalizationManager.get_string("gold")

    health_label.text = health_str + ": " + str(GameManager.current_health) + "/" + str(GameManager.max_health)

    if QuestManager.active_quests.size() > 0:
        quest_label.text = "Quest: " + LocalizationManager.get_string(QuestManager.active_quests[0])
    else:
        quest_label.text = "No active quests"

    var inv_display = inv_str + ":\n"
    for item in InventoryManager.items:
        var name = item
        if item == "gold": name = gold_str
        inv_display += "- " + name + ": " + str(InventoryManager.items[item]) + "\n"
    inventory_label.text = inv_display

func show_dialogue(speaker_name: String, text: String) -> void:
    dialogue_name.text = speaker_name
    dialogue_text.text = text
    dialogue_panel.visible = true
    # Auto hide after a few seconds
    await get_tree().create_timer(3.0).timeout
    dialogue_panel.visible = false
