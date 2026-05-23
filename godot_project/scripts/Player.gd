extends CharacterBody2D

const SPEED = 300.0
const DASH_MULTIPLIER = 2.5
const DASH_DURATION = 0.2
const DASH_COOLDOWN = 1.0
const MAP_SIZE = 2000.0

var is_dashing: bool = false
var dash_timer: float = 0.0
var dash_cd_timer: float = 0.0
var is_attacking: bool = false
var attack_timer: float = 0.0
const ATTACK_DURATION = 0.3

var facing_dir := Vector2.RIGHT
var idle_time := 0.0
var attack_angle := 0.0
var dash_trail: Array = []  # [{pos, alpha, rot}]
var hit_flash_timer := 0.0
var iframe_timer := 0.0
const IFRAME_DURATION := 0.8

@onready var attack_area = $AttackArea/CollisionShape2D

func _ready() -> void:
	attack_area.disabled = true

func _physics_process(delta: float) -> void:
	idle_time += delta
	
	# Handle Cooldowns
	if dash_cd_timer > 0:
		dash_cd_timer -= delta
	
	if hit_flash_timer > 0:
		hit_flash_timer -= delta

	if iframe_timer > 0:
		iframe_timer -= delta

	if is_dashing:
		dash_timer -= delta
		# Spawn trail
		dash_trail.append({"pos": global_position, "alpha": 0.5, "rot": facing_dir.angle()})
		if dash_timer <= 0:
			is_dashing = false
	elif is_attacking:
		attack_timer -= delta
		if attack_timer <= 0:
			is_attacking = false
			attack_area.disabled = true
	else:
		# Normal movement
		var input_dir = Input.get_vector("move_left", "move_right", "move_up", "move_down")
		velocity = input_dir * SPEED
		
		if input_dir != Vector2.ZERO:
			facing_dir = input_dir.normalized()
			idle_time = 0.0

		# Dash
		if Input.is_action_just_pressed("dash") and dash_cd_timer <= 0 and input_dir != Vector2.ZERO:
			is_dashing = true
			dash_timer = DASH_DURATION
			dash_cd_timer = DASH_COOLDOWN
			velocity = input_dir * (SPEED * DASH_MULTIPLIER)
			# Screen shake
			GameManager.screen_shake(6.0, 0.15)

		# Attack
		elif Input.is_action_just_pressed("attack"):
			is_attacking = true
			attack_timer = ATTACK_DURATION
			velocity = Vector2.ZERO
			attack_area.disabled = false

			# Point attack area towards facing direction
			$AttackArea.rotation = facing_dir.angle()
			attack_angle = facing_dir.angle()
			
			GameManager.screen_shake(4.0, 0.1)

	# Fade trail
	for i in range(dash_trail.size() - 1, -1, -1):
		dash_trail[i].alpha -= delta * 3.0
		if dash_trail[i].alpha <= 0:
			dash_trail.remove_at(i)

	move_and_slide()
	check_map_transitions()
	queue_redraw()

func _draw() -> void:
	# Draw dash trail afterimages
	for trail in dash_trail:
		var offset = trail.pos - global_position
		_draw_character_at(offset, trail.alpha * 0.4, false, false)
	
	# Draw main character
	var flash := hit_flash_timer > 0
	var alpha := 1.0
	if iframe_timer > 0:
		# Blink effect
		if int(iframe_timer * 15.0) % 2 == 0:
			alpha = 0.2
	_draw_character_at(Vector2.ZERO, alpha, is_attacking, flash)
	
	# Draw attack arc
	if is_attacking:
		_draw_attack_arc()

func _draw_character_at(offset: Vector2, alpha: float, attacking: bool, flash: bool) -> void:
	var breath := sin(idle_time * 2.5) * 2.0
	
	# Shadow
	draw_ellipse_custom(offset + Vector2(0, 18), 16, 6, Color(0, 0, 0, 0.25 * alpha))
	
	# Body colors
	var body_color := Color(1, 0.3, 0.3, alpha) if flash else Color(0.18, 0.35, 0.75, alpha)
	var armor_color := Color(1, 0.4, 0.4, alpha) if flash else Color(0.65, 0.4, 0.15, alpha) # Bronze base
	var skin_color := Color(0.85, 0.7, 0.55, alpha)
	
	if is_dashing and not flash:
		body_color = Color(0.4, 0.7, 1.0, alpha)
		armor_color = Color(0.3, 0.55, 0.85, alpha)
	
	# --- 1. Layered Cloak/Cape with Depth folds ---
	var cape_sway := sin(idle_time * 3.0) * 3.0
	# Left fold (darker)
	var cape_pts_l := PackedVector2Array([
		offset + Vector2(-8, -2 + breath * 0.3),
		offset + Vector2(-14, 14 + cape_sway),
		offset + Vector2(-4, 16 + cape_sway * 0.5),
		offset + Vector2(0, 5),
	])
	draw_colored_polygon(cape_pts_l, Color(0.45, 0.1, 0.1, alpha) if not flash else Color(1, 0.3, 0.3, alpha))
	
	# Center fold (main color)
	var cape_pts_c := PackedVector2Array([
		offset + Vector2(-5, -2 + breath * 0.3),
		offset + Vector2(-4, 16 + cape_sway * 0.5),
		offset + Vector2(4, 16 + cape_sway * 0.5),
		offset + Vector2(5, -2 + breath * 0.3),
	])
	draw_colored_polygon(cape_pts_c, Color(0.6, 0.15, 0.15, alpha) if not flash else Color(1, 0.4, 0.4, alpha))
	
	# Right fold (highlight)
	var cape_pts_r := PackedVector2Array([
		offset + Vector2(0, 5),
		offset + Vector2(4, 16 + cape_sway * 0.5),
		offset + Vector2(14, 14 + cape_sway),
		offset + Vector2(8, -2 + breath * 0.3),
	])
	draw_colored_polygon(cape_pts_r, Color(0.75, 0.2, 0.2, alpha) if not flash else Color(1, 0.5, 0.5, alpha))

	# --- 2. Sheathed Sword (On back, sheathed behind shield) ---
	if not attacking:
		var sword_hilt := offset + Vector2(6, -8 + breath * 0.3)
		var sword_tip := offset + Vector2(18, 6 + breath * 0.2)
		draw_line(sword_hilt, sword_hilt + Vector2(-2.5, 2.5), Color(0.8, 0.6, 0.2, alpha), 3.0) # hilt
		draw_line(sword_hilt + Vector2(2, -2), sword_hilt - Vector2(2, -2), Color(0.8, 0.6, 0.2, alpha), 1.5) # guard
		draw_line(sword_hilt, sword_tip, Color(0.75, 0.75, 0.8, alpha), 2.0) # blade

	# --- 3. Star-patterned Round Bronze Shield ---
	var shield_center := offset + Vector2(-6, 2 + breath * 0.4)
	# Bronze base ring
	draw_ellipse_custom(shield_center, 12, 12, Color(0.7, 0.45, 0.15, alpha) if not flash else Color(1, 0.6, 0.3, alpha))
	# Steel middle ring
	draw_ellipse_custom(shield_center, 9, 9, Color(0.4, 0.4, 0.45, alpha) if not flash else Color(0.8, 0.8, 0.8, alpha))
	# Golden star emblem
	var star_color := Color(0.9, 0.75, 0.2, alpha) if not flash else Color.WHITE
	var tri1 := PackedVector2Array([
		shield_center + Vector2(0, -6),
		shield_center + Vector2(5, 3),
		shield_center + Vector2(-5, 3),
	])
	var tri2 := PackedVector2Array([
		shield_center + Vector2(0, 6),
		shield_center + Vector2(5, -3),
		shield_center + Vector2(-5, -3),
	])
	draw_colored_polygon(tri1, star_color)
	draw_colored_polygon(tri2, star_color)

	# --- 4. Legs ---
	draw_rect(Rect2(offset.x - 6, offset.y + 8, 4, 10 + breath * 0.2), Color(0.3, 0.18, 0.1, alpha) if not flash else Color(1, 0.5, 0.5, alpha))
	draw_rect(Rect2(offset.x + 2, offset.y + 8, 4, 10 + breath * 0.2), Color(0.3, 0.18, 0.1, alpha) if not flash else Color(1, 0.5, 0.5, alpha))
	
	# --- 5. Torso ---
	var torso_pts := PackedVector2Array([
		offset + Vector2(-10, 6 + breath * 0.2),
		offset + Vector2(-9, -8 + breath * 0.5),
		offset + Vector2(0, -12 + breath),
		offset + Vector2(9, -8 + breath * 0.5),
		offset + Vector2(10, 6 + breath * 0.2),
	])
	draw_colored_polygon(torso_pts, body_color)
	
	# --- 6. Bronze Chestplate with Shiny Gold Trim & Reflections ---
	var plate_color := Color(0.65, 0.4, 0.15, alpha) if not flash else Color(1, 0.7, 0.4, alpha)
	var trim_color := Color(0.9, 0.75, 0.2, alpha) if not flash else Color(1, 0.9, 0.5, alpha)
	var plate_pts := PackedVector2Array([
		offset + Vector2(-7, 4 + breath * 0.2),
		offset + Vector2(-6, -4 + breath * 0.4),
		offset + Vector2(0, -7 + breath * 0.5),
		offset + Vector2(6, -4 + breath * 0.4),
		offset + Vector2(7, 4 + breath * 0.2),
	])
	draw_colored_polygon(plate_pts, plate_color)
	
	# Shiny gold border lines
	draw_line(offset + Vector2(-7, 4 + breath * 0.2), offset + Vector2(-6, -4 + breath * 0.4), trim_color, 1.2)
	draw_line(offset + Vector2(7, 4 + breath * 0.2), offset + Vector2(6, -4 + breath * 0.4), trim_color, 1.2)
	draw_line(offset + Vector2(-6, -4 + breath * 0.4), offset + Vector2(0, -7 + breath * 0.5), trim_color, 1.2)
	draw_line(offset + Vector2(6, -4 + breath * 0.4), offset + Vector2(0, -7 + breath * 0.5), trim_color, 1.2)
	
	# Reflective shine on chestplate
	var shine_color := Color(1.0, 1.0, 1.0, 0.2 * alpha)
	var shine_pts := PackedVector2Array([
		offset + Vector2(-3, -2 + breath * 0.4),
		offset + Vector2(0, -5 + breath * 0.5),
		offset + Vector2(4, -3 + breath * 0.4),
		offset + Vector2(1, 1 + breath * 0.3),
	])
	draw_colored_polygon(shine_pts, shine_color)
	
	# Shoulder pauldrons
	draw_circle(offset + Vector2(-10, -6 + breath * 0.4), 6, trim_color)
	draw_circle(offset + Vector2(10, -6 + breath * 0.4), 6, trim_color)
	draw_circle(offset + Vector2(-10, -6 + breath * 0.4), 4.5, plate_color)
	draw_circle(offset + Vector2(10, -6 + breath * 0.4), 4.5, plate_color)
	
	# --- 7. Head (Skin) ---
	draw_circle(offset + Vector2(0, -16 + breath), 7, skin_color)
	
	# --- 8. Bronze Warrior Helmet & Cheek Guards ---
	var helmet_col := Color(0.7, 0.5, 0.2, alpha) if not flash else Color(1, 0.8, 0.4, alpha)
	var helmet_pts := PackedVector2Array([
		offset + Vector2(-8, -15 + breath),
		offset + Vector2(-6, -22 + breath),
		offset + Vector2(0, -24 + breath),
		offset + Vector2(6, -22 + breath),
		offset + Vector2(8, -15 + breath),
		offset + Vector2(0, -18 + breath),
	])
	draw_colored_polygon(helmet_pts, helmet_col)
	
	draw_line(offset + Vector2(0, -18 + breath), offset + Vector2(0, -13 + breath), helmet_col, 1.8) # nose guard
	draw_line(offset + Vector2(-7, -15 + breath), offset + Vector2(-5, -11 + breath), helmet_col, 1.8) # left cheek guard
	draw_line(offset + Vector2(7, -15 + breath), offset + Vector2(5, -11 + breath), helmet_col, 1.8) # right cheek guard

	# Eyes (direction-aware)
	var eye_offset := facing_dir * 1.8
	draw_circle(offset + Vector2(-2.5 + eye_offset.x, -16.5 + breath + eye_offset.y * 0.5), 1.5, Color(0.9, 0.9, 0.9, alpha))
	draw_circle(offset + Vector2(2.5 + eye_offset.x, -16.5 + breath + eye_offset.y * 0.5), 1.5, Color(0.9, 0.9, 0.9, alpha))
	draw_circle(offset + Vector2(-2.5 + eye_offset.x * 1.3, -16.5 + breath + eye_offset.y * 0.6), 0.8, Color(0.1, 0.1, 0.2, alpha))
	draw_circle(offset + Vector2(2.5 + eye_offset.x * 1.3, -16.5 + breath + eye_offset.y * 0.6), 0.8, Color(0.1, 0.1, 0.2, alpha))
	
	# --- 9. Dynamic Flowing Plume (Helmet Crest) ---
	var plume_col := Color(0.85, 0.15, 0.15, alpha) if not flash else Color(1, 0.4, 0.4, alpha)
	var plume_sway := sin(idle_time * 3.5) * 4.0
	var plume_pts := PackedVector2Array([
		offset + Vector2(0, -24 + breath),
		offset + Vector2(-4, -28 + breath),
		offset + Vector2(-12 - plume_sway * 0.5, -29 + breath + plume_sway),
		offset + Vector2(-18 - plume_sway, -23 + breath + plume_sway * 1.2),
		offset + Vector2(-10 - plume_sway * 0.5, -21 + breath + plume_sway * 0.8),
		offset + Vector2(-2, -23 + breath),
	])
	draw_colored_polygon(plume_pts, plume_col)

	# --- 10. Active Sword In Hand (When Attacking) ---
	if attacking:
		var attack_progress := attack_timer / ATTACK_DURATION
		var swing_angle := attack_angle - 0.8 + (1.0 - attack_progress) * 1.6
		var hand_pos := offset + facing_dir * 12.0
		var blade_tip := hand_pos + Vector2(cos(swing_angle), sin(swing_angle)) * 28.0
		
		# Draw glowing blade shadow/energy
		draw_line(hand_pos, blade_tip, Color(0.5, 0.8, 1.0, 0.65 * alpha), 5.0)
		# Draw steel blade
		draw_line(hand_pos, blade_tip, Color(0.9, 0.9, 0.95, alpha), 2.5)
		# Draw crossguard
		var guard_dir := Vector2(-sin(swing_angle), cos(swing_angle))
		draw_line(hand_pos - guard_dir * 4.0, hand_pos + guard_dir * 4.0, Color(0.8, 0.6, 0.2, alpha), 2.0)

func _draw_attack_arc() -> void:
	var arc_color := Color(1.0, 0.8, 0.3, 0.6 * (attack_timer / ATTACK_DURATION))
	var arc_start := attack_angle - 0.6
	var arc_end := attack_angle + 0.6
	var radius := 35.0 + (1.0 - attack_timer / ATTACK_DURATION) * 15.0
	draw_arc(Vector2.ZERO, radius, arc_start, arc_end, 16, arc_color, 3.0)
	draw_arc(Vector2.ZERO, radius - 4, arc_start, arc_end, 16, Color(1, 1, 0.5, 0.3 * (attack_timer / ATTACK_DURATION)), 2.0)

func draw_ellipse_custom(center: Vector2, rx: float, ry: float, color: Color) -> void:
	var pts := PackedVector2Array()
	for i in 24:
		var angle := float(i) / 24.0 * TAU
		pts.append(center + Vector2(cos(angle) * rx, sin(angle) * ry))
	draw_colored_polygon(pts, color)

func check_map_transitions() -> void:
	if position.x > MAP_SIZE / 2:
		GameManager.transition_map("res://scenes/NegevDesert.tscn", Vector2(-MAP_SIZE / 2 + 100, position.y))
	elif position.x < -MAP_SIZE / 2:
		GameManager.transition_map("res://scenes/CentralDistrict.tscn", Vector2(MAP_SIZE / 2 - 100, position.y))

func take_damage(amount: int) -> void:
	if iframe_timer > 0 or is_dashing:
		return
	
	iframe_timer = IFRAME_DURATION
	GameManager.current_health -= amount
	hit_flash_timer = 0.15
	GameManager.screen_shake(8.0, 0.2)
	
	# Spawn damage number
	_spawn_damage_number(amount)
	
	if get_tree().root.has_node("Main/HUD"):
		get_tree().root.get_node("Main/HUD").update_ui()
	
	if GameManager.current_health <= 0:
		GameManager.player_died()

func _spawn_damage_number(amount: int) -> void:
	var label := Label.new()
	label.text = "-" + str(amount)
	label.add_theme_color_override("font_color", Color(1, 0.3, 0.3))
	label.add_theme_font_size_override("font_size", 20)
	label.position = Vector2(-10, -40)
	label.z_index = 100
	add_child(label)
	
	var tween := create_tween()
	tween.tween_property(label, "position:y", label.position.y - 40, 0.8)
	tween.parallel().tween_property(label, "modulate:a", 0.0, 0.8)
	tween.tween_callback(label.queue_free)

func _on_attack_area_body_entered(body: Node2D) -> void:
	if body.is_in_group("enemies") and body.has_method("take_damage"):
		body.take_damage(25)
		GameManager.screen_shake(5.0, 0.1)
