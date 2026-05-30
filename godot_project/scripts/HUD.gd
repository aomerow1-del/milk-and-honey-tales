extends CanvasLayer

@onready var health_label = $MarginContainer/VBoxContainer/HealthLabel
@onready var quest_label = $MarginContainer/VBoxContainer/QuestLabel
@onready var inventory_label = $MarginContainer/VBoxContainer/InventoryLabel
@onready var dialogue_panel = $DialoguePanel
@onready var dialogue_name = $DialoguePanel/MarginContainer/VBoxContainer/NameLabel
@onready var dialogue_text = $DialoguePanel/MarginContainer/VBoxContainer/TextLabel
@onready var health_bar = $MarginContainer/VBoxContainer/HealthBarContainer/HealthBar
@onready var health_bar_bg = $MarginContainer/VBoxContainer/HealthBarContainer/HealthBarBG
@onready var gold_label = $MarginContainer/VBoxContainer/GoldLabel
@onready var controls_hint = $ControlsHint

var boss_bar_bg: ColorRect
var boss_bar: ColorRect
var boss_name_label: Label

func _ready() -> void:
	dialogue_panel.visible = false
	# Fade in controls hint then fade out
	if controls_hint:
		var tween := create_tween()
		tween.tween_interval(5.0)
		tween.tween_property(controls_hint, "modulate:a", 0.0, 2.0)
	
	_create_boss_ui()
	update_ui()

func _create_boss_ui() -> void:
	boss_bar_bg = ColorRect.new()
	boss_bar_bg.color = Color(0.15, 0.05, 0.05, 0.8)
	boss_bar_bg.size = Vector2(400, 16)
	boss_bar_bg.position = Vector2(1280 / 2 - 200, 45)
	boss_bar_bg.visible = false
	add_child(boss_bar_bg)
	
	boss_bar = ColorRect.new()
	boss_bar.color = Color(0.95, 0.7, 0.2) # Bamba Gold
	boss_bar.size = Vector2(400, 16)
	boss_bar.position = Vector2(0, 0)
	boss_bar_bg.add_child(boss_bar)
	
	boss_name_label = Label.new()
	boss_name_label.size = Vector2(400, 25)
	boss_name_label.position = Vector2(1280 / 2 - 200, 15)
	boss_name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	boss_name_label.add_theme_font_size_override("font_size", 16)
	boss_name_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.4))
	boss_name_label.visible = false
	add_child(boss_name_label)

func _process(_delta: float) -> void:
	if Input.is_action_just_pressed("toggle_lang"):
		LocalizationManager.toggle_language()
		update_ui()
	_update_boss_ui()

func _update_boss_ui() -> void:
	var boss = GameManager.active_boss
	if is_instance_valid(boss) and boss.health > 0:
		boss_bar_bg.visible = true
		boss_name_label.visible = true
		boss_name_label.text = LocalizationManager.get_string("boss_health")
		var ratio := float(boss.health) / float(boss.max_health)
		boss_bar.size.x = boss_bar_bg.size.x * ratio
	else:
		if is_instance_valid(boss_bar_bg):
			boss_bar_bg.visible = false
		if is_instance_valid(boss_name_label):
			boss_name_label.visible = false


func update_ui() -> void:
	# Handle RTL text alignment
	var align := HORIZONTAL_ALIGNMENT_RIGHT if LocalizationManager.is_rtl else HORIZONTAL_ALIGNMENT_LEFT
	health_label.horizontal_alignment = align
	quest_label.horizontal_alignment = align
	inventory_label.horizontal_alignment = align
	dialogue_name.horizontal_alignment = align
	dialogue_text.horizontal_alignment = align
	if gold_label:
		gold_label.horizontal_alignment = align
	if controls_hint:
		controls_hint.text = LocalizationManager.get_string("controls_hint")
		controls_hint.horizontal_alignment = align

	var health_str = LocalizationManager.get_string("health")
	var inv_str = LocalizationManager.get_string("inventory")
	var gold_str = LocalizationManager.get_string("gold")

	health_label.text = health_str + ": " + str(GameManager.current_health) + "/" + str(GameManager.max_health)
	
	# Update health bar fill
	if health_bar:
		var ratio := float(GameManager.current_health) / float(GameManager.max_health)
		health_bar.size.x = health_bar_bg.size.x * ratio
		# Color shifts from green to red
		if ratio > 0.5:
			health_bar.color = Color(0.2, 0.8, 0.3)
		elif ratio > 0.25:
			health_bar.color = Color(0.9, 0.7, 0.1)
		else:
			health_bar.color = Color(0.9, 0.2, 0.1)

	if QuestManager.active_quests.size() > 0:
		quest_label.text = "⚔ " + LocalizationManager.get_string(QuestManager.active_quests[0])
	else:
		quest_label.text = "⚔ " + LocalizationManager.get_string("no_active_quests")


	# Gold display
	var gold_amount := 0
	if InventoryManager.items.has("gold"):
		gold_amount = InventoryManager.items["gold"]
	if gold_label:
		gold_label.text = "💰 " + gold_str + ": " + str(gold_amount)

	var inv_display = inv_str + ":\n"
	for item in InventoryManager.items:
		if item == "gold":
			continue  # Shown separately
		var item_name = item
		inv_display += "  • " + item_name + ": " + str(InventoryManager.items[item]) + "\n"
	inventory_label.text = inv_display

func show_dialogue(speaker_name: String, text: String) -> void:
	dialogue_name.text = speaker_name
	dialogue_text.text = text
	dialogue_panel.visible = true
	dialogue_panel.modulate = Color.WHITE
	# Auto hide after a few seconds with fade
	await get_tree().create_timer(3.5).timeout
	var tween := create_tween()
	tween.tween_property(dialogue_panel, "modulate:a", 0.0, 0.5)
	tween.tween_callback(func(): dialogue_panel.visible = false; dialogue_panel.modulate = Color.WHITE)
