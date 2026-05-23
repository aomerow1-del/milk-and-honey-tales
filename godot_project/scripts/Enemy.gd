extends CharacterBody2D

const SPEED = 110.0
var health: int = 100
var max_health: int = 100
var player: Node2D = null
var damage_cooldown: float = 0.0
var idle_time := 0.0
var hit_flash := 0.0
var enemy_type := 0  # 0=normal, 1=fast, 2=heavy

func _ready() -> void:
	player = get_tree().get_first_node_in_group("player")
	# Randomize enemy variant if not explicitly preset (e.g. Boss type 3)
	if enemy_type != 3:
		enemy_type = randi() % 3
		
	match enemy_type:
		1:  # Fast
			health = 60
			max_health = 60
		2:  # Heavy
			health = 180
			max_health = 180
		3:  # Bamba Golem Boss
			health = 500
			max_health = 500
			GameManager.active_boss = self


func _physics_process(delta: float) -> void:
	idle_time += delta
	if damage_cooldown > 0:
		damage_cooldown -= delta
	if hit_flash > 0:
		hit_flash -= delta

	if player:
		var dir = global_position.direction_to(player.global_position)
		var spd := SPEED
		match enemy_type:
			1: spd = 160.0  # Fast
			2: spd = 70.0   # Heavy
			3: spd = 50.0   # Bamba Golem Boss
		velocity = dir * spd
		move_and_slide()

		# Check collision with player
		for i in get_slide_collision_count():
			var collision = get_slide_collision(i)
			if collision.get_collider().is_in_group("player") and damage_cooldown <= 0:
				var dmg := 10
				if enemy_type == 2: dmg = 18
				elif enemy_type == 3: dmg = 30 # Boss hits hard!
				collision.get_collider().take_damage(dmg)
				damage_cooldown = 1.0

	
	queue_redraw()

func _draw() -> void:
	var breath := sin(idle_time * 3.0) * 1.5
	var flash := hit_flash > 0
	
	# Shadow
	_draw_ellipse(Vector2(0, 14), 12, 5, Color(0, 0, 0, 0.25))
	
	# Colors based on type
	var body_col: Color
	var eye_col: Color
	var accent_col: Color
	
	match enemy_type:
		0:  # Normal - dark red golem
			body_col = Color(0.6, 0.15, 0.15) if not flash else Color.WHITE
			eye_col = Color(2.5, 0.5, 0.1) # HDR Glowing Orange
			accent_col = Color(0.4, 0.1, 0.1)
		1:  # Fast - dark purple wraith
			body_col = Color(0.35, 0.1, 0.5) if not flash else Color.WHITE
			eye_col = Color(1.8, 0.4, 2.5) # HDR Glowing Violet
			accent_col = Color(0.25, 0.08, 0.35)
		2:  # Heavy - obsidian brute
			body_col = Color(0.25, 0.25, 0.3) if not flash else Color.WHITE
			eye_col = Color(2.5, 1.2, 0.2) # HDR Glowing Gold
			accent_col = Color(0.15, 0.15, 0.2)
		3:  # Bamba Golem Boss - golden yellow corn-puff
			body_col = Color(0.95, 0.7, 0.25) if not flash else Color.WHITE
			eye_col = Color(3.0, 0.2, 0.2) # HDR Glowing Crimson
			accent_col = Color(0.7, 0.45, 0.15)
	
	var sz := 1.0
	if enemy_type == 2: sz = 1.4
	elif enemy_type == 1: sz = 0.8
	elif enemy_type == 3: sz = 2.5
	
	# Special Drawing Routines for Premium look
	if enemy_type == 3:
		# --- Bamba Golem Boss: 3D Shaded Concentric Puffs ---
		# Draw outer shadow circles first
		var spots := [
			Vector2(-20, -10 + breath), Vector2(20, -10 + breath),
			Vector2(-10, -25 + breath), Vector2(10, -25 + breath),
			Vector2(0, 0), Vector2(-15, 10), Vector2(15, 10),
			Vector2(0, 20 + breath * 0.5)
		]
		for spot in spots:
			var s_pos = spot * 2.2
			_draw_ellipse(s_pos, 22.0, 20.0, Color(0.85, 0.55, 0.15) if not flash else Color.WHITE)
		for spot in spots:
			var s_pos = spot * 2.2
			_draw_ellipse(s_pos, 18.0, 16.0, Color(0.95, 0.7, 0.25) if not flash else Color.WHITE)
			_draw_ellipse(s_pos - Vector2(3, 3), 12.0, 10.0, Color(1.0, 0.85, 0.45) if not flash else Color.WHITE) # highlight
	
	elif enemy_type == 1:
		# --- Fast Wraith: Wispy Aura and Hood ---
		if not flash:
			draw_circle(Vector2(0, -5 + breath), 14.0, Color(0.4, 0.1, 0.6, 0.18)) # Purple shroud aura
		
		var body_pts := PackedVector2Array([
			Vector2(-8, 8),
			Vector2(-10, -8 + breath),
			Vector2(0, -15 + breath),
			Vector2(10, -8 + breath),
			Vector2(8, 8),
			Vector2(0, 12 + breath * 0.4),
		])
		draw_colored_polygon(body_pts, body_col)
		
		# Inner face darkness
		draw_circle(Vector2(0, -6 + breath), 6.5, Color(0.12, 0.05, 0.18))
	
	else:
		# --- Normal & Heavy Golems: Rocky polygonal bodies ---
		var body_pts := PackedVector2Array([
			Vector2(-10 * sz, 10),
			Vector2(-12 * sz, -4 + breath),
			Vector2(-8 * sz, -14 + breath),
			Vector2(0, -16 + breath),
			Vector2(8 * sz, -14 + breath),
			Vector2(12 * sz, -4 + breath),
			Vector2(10 * sz, 10),
		])
		draw_colored_polygon(body_pts, body_col)
		
		# Inner chest plate / accents
		var inner_pts := PackedVector2Array([
			Vector2(-6 * sz, 6),
			Vector2(-7 * sz, -2 + breath),
			Vector2(0, -8 + breath),
			Vector2(7 * sz, -2 + breath),
			Vector2(6 * sz, 6),
		])
		draw_colored_polygon(inner_pts, accent_col)
		
		# Normal Golem Volcanic Lava cracks (Glow!)
		if enemy_type == 0 and not flash:
			draw_line(Vector2(-6, -4 + breath), Vector2(0, 4), Color(2.5, 0.4, 0.1, 0.8), 1.5)
			draw_line(Vector2(6, -4 + breath), Vector2(0, 4), Color(2.5, 0.4, 0.1, 0.8), 1.5)
			draw_line(Vector2(0, 4), Vector2(-3, 10), Color(2.5, 0.4, 0.1, 0.8), 1.5)
			draw_line(Vector2(0, 4), Vector2(3, 10), Color(2.5, 0.4, 0.1, 0.8), 1.5)
			
		# Heavy Golem armor bands (trims)
		if enemy_type == 2:
			draw_line(Vector2(-12 * sz, -10 + breath), Vector2(12 * sz, -10 + breath), Color(0.9, 0.9, 0.95), 1.8) # steel chest band
			draw_circle(Vector2(-8 * sz, -10 + breath), 1.5, Color(0.8, 0.8, 0.8)) # rivet
			draw_circle(Vector2(8 * sz, -10 + breath), 1.5, Color(0.8, 0.8, 0.8)) # rivet

	# Menacing Eyes
	draw_circle(Vector2(-4 * sz, -8 + breath), 2.5 * sz, eye_col)
	draw_circle(Vector2(4 * sz, -8 + breath), 2.5 * sz, eye_col)
	draw_circle(Vector2(-4 * sz, -8 + breath), 1.2 * sz, Color(0.1, 0, 0))
	draw_circle(Vector2(4 * sz, -8 + breath), 1.2 * sz, Color(0.1, 0, 0))
	
	# Horns for Heavy Brute
	if enemy_type == 2:
		draw_line(Vector2(-8 * sz, -14 + breath), Vector2(-15 * sz, -25 + breath), body_col, 3.0)
		draw_line(Vector2(-8 * sz, -14 + breath), Vector2(-15 * sz, -25 + breath), Color(0.9, 0.9, 0.95), 1.0) # Horn trim
		draw_line(Vector2(8 * sz, -14 + breath), Vector2(15 * sz, -25 + breath), body_col, 3.0)
		draw_line(Vector2(8 * sz, -14 + breath), Vector2(15 * sz, -25 + breath), Color(0.9, 0.9, 0.95), 1.0)
	
	# Wispy tendrils for Wraith (Glow!)
	if enemy_type == 1:
		var t := idle_time * 4.0
		for i in 3:
			var angle := t + i * TAU / 3.0
			var end := Vector2(sin(angle) * 14, 10 + cos(angle * 0.7) * 4)
			draw_line(Vector2(0, 6), end, Color(1.5, 0.3, 2.2, 0.6), 1.5)
	
	# Health bar (above enemy) - only draw for normal/heavy, not boss
	if enemy_type != 3:
		var bar_w := 24.0 * sz
		var bar_h := 3.0
		var bar_y := -22.0 * sz + breath
		var hp_ratio := float(health) / float(max_health)
		
		# Background
		draw_rect(Rect2(-bar_w / 2, bar_y, bar_w, bar_h), Color(0.2, 0.0, 0.0, 0.8))
		# Fill
		var fill_color := Color(0.8, 0.2, 0.1) if hp_ratio > 0.3 else Color(1.0, 0.1, 0.05)
		draw_rect(Rect2(-bar_w / 2, bar_y, bar_w * hp_ratio, bar_h), fill_color)
		# Border
		draw_rect(Rect2(-bar_w / 2, bar_y, bar_w, bar_h), Color(0.5, 0.5, 0.5, 0.5), false, 1.0)


func _draw_ellipse(center: Vector2, rx: float, ry: float, color: Color) -> void:
	var pts := PackedVector2Array()
	for i in 20:
		var angle := float(i) / 20.0 * TAU
		pts.append(center + Vector2(cos(angle) * rx, sin(angle) * ry))
	draw_colored_polygon(pts, color)

func take_damage(amount: int) -> void:
	health -= amount
	hit_flash = 0.12
	
	# Spawn damage number
	var label := Label.new()
	label.text = str(amount)
	label.add_theme_color_override("font_color", Color(1, 1, 0.3))
	label.add_theme_font_size_override("font_size", 18 if enemy_type != 3 else 28)
	label.position = Vector2(-8, -35)
	label.z_index = 100
	add_child(label)
	var tween := create_tween()
	tween.tween_property(label, "position:y", label.position.y - (30 if enemy_type != 3 else 50), 0.7)
	tween.parallel().tween_property(label, "modulate:a", 0.0, 0.7)
	tween.tween_callback(label.queue_free)

	if enemy_type == 3:
		GameManager.screen_shake(4.0, 0.1)
		_spawn_bamba_crumbs(4)

	if health <= 0:
		die()

func _spawn_bamba_crumbs(count: int) -> void:
	for i in count:
		var particle := DeathParticle.new()
		particle.position = global_position
		particle.velocity_dir = Vector2(randf_range(-1, 1), randf_range(-1, 1)).normalized() * randf_range(30, 90)
		particle.particle_color = Color(0.95, 0.7, 0.25)
		particle.particle_size = randf_range(2.0, 5.0)
		get_parent().add_child(particle)

func die() -> void:
	# Drop gold
	var gold_amount := 15
	match enemy_type:
		1: gold_amount = 8
		2: gold_amount = 30
		3: gold_amount = 150 # Boss gold!
	InventoryManager.add_item("gold", gold_amount)
	
	# Update HUD
	if get_tree().root.has_node("Main/HUD"):
		get_tree().root.get_node("Main/HUD").update_ui()
	
	# Quest completion & cleanup
	if enemy_type == 3:
		QuestManager.complete_quest("quest_defeat_golem")
		GameManager.active_boss = null
		_spawn_death_particles()
		GameManager.screen_shake(15.0, 0.5)
	else:
		_spawn_death_particles()
	
	queue_free()


func _spawn_death_particles() -> void:
	for i in 8:
		var particle := DeathParticle.new()
		particle.position = global_position
		particle.velocity_dir = Vector2(randf_range(-1, 1), randf_range(-1, 1)).normalized() * randf_range(40, 100)
		var body_col: Color
		match enemy_type:
			0: body_col = Color(0.6, 0.15, 0.15)
			1: body_col = Color(0.35, 0.1, 0.5)
			2: body_col = Color(0.25, 0.25, 0.3)
			_: body_col = Color(0.6, 0.15, 0.15)
		particle.particle_color = body_col
		get_parent().add_child(particle)

class DeathParticle extends Node2D:
	var velocity_dir := Vector2.ZERO
	var lifetime := 0.6
	var particle_color := Color.RED
	var particle_size := 4.0
	
	func _ready() -> void:
		particle_size = randf_range(2.0, 6.0)
		z_index = 50
	
	func _process(delta: float) -> void:
		lifetime -= delta
		position += velocity_dir * delta
		velocity_dir *= 0.95
		if lifetime <= 0:
			queue_free()
		queue_redraw()
	
	func _draw() -> void:
		var alpha := clampf(lifetime / 0.6, 0.0, 1.0)
		draw_circle(Vector2.ZERO, particle_size * alpha, Color(particle_color.r, particle_color.g, particle_color.b, alpha))
