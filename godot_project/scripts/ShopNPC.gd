extends Area2D

@export var npc_name: String = "Merchant"

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
	
	if player_nearby:
		glow_alpha = minf(glow_alpha + delta * 3.0, 0.5)
	else:
		glow_alpha = maxf(glow_alpha - delta * 2.0, 0.0)
	
	if prompt_label.visible and Input.is_action_just_pressed("interact"):
		var text = LocalizationManager.get_string("shop") + "\n"
		for item in Shop.items_for_sale:
			text += "- " + Shop.items_for_sale[item].name + ": " + str(Shop.items_for_sale[item].cost) + " " + LocalizationManager.get_string("gold") + "\n"
		text += "(Press B to buy health potion)"

		if get_tree().root.has_node("Main/HUD"):
			get_tree().root.get_node("Main/HUD").show_dialogue(npc_name, text)
	
	queue_redraw()

func _input(event: InputEvent) -> void:
	if prompt_label.visible and event is InputEventKey and event.pressed and event.keycode == KEY_B:
		if Shop.buy_item("health_potion"):
			if get_tree().root.has_node("Main/HUD"):
				get_tree().root.get_node("Main/HUD").update_ui()
				get_tree().root.get_node("Main/HUD").show_dialogue(npc_name, "Thank you!")

func _draw() -> void:
	var breath := sin(idle_time * 1.8) * 1.5
	
	# Merchant glow
	if glow_alpha > 0:
		var pulse := (sin(idle_time * 3.0) + 1.0) * 0.5
		_draw_ellipse(Vector2(0, 0), 32 + pulse * 5, 22 + pulse * 3, Color(0.3, 1, 0.4, glow_alpha * 0.25))
	
	# Shadow
	_draw_ellipse(Vector2(0, 18), 14, 6, Color(0, 0, 0, 0.2))
	
	# --- 1. Hanging Brass Lantern (HDR Glow) ---
	# Wooden post & arm
	draw_line(Vector2(22, 18), Vector2(22, -28), Color(0.35, 0.22, 0.12), 2.5) # vertical post
	draw_line(Vector2(22, -28), Vector2(12, -28), Color(0.35, 0.22, 0.12), 1.8) # horizontal arm
	# Chain
	draw_line(Vector2(12, -28), Vector2(12, -21), Color(0.2, 0.2, 0.2), 1.0)
	# Lantern top cap
	draw_rect(Rect2(9.5, -21, 5, 2), Color(0.15, 0.15, 0.15))
	# Lantern light (HDR Glowing Core)
	draw_circle(Vector2(12, -16), 3.0, Color(2.8, 1.5, 0.3))
	# Lantern glow halo (pulsing)
	var halo_pulse := sin(idle_time * 3.5) * 0.03
	draw_circle(Vector2(12, -16), 10.0, Color(1.0, 0.65, 0.15, 0.12 + halo_pulse))
	# Brass frame
	draw_line(Vector2(9, -19), Vector2(9, -13), Color(0.65, 0.45, 0.15), 1.0) # left
	draw_line(Vector2(15, -19), Vector2(15, -13), Color(0.65, 0.45, 0.15), 1.0) # right
	draw_rect(Rect2(9, -13, 6, 2), Color(0.65, 0.45, 0.15)) # bottom
	
	# --- 2. Cart/stand behind merchant ---
	draw_rect(Rect2(-18, -4 + breath * 0.1, 36, 22), Color(0.4, 0.28, 0.15))
	draw_rect(Rect2(-16, -2 + breath * 0.1, 32, 18), Color(0.5, 0.35, 0.2))
	
	# --- 3. Items on Counter (HDR Shaded) ---
	# Potion bottle
	draw_circle(Vector2(-8, 5 + breath * 0.1), 4.5, Color(0.9, 0.9, 0.95, 0.3)) # glass bottle
	draw_circle(Vector2(-8, 6 + breath * 0.1), 3.2, Color(2.5, 0.2, 0.2)) # glowing red potion
	draw_rect(Rect2(-9, 1 + breath * 0.1, 2, 2.5), Color(0.45, 0.3, 0.15)) # cork
	
	# Glowing blue gem (HDR Cyan)
	draw_circle(Vector2(0, 3 + breath * 0.1), 3.5, Color(0.3, 1.2, 2.5))
	
	# Gold treasure (HDR Gold)
	draw_circle(Vector2(8, 5 + breath * 0.1), 4.0, Color(2.5, 1.8, 0.3))
	
	# Merchant body
	var body_pts := PackedVector2Array([
		Vector2(-10, 14),
		Vector2(-12, 2 + breath * 0.3),
		Vector2(-8, -8 + breath),
		Vector2(0, -10 + breath),
		Vector2(8, -8 + breath),
		Vector2(12, 2 + breath * 0.3),
		Vector2(10, 14),
	])
	draw_colored_polygon(body_pts, Color(0.2, 0.55, 0.25))
	
	# Apron
	var apron_pts := PackedVector2Array([
		Vector2(-7, 2 + breath * 0.2),
		Vector2(-6, 14),
		Vector2(6, 14),
		Vector2(7, 2 + breath * 0.2),
	])
	draw_colored_polygon(apron_pts, Color(0.8, 0.75, 0.65))
	
	# Head
	draw_circle(Vector2(0, -14 + breath), 6, Color(0.75, 0.6, 0.45))
	
	# Jolly eyes
	draw_circle(Vector2(-2, -14 + breath), 1.3, Color(0.15, 0.1, 0.08))
	draw_circle(Vector2(2, -14 + breath), 1.3, Color(0.15, 0.1, 0.08))
	
	# Big smile
	draw_arc(Vector2(0, -12 + breath), 3, 0.2, PI - 0.2, 8, Color(0.3, 0.15, 0.1), 1.2)
	
	# Merchant hat
	draw_rect(Rect2(-8, -22 + breath, 16, 4), Color(0.5, 0.35, 0.15))
	draw_rect(Rect2(-5, -28 + breath, 10, 7), Color(0.55, 0.4, 0.2))
	
	# Gold coin emblem on hat
	draw_circle(Vector2(0, -25 + breath), 2.5, Color(0.9, 0.75, 0.15))

func _draw_ellipse(center: Vector2, rx: float, ry: float, color: Color) -> void:
	var pts := PackedVector2Array()
	for i in 20:
		var angle := float(i) / 20.0 * TAU
		pts.append(center + Vector2(cos(angle) * rx, sin(angle) * ry))
	draw_colored_polygon(pts, color)
