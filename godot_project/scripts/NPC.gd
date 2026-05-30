extends Area2D

@export var npc_name: String = "Arava"
@export var greeting_key: String = "greeting"

@onready var prompt_label = $PromptLabel

var player_nearby := false
var idle_time := 0.0
var glow_alpha := 0.0

func _ready() -> void:
	prompt_label.visible = false

func _on_body_entered(body: Node2D) -> void:
	if body.is_in_group("player"):
		prompt_label.visible = true
		player_nearby = true

func _on_body_exited(body: Node2D) -> void:
	if body.is_in_group("player"):
		prompt_label.visible = false
		player_nearby = false

func _process(delta: float) -> void:
	idle_time += delta
	
	# Glow when player is nearby
	if player_nearby:
		glow_alpha = minf(glow_alpha + delta * 3.0, 0.4)
	else:
		glow_alpha = maxf(glow_alpha - delta * 2.0, 0.0)
	
	if prompt_label.visible and Input.is_action_just_pressed("interact"):
		var text := ""
		
		if npc_name == "Elder Dan":
			if not QuestManager.active_quests.has("quest_find_macabi") and not QuestManager.completed_quests.has("quest_find_macabi"):
				QuestManager.add_quest("quest_find_macabi")
				text = LocalizationManager.get_string("dan_greeting_1")
			elif QuestManager.active_quests.has("quest_find_macabi"):
				text = LocalizationManager.get_string("dan_greeting_2")
			elif QuestManager.completed_quests.has("quest_find_macabi") and not QuestManager.completed_quests.has("quest_defeat_golem"):
				text = LocalizationManager.get_string("dan_greeting_3")
			else:
				text = LocalizationManager.get_string("dan_greeting_4")
				
		elif npc_name == "Macabi":
			if QuestManager.active_quests.has("quest_find_macabi"):
				QuestManager.complete_quest("quest_find_macabi")
				QuestManager.add_quest("quest_defeat_golem")
				text = LocalizationManager.get_string("macabi_greeting")
			elif QuestManager.active_quests.has("quest_defeat_golem"):
				text = LocalizationManager.get_string("macabi_active_boss")
			elif QuestManager.completed_quests.has("quest_defeat_golem"):
				text = LocalizationManager.get_string("macabi_done")
			else:
				text = LocalizationManager.get_string(greeting_key)
				
		elif npc_name == "Gali":
			if not QuestManager.completed_quests.has("quest_gali_tutorial"):
				QuestManager.completed_quests.append("quest_gali_tutorial")
				InventoryManager.items["gold"] = InventoryManager.items.get("gold", 0) + 50
				SaveSystem.save_game()
				text = LocalizationManager.get_string("gali_greeting_1")
			else:
				text = LocalizationManager.get_string("gali_greeting_2")
				
		else:
			text = LocalizationManager.get_string(greeting_key)
			
		if get_tree().root.has_node("Main/HUD"):
			get_tree().root.get_node("Main/HUD").update_ui()
			get_tree().root.get_node("Main/HUD").show_dialogue(npc_name, text)
	
	queue_redraw()

func _draw() -> void:
	var breath := sin(idle_time * 2.0) * 1.5
	
	# Interaction glow
	if glow_alpha > 0:
		var pulse := (sin(idle_time * 4.0) + 1.0) * 0.5
		_draw_ellipse(Vector2(0, 0), 28 + pulse * 4, 20 + pulse * 3, Color(1, 0.85, 0.4, glow_alpha * 0.3))
	
	# Shadow
	_draw_ellipse(Vector2(0, 16), 12, 5, Color(0, 0, 0, 0.2))
	
	# Robe / body
	var robe_color: Color
	if npc_name == "Arava":
		robe_color = Color(0.65, 0.55, 0.35)
	elif npc_name == "Elder Dan":
		robe_color = Color(0.25, 0.35, 0.45)
	elif npc_name == "Gali":
		robe_color = Color(0.25, 0.55, 0.4)
	else:
		robe_color = Color(0.3, 0.45, 0.65)
	
	# Robe body
	var robe_pts := PackedVector2Array([
		Vector2(-10, 14),
		Vector2(-12, 0 + breath * 0.3),
		Vector2(-8, -10 + breath),
		Vector2(0, -12 + breath),
		Vector2(8, -10 + breath),
		Vector2(12, 0 + breath * 0.3),
		Vector2(10, 14),
	])
	draw_colored_polygon(robe_pts, robe_color)
	
	# Robe detail band
	draw_rect(Rect2(-8, 2 + breath * 0.2, 16, 2), Color(robe_color.r + 0.15, robe_color.g + 0.1, robe_color.b, 0.7))
	
	# Head
	var skin_color := Color(0.8, 0.65, 0.5)
	draw_circle(Vector2(0, -16 + breath), 6, skin_color)
	
	# Eyes (friendly)
	draw_circle(Vector2(-2, -16 + breath), 1.2, Color(0.2, 0.15, 0.1))
	draw_circle(Vector2(2, -16 + breath), 1.2, Color(0.2, 0.15, 0.1))
	
	# Smile
	draw_arc(Vector2(0, -14 + breath), 2.5, 0.3, PI - 0.3, 8, Color(0.3, 0.2, 0.15), 1.0)
	
	# Hat/hood/facial features
	if npc_name == "Arava":
		# Desert Keffiyeh (Headscarf) - detailed red & white checkered pattern
		var hood_pts := PackedVector2Array([
			Vector2(-7, -16 + breath),
			Vector2(-5, -25 + breath),
			Vector2(0, -26 + breath),
			Vector2(5, -25 + breath),
			Vector2(7, -16 + breath),
		])
		draw_colored_polygon(hood_pts, Color(0.95, 0.95, 0.95)) # White base
		
		# Checkered red patterns on headscarf
		draw_line(Vector2(-5, -25 + breath), Vector2(5, -17 + breath), Color(0.8, 0.15, 0.15), 1.0)
		draw_line(Vector2(5, -25 + breath), Vector2(-5, -17 + breath), Color(0.8, 0.15, 0.15), 1.0)
		draw_line(Vector2(-2, -26 + breath), Vector2(2, -18 + breath), Color(0.8, 0.15, 0.15), 1.0)
		
		# Black headband (Agal)
		draw_rect(Rect2(-6, -21 + breath, 12, 2.5), Color(0.12, 0.12, 0.12))
		
		# Flowing scarf tail
		var scarf_sway := sin(idle_time * 2.0) * 1.8
		var scarf_pts := PackedVector2Array([
			Vector2(-6, -12 + breath),
			Vector2(-11 - scarf_sway, -2 + breath + scarf_sway),
			Vector2(-7 - scarf_sway, 0 + breath + scarf_sway * 0.8),
			Vector2(-4, -10 + breath),
		])
		draw_colored_polygon(scarf_pts, Color(0.95, 0.95, 0.95))
		draw_line(Vector2(-6, -12 + breath), Vector2(-11 - scarf_sway, -2 + breath + scarf_sway), Color(0.8, 0.15, 0.15), 1.0)
		
	elif npc_name == "Elder Dan":
		# Long white beard (simple convex triangle)
		var beard_pts := PackedVector2Array([
			Vector2(-5, -13 + breath),
			Vector2(0, -1 + breath),
			Vector2(5, -13 + breath),
		])
		draw_colored_polygon(beard_pts, Color(0.95, 0.95, 0.95))
		
		# Mystical grey hood
		var hood_pts := PackedVector2Array([
			Vector2(-7, -16 + breath),
			Vector2(-5, -25 + breath),
			Vector2(0, -26 + breath),
			Vector2(5, -25 + breath),
			Vector2(7, -16 + breath),
		])
		draw_colored_polygon(hood_pts, Color(0.85, 0.85, 0.85))
	elif npc_name == "Gali":
		# Brown explorer cap (simple dome + visor line)
		var cap_pts := PackedVector2Array([
			Vector2(-7, -17 + breath),
			Vector2(-5, -23 + breath),
			Vector2(5, -23 + breath),
			Vector2(7, -17 + breath),
		])
		draw_colored_polygon(cap_pts, Color(0.4, 0.25, 0.1))
		# Visor bill
		draw_line(Vector2(6, -18 + breath), Vector2(11, -18 + breath), Color(0.4, 0.25, 0.1), 2.0)
	else:
		# Mystical headband (Macabi)
		draw_rect(Rect2(-6, -21 + breath, 12, 3), Color(0.7, 0.5, 0.2))
		draw_circle(Vector2(0, -20 + breath), 2, Color(0.9, 0.7, 0.2))
		
		# Floating rotating magic runes (HDR Glowing Cyan)
		for i in 3:
			var rune_angle := idle_time * 2.5 + i * TAU / 3.0
			var rune_pos := Vector2(cos(rune_angle) * 14.0, -27 + breath + sin(rune_angle * 0.8) * 3.0)
			# Draw glowing core
			draw_circle(rune_pos, 2.0, Color(0.3, 1.2, 2.5))
			# Light orbit trail
			draw_circle(rune_pos, 1.0, Color(0.1, 0.5, 1.5, 0.45))

func _draw_ellipse(center: Vector2, rx: float, ry: float, color: Color) -> void:
	var pts := PackedVector2Array()
	for i in 20:
		var angle := float(i) / 20.0 * TAU
		pts.append(center + Vector2(cos(angle) * rx, sin(angle) * ry))
	draw_colored_polygon(pts, color)
