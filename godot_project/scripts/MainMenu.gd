extends CanvasLayer

# Particle system state
var particles: Array = []
const MAX_PARTICLES = 40

# StyleBoxes
var style_panel: StyleBoxFlat
var style_card: StyleBoxFlat
var style_btn_normal: StyleBoxFlat
var style_btn_hover: StyleBoxFlat
var style_btn_pressed: StyleBoxFlat
var style_btn_disabled: StyleBoxFlat
var style_btn_active: StyleBoxFlat

# UI elements references
var bg_canvas: Control
var main_container: CenterContainer
var title_label: Label
var subtitle_label: Label
var new_game_btn: Button
var continue_btn: Button
var settings_btn: Button
var exit_btn: Button

# Settings panel references
var settings_overlay: PanelContainer
var settings_title: Label
var col1_title: Label
var col2_title: Label
var col3_title: Label

# Settings controls
var fs_btn: Button
var hdr_btn: Button
var quality_btn: Button
var lang_btn: Button
var back_btn: Button

# Save slot buttons
var slot_buttons: Array[Button] = []

# Keybinding buttons and labels
var rebind_buttons: Dictionary = {} # { action: Button }
var rebind_labels: Dictionary = {} # { action: Label }

# Rebinding state
var is_rebinding: bool = false
var rebinding_action: String = ""

# Map action names to localization keys
const ACTIONS = ["move_up", "move_down", "move_left", "move_right", "dash", "attack", "interact"]

func _ready() -> void:
	# Load controls and graphics configurations
	load_settings()

	# Create StyleBoxes
	style_panel = _create_stylebox(Color(0.08, 0.06, 0.12, 0.92), Color(0.85, 0.7, 0.3, 0.8), 2, 12)
	style_panel.shadow_size = 15
	style_panel.shadow_color = Color(0, 0, 0, 0.5)

	style_card = _create_stylebox(Color(0.05, 0.04, 0.08, 0.6), Color(0.4, 0.4, 0.5, 0.3), 1, 8)

	style_btn_normal = _create_stylebox(Color(0.12, 0.1, 0.18, 0.6), Color(0.5, 0.5, 0.5, 0.5), 1, 6)
	style_btn_hover = _create_stylebox(Color(0.18, 0.15, 0.28, 0.8), Color(0.85, 0.7, 0.3, 0.9), 1, 6)
	style_btn_pressed = _create_stylebox(Color(0.85, 0.7, 0.3, 1.0), Color(1.0, 0.9, 0.6, 1.0), 1, 6)
	style_btn_disabled = _create_stylebox(Color(0.05, 0.05, 0.07, 0.4), Color(0.2, 0.2, 0.2, 0.2), 1, 6)
	style_btn_active = _create_stylebox(Color(0.15, 0.12, 0.24, 0.9), Color(1.0, 0.85, 0.2, 1.0), 2, 6)

	# Initialize particles (scale count based on quality settings)
	var particle_count = MAX_PARTICLES if GameManager.high_quality else 15
	for i in range(particle_count):
		particles.append(_create_particle(true))

	# 1. Background Canvas
	bg_canvas = Control.new()
	bg_canvas.name = "BackgroundCanvas"
	bg_canvas.anchor_right = 1.0
	bg_canvas.anchor_bottom = 1.0
	bg_canvas.draw.connect(_on_bg_draw)
	add_child(bg_canvas)

	# 2. Main Menu Container
	main_container = CenterContainer.new()
	main_container.name = "MainContainer"
	main_container.anchor_right = 1.0
	main_container.anchor_bottom = 1.0
	add_child(main_container)

	var main_vbox = VBoxContainer.new()
	main_vbox.add_theme_constant_override("separation", 24)
	main_container.add_child(main_vbox)

	# Title
	title_label = Label.new()
	title_label.add_theme_font_size_override("font_size", 54)
	title_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.3)) # Golden
	title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	main_vbox.add_child(title_label)

	subtitle_label = Label.new()
	subtitle_label.add_theme_font_size_override("font_size", 18)
	subtitle_label.add_theme_color_override("font_color", Color(0.7, 0.8, 1.0))
	subtitle_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	main_vbox.add_child(subtitle_label)

	# Menu Buttons Container
	var menu_btn_box = VBoxContainer.new()
	menu_btn_box.add_theme_constant_override("separation", 12)
	menu_btn_box.alignment = BoxContainer.ALIGNMENT_CENTER
	main_vbox.add_child(menu_btn_box)

	# Buttons
	new_game_btn = Button.new()
	_setup_button(new_game_btn, menu_btn_box)
	new_game_btn.pressed.connect(_on_new_game_pressed)

	continue_btn = Button.new()
	_setup_button(continue_btn, menu_btn_box)
	continue_btn.pressed.connect(_on_continue_pressed)

	settings_btn = Button.new()
	_setup_button(settings_btn, menu_btn_box)
	settings_btn.pressed.connect(_on_settings_pressed)

	exit_btn = Button.new()
	_setup_button(exit_btn, menu_btn_box)
	exit_btn.pressed.connect(_on_exit_pressed)

	# 3. Settings Overlay Panel Container
	settings_overlay = PanelContainer.new()
	settings_overlay.name = "SettingsOverlay"
	settings_overlay.add_theme_stylebox_override("panel", style_panel)
	settings_overlay.custom_minimum_size = Vector2(1000, 580)
	
	# Centering Settings Panel
	settings_overlay.anchor_left = 0.5
	settings_overlay.anchor_top = 0.5
	settings_overlay.anchor_right = 0.5
	settings_overlay.anchor_bottom = 0.5
	settings_overlay.grow_horizontal = 2
	settings_overlay.grow_vertical = 2
	settings_overlay.position = Vector2(-500, -290)
	settings_overlay.visible = false
	add_child(settings_overlay)

	var settings_vbox = VBoxContainer.new()
	settings_vbox.add_theme_constant_override("separation", 16)
	settings_overlay.add_child(settings_vbox)

	# Settings Title
	settings_title = Label.new()
	settings_title.add_theme_font_size_override("font_size", 32)
	settings_title.add_theme_color_override("font_color", Color(1.0, 0.85, 0.3))
	settings_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	settings_vbox.add_child(settings_title)

	# Columns HBox Container (side-by-side tabs)
	var cols_hbox = HBoxContainer.new()
	cols_hbox.name = "ColumnsContainer"
	cols_hbox.add_theme_constant_override("separation", 20)
	cols_hbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
	settings_vbox.add_child(cols_hbox)

	# --- Column 1: Graphics & Language ---
	var col1_panel = PanelContainer.new()
	col1_panel.add_theme_stylebox_override("panel", style_card)
	col1_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cols_hbox.add_child(col1_panel)

	var col1_vbox = VBoxContainer.new()
	col1_vbox.add_theme_constant_override("separation", 12)
	col1_panel.add_child(col1_vbox)

	col1_title = Label.new()
	col1_title.add_theme_font_size_override("font_size", 20)
	col1_title.add_theme_color_override("font_color", Color(0.8, 0.85, 1.0))
	col1_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	col1_vbox.add_child(col1_title)

	# Fullscreen Toggle Button
	fs_btn = Button.new()
	_setup_button(fs_btn, col1_vbox, false)
	fs_btn.pressed.connect(_on_fs_pressed)

	# HDR Toggle Button
	hdr_btn = Button.new()
	_setup_button(hdr_btn, col1_vbox, false)
	hdr_btn.pressed.connect(_on_hdr_pressed)

	# Quality Toggle Button
	quality_btn = Button.new()
	_setup_button(quality_btn, col1_vbox, false)
	quality_btn.pressed.connect(_on_quality_pressed)

	# Language Button
	lang_btn = Button.new()
	_setup_button(lang_btn, col1_vbox, false)
	lang_btn.pressed.connect(_on_lang_pressed)

	# --- Column 2: Save Slots (Pick Save) ---
	var col2_panel = PanelContainer.new()
	col2_panel.add_theme_stylebox_override("panel", style_card)
	col2_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cols_hbox.add_child(col2_panel)

	var col2_vbox = VBoxContainer.new()
	col2_vbox.add_theme_constant_override("separation", 12)
	col2_panel.add_child(col2_vbox)

	col2_title = Label.new()
	col2_title.add_theme_font_size_override("font_size", 20)
	col2_title.add_theme_color_override("font_color", Color(0.8, 0.85, 1.0))
	col2_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	col2_vbox.add_child(col2_title)

	# 3 Save Slots buttons
	for slot in [1, 2, 3]:
		var s_btn = Button.new()
		_setup_button(s_btn, col2_vbox, false)
		s_btn.pressed.connect(func(): _on_slot_pressed(slot))
		slot_buttons.append(s_btn)

	# --- Column 3: Rebind Keys ---
	var col3_panel = PanelContainer.new()
	col3_panel.add_theme_stylebox_override("panel", style_card)
	col3_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cols_hbox.add_child(col3_panel)

	var col3_vbox = VBoxContainer.new()
	col3_vbox.add_theme_constant_override("separation", 8)
	col3_panel.add_child(col3_vbox)

	col3_title = Label.new()
	col3_title.add_theme_font_size_override("font_size", 20)
	col3_title.add_theme_color_override("font_color", Color(0.8, 0.85, 1.0))
	col3_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	col3_vbox.add_child(col3_title)

	# Scroll Container for actions
	var scroll = ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	col3_vbox.add_child(scroll)

	var rebind_vbox = VBoxContainer.new()
	rebind_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rebind_vbox.add_theme_constant_override("separation", 6)
	scroll.add_child(rebind_vbox)

	for action in ACTIONS:
		var action_hbox = HBoxContainer.new()
		action_hbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		rebind_vbox.add_child(action_hbox)

		var act_label = Label.new()
		act_label.add_theme_font_size_override("font_size", 14)
		act_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		action_hbox.add_child(act_label)
		rebind_labels[action] = act_label

		var reb_btn = Button.new()
		_setup_button(reb_btn, action_hbox, false)
		reb_btn.custom_minimum_size = Vector2(110, 32)
		reb_btn.add_theme_font_size_override("font_size", 12)
		# Correct binding using an explicit local variable to prevent binding lambda scope bugs
		var bind_action = action
		reb_btn.pressed.connect(func(): _on_rebind_pressed(bind_action, reb_btn))
		rebind_buttons[action] = reb_btn

	# Bottom Back Button
	back_btn = Button.new()
	_setup_button(back_btn, settings_vbox, false)
	back_btn.custom_minimum_size = Vector2(200, 40)
	back_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	back_btn.pressed.connect(_on_back_pressed)

	# Localization setup
	update_localization()

func _process(delta: float) -> void:
	# Update ember particles
	var size = get_viewport().get_visible_rect().size
	for i in range(particles.size()):
		var p = particles[i]
		p.position += p.velocity * delta
		p.life -= delta
		if p.life <= 0:
			particles[i] = _create_particle(false)
	bg_canvas.queue_redraw()

func _input(event: InputEvent) -> void:
	if is_rebinding:
		if event is InputEventKey and event.pressed and not event.is_echo():
			get_viewport().set_input_as_handled()
			var keycode = event.physical_keycode
			
			# Escape cancels rebinding
			if keycode == KEY_ESCAPE:
				is_rebinding = false
				update_localization()
				return
			
			rebind_action_key(rebinding_action, keycode)
			is_rebinding = false
			save_settings()
			update_localization()

func _on_bg_draw() -> void:
	var size = bg_canvas.get_viewport_rect().size
	
	# Draw gradient background
	var steps = 15
	var color_top = Color(0.06, 0.04, 0.1, 1.0)
	var color_bottom = Color(0.12, 0.08, 0.18, 1.0)
	var step_height = size.y / steps
	for i in range(steps):
		var t = float(i) / steps
		var color = color_top.lerp(color_bottom, t)
		bg_canvas.draw_rect(Rect2(0, i * step_height, size.x, step_height), color)

	# Draw glowing ember particles
	for p in particles:
		var alpha = clampf(p.life, 0.0, 1.0)
		var base_color = p.color
		base_color.a *= alpha
		if GameManager.glow_enabled:
			base_color.r *= 2.5
			base_color.g *= 2.0
		bg_canvas.draw_circle(p.position, p.size, base_color)

func _create_particle(random_life: bool = false) -> Dictionary:
	var viewport_size = get_viewport().get_visible_rect().size
	return {
		"position": Vector2(randf() * viewport_size.x, viewport_size.y + 10 if not random_life else randf() * viewport_size.y),
		"velocity": Vector2(randf_range(-15, 15), randf_range(-40, -15)),
		"color": Color(randf_range(0.85, 1.0), randf_range(0.55, 0.8), randf_range(0.15, 0.3), randf_range(0.2, 0.45)),
		"size": randf_range(3.0, 6.5),
		"life": randf_range(1.5, 5.0) if random_life else randf_range(3.5, 7.5)
	}

func _create_stylebox(bg: Color, border: Color, border_w: int = 1, corner: int = 6) -> StyleBoxFlat:
	var sb = StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.set_border_width_all(border_w)
	sb.set_corner_radius_all(corner)
	return sb

func _setup_button(btn: Button, parent: Node, set_min_size: bool = true) -> void:
	if set_min_size:
		btn.custom_minimum_size = Vector2(250, 45)
	btn.add_theme_stylebox_override("normal", style_btn_normal)
	btn.add_theme_stylebox_override("hover", style_btn_hover)
	btn.add_theme_stylebox_override("pressed", style_btn_pressed)
	btn.add_theme_stylebox_override("disabled", style_btn_disabled)
	btn.add_theme_stylebox_override("focus", style_btn_hover)
	
	btn.add_theme_font_size_override("font_size", 18)
	btn.add_theme_color_override("font_color", Color(0.9, 0.9, 0.95))
	btn.add_theme_color_override("font_hover_color", Color(1.0, 0.85, 0.3))
	btn.add_theme_color_override("font_pressed_color", Color(0.05, 0.05, 0.05))
	
	# Micro-animation: simple scale up on hover
	btn.mouse_entered.connect(func():
		var tween = create_tween()
		tween.tween_property(btn, "scale", Vector2(1.03, 1.03), 0.1)
	)
	btn.mouse_exited.connect(func():
		var tween = create_tween()
		tween.tween_property(btn, "scale", Vector2(1.0, 1.0), 0.1)
	)
	if btn.custom_minimum_size != Vector2.ZERO:
		btn.pivot_offset = btn.custom_minimum_size / 2.0
	
	parent.add_child(btn)

func update_localization() -> void:
	var is_he = LocalizationManager.current_lang == "he"
	var rtl = LocalizationManager.is_rtl
	var align = HORIZONTAL_ALIGNMENT_RIGHT if rtl else HORIZONTAL_ALIGNMENT_LEFT
	
	# Update HBox columns layout direction
	var cols_hbox = settings_overlay.find_child("ColumnsContainer", true, false)
	if cols_hbox:
		cols_hbox.layout_direction = Control.LAYOUT_DIRECTION_RTL if rtl else Control.LAYOUT_DIRECTION_LTR
		
	# Text alignments
	title_label.text = LocalizationManager.get_string("menu_title")
	subtitle_label.text = LocalizationManager.get_string("controls_hint")
	
	# Main Buttons
	new_game_btn.text = LocalizationManager.get_string("new_game")
	continue_btn.text = LocalizationManager.get_string("continue_game")
	settings_btn.text = LocalizationManager.get_string("settings")
	exit_btn.text = LocalizationManager.get_string("exit_game")
	
	# Settings Titles
	settings_title.text = LocalizationManager.get_string("settings")
	col1_title.text = LocalizationManager.get_string("graphics_section")
	col2_title.text = LocalizationManager.get_string("save_section")
	col3_title.text = LocalizationManager.get_string("controls_title")
	
	# Column 1 Actions
	var fs_text = "Fullscreen: ON" if DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN else "Fullscreen: OFF"
	if is_he:
		fs_text = "מסך מלא: פעיל" if DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN else "מסך מלא: כבוי"
	fs_btn.text = fs_text
	
	hdr_btn.text = LocalizationManager.get_string("graphics_hdr") + ": " + ("ON" if GameManager.glow_enabled else "OFF")
	if is_he:
		hdr_btn.text = LocalizationManager.get_string("graphics_hdr") + ": " + ("פעיל" if GameManager.glow_enabled else "כבוי")
		
	var q_text = LocalizationManager.get_string("quality_high") if GameManager.high_quality else LocalizationManager.get_string("quality_low")
	quality_btn.text = q_text
	
	lang_btn.text = LocalizationManager.get_string("lang_toggle")
	
	# Column 2 Save Slots
	for i in range(slot_buttons.size()):
		var slot_idx = i + 1
		var btn = slot_buttons[i]
		btn.text = get_slot_text(slot_idx)
		# Highlight selected slot
		if SaveSystem.active_slot == slot_idx:
			btn.add_theme_stylebox_override("normal", style_btn_active)
			btn.add_theme_stylebox_override("focus", style_btn_active)
		else:
			btn.add_theme_stylebox_override("normal", style_btn_normal)
			btn.add_theme_stylebox_override("focus", style_btn_hover)

	# Check if selected slot has save to enable/disable Continue
	continue_btn.disabled = not SaveSystem.has_save_file()
	if continue_btn.disabled:
		continue_btn.text = LocalizationManager.get_string("continue_game") + " (" + LocalizationManager.get_string("no_save") + ")"
	
	# Column 3 Controls
	for action in ACTIONS:
		var lbl = rebind_labels[action]
		var btn = rebind_buttons[action]
		
		# Set text alignment for labels
		lbl.horizontal_alignment = align
		lbl.text = LocalizationManager.get_string("act_" + action)
		
		if is_rebinding and rebinding_action == action:
			btn.text = LocalizationManager.get_string("press_key")
		else:
			btn.text = get_key_name(action)
			
	back_btn.text = LocalizationManager.get_string("back")

func get_slot_text(slot: int) -> String:
	var active_txt = " *" if SaveSystem.active_slot == slot else ""
	if SaveSystem.has_save_file_in_slot(slot):
		var path = "user://savegame_slot" + str(slot) + ".save"
		var file = FileAccess.open(path, FileAccess.READ)
		if file:
			var json = JSON.new()
			if json.parse(file.get_as_text()) == OK:
				var data = json.get_data()
				var hp = data.get("health", 100)
				var gold = 100
				if data.get("inventory") is Dictionary and data.get("inventory").has("gold"):
					gold = data.get("inventory")["gold"]
				if LocalizationManager.current_lang == "he":
					return "חריץ " + str(slot) + ": חיים " + str(hp) + ", זהב " + str(gold) + active_txt
				else:
					return "Slot " + str(slot) + ": HP " + str(hp) + ", Gold " + str(gold) + active_txt
	if LocalizationManager.current_lang == "he":
		return "חריץ " + str(slot) + ": ריק" + active_txt
	else:
		return "Slot " + str(slot) + ": Empty" + active_txt

func get_key_name(action: String) -> String:
	var events = InputMap.action_get_events(action)
	for ev in events:
		if ev is InputEventKey:
			return OS.get_keycode_string(ev.physical_keycode)
		elif ev is InputEventMouseButton:
			if ev.button_index == MOUSE_BUTTON_LEFT:
				return "L-Click"
			elif ev.button_index == MOUSE_BUTTON_RIGHT:
				return "R-Click"
			else:
				return "Mouse " + str(ev.button_index)
	return "Unbound"

func rebind_action_key(action: String, physical_keycode: int) -> void:
	if not InputMap.has_action(action):
		return
	# Erase existing key events (leave mouse buttons)
	var events = InputMap.action_get_events(action)
	var mouse_events = []
	for ev in events:
		if ev is InputEventMouseButton:
			mouse_events.append(ev)
	InputMap.action_erase_events(action)
	
	# Add new key event
	var new_key = InputEventKey.new()
	new_key.physical_keycode = physical_keycode
	InputMap.action_add_event(action, new_key)
	
	# Restore mouse events if any
	for ev in mouse_events:
		InputMap.action_add_event(action, ev)

func save_settings() -> void:
	var bindings := {}
	for action in ACTIONS:
		var events = InputMap.action_get_events(action)
		var keycodes = []
		for ev in events:
			if ev is InputEventKey:
				keycodes.append(ev.physical_keycode)
		bindings[action] = keycodes
		
	var data = {
		"glow_enabled": GameManager.glow_enabled,
		"high_quality": GameManager.high_quality,
		"language": LocalizationManager.current_lang,
		"fullscreen": DisplayServer.window_get_mode() == DisplayServer.WINDOW_MODE_FULLSCREEN,
		"bindings": bindings
	}
	var file = FileAccess.open("user://settings.cfg", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))

func load_settings() -> void:
	# Keep backwards compatibility: check settings.cfg first, then controls.cfg as fallback
	if not FileAccess.file_exists("user://settings.cfg"):
		if FileAccess.file_exists("user://controls.cfg"):
			var file = FileAccess.open("user://controls.cfg", FileAccess.READ)
			var json = JSON.new()
			if json.parse(file.get_as_text()) == OK:
				var bindings = json.get_data()
				_apply_loaded_bindings(bindings)
		return
		
	var file = FileAccess.open("user://settings.cfg", FileAccess.READ)
	if not file:
		return
	var json = JSON.new()
	if json.parse(file.get_as_text()) == OK:
		var data = json.get_data()
		GameManager.glow_enabled = data.get("glow_enabled", true)
		GameManager.high_quality = data.get("high_quality", true)
		
		# Language configuration synchronization
		var lang = data.get("language", "en")
		if lang != LocalizationManager.current_lang:
			LocalizationManager.toggle_language()
			
		var is_fs = data.get("fullscreen", false)
		if is_fs:
			DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
		else:
			DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
			
		var bindings = data.get("bindings", {})
		_apply_loaded_bindings(bindings)

func _apply_loaded_bindings(bindings: Dictionary) -> void:
	for action in bindings:
		if InputMap.has_action(action):
			var events = InputMap.action_get_events(action)
			var mouse_events = []
			for ev in events:
				if ev is InputEventMouseButton:
					mouse_events.append(ev)
			InputMap.action_erase_events(action)
			for keycode in bindings[action]:
				var new_ev = InputEventKey.new()
				new_ev.physical_keycode = keycode
				InputMap.action_add_event(action, new_ev)
			for ev in mouse_events:
				InputMap.action_add_event(action, ev)

func _on_rebind_pressed(action: String, btn: Button) -> void:
	if is_rebinding:
		return
	is_rebinding = true
	rebinding_action = action
	btn.text = LocalizationManager.get_string("press_key")

func _on_slot_pressed(slot: int) -> void:
	SaveSystem.active_slot = slot
	# Reset has_loaded status in case they switched slot and want to load
	SaveSystem.has_loaded = false
	update_localization()

func _on_fs_pressed() -> void:
	var mode = DisplayServer.window_get_mode()
	if mode == DisplayServer.WINDOW_MODE_FULLSCREEN:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	await get_tree().create_timer(0.05).timeout
	save_settings()
	update_localization()

func _on_hdr_pressed() -> void:
	GameManager.glow_enabled = not GameManager.glow_enabled
	save_settings()
	update_localization()

func _on_quality_pressed() -> void:
	GameManager.high_quality = not GameManager.high_quality
	
	# Instantly adjust main menu particle counts
	var target_count = MAX_PARTICLES if GameManager.high_quality else 15
	if particles.size() > target_count:
		particles.resize(target_count)
	elif particles.size() < target_count:
		for i in range(target_count - particles.size()):
			particles.append(_create_particle(true))
			
	save_settings()
	update_localization()

func _on_lang_pressed() -> void:
	LocalizationManager.toggle_language()
	save_settings()
	update_localization()

func _on_new_game_pressed() -> void:
	# Reset states
	GameManager.current_health = 100
	GameManager.max_health = 100
	GameManager.current_state = "PLAYING"
	GameManager.active_boss = null
	
	QuestManager.active_quests = []
	QuestManager.completed_quests = []
	
	InventoryManager.items = {"gold": 100}
	
	# Mark as loaded so it doesn't load legacy file inside Main.gd
	SaveSystem.has_loaded = true
	
	# Save the brand new empty slot state
	SaveSystem.save_game()
	
	# Transition
	get_tree().change_scene_to_file("res://scenes/Main.tscn")

func _on_continue_pressed() -> void:
	# Force loading from the chosen slot
	SaveSystem.has_loaded = false
	SaveSystem.load_game()
	
	get_tree().change_scene_to_file("res://scenes/Main.tscn")

func _on_settings_pressed() -> void:
	main_container.visible = false
	settings_overlay.visible = true

func _on_back_pressed() -> void:
	settings_overlay.visible = false
	main_container.visible = true

func _on_exit_pressed() -> void:
	get_tree().quit()
