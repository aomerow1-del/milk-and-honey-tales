extends Node2D

var enemy_scene = preload("res://scenes/Enemy.tscn")
var npc_scene = preload("res://scenes/NPC.tscn")
var hud_scene = preload("res://scenes/HUD.tscn")

@export var region_name: String = "default"

func _ready() -> void:
	print("Scene loaded: " + name)
	
	# Load saved game once at startup
	SaveSystem.load_game()

	# Add WorldEnvironment for Vulkan Glow/Bloom
	if GameManager.glow_enabled:
		var env_node := WorldEnvironment.new()
		var env := Environment.new()
		env.background_mode = Environment.BG_CANVAS
		env.glow_enabled = true
		env.glow_intensity = 0.7
		env.glow_strength = 1.0
		env.glow_bloom = 0.2
		env.glow_blend_mode = Environment.GLOW_BLEND_MODE_ADDITIVE
		env_node.environment = env
		add_child(env_node)

	# Add HUD
	var hud = hud_scene.instantiate()
	hud.name = "HUD"
	add_child(hud)

	hud.update_ui()


	# Add ground tile layer
	var ground = Node2D.new()
	ground.name = "GroundTiles"
	ground.set_script(load("res://scripts/GroundTiles.gd"))
	add_child(ground)
	ground.set_region(region_name)

	# Add day/night cycle
	var day_night = CanvasModulate.new()
	day_night.name = "DayNightCycle"
	day_night.set_script(load("res://scripts/DayNightCycle.gd"))
	add_child(day_night)

	# Spawn procedural props
	var props = Node2D.new()
	props.name = "ProceduralProps"
	props.set_script(load("res://scripts/ProceduralProps.gd"))
	$YSort.add_child(props)
	props.spawn_props(region_name)

	# Add sandstorm for desert regions
	if region_name == "negev_desert":
		var storm = Node2D.new()
		storm.name = "Sandstorm"
		storm.set_script(load("res://scripts/SandstormParticles.gd"))
		add_child(storm)

		# Spawn Bamba Golem boss if quest is not completed
		if not QuestManager.completed_quests.has("quest_defeat_golem"):
			var boss = enemy_scene.instantiate()
			boss.enemy_type = 3
			boss.position = Vector2(0, -400)
			$YSort.add_child(boss)


	# Spawn enemies (Hostile zones only)
	if region_name == "negev_desert":
		for i in range(9): # Spawn more monsters in the desert since towns are safe
			var enemy = enemy_scene.instantiate()
			var angle = randf() * TAU
			var dist = 300.0 + randf() * 500.0
			enemy.position = Vector2(cos(angle), sin(angle)) * dist
			$YSort.add_child(enemy)

	# Spawn NPCs (only in main/central scenes, which are safe zones)
	if region_name != "negev_desert":
		# Arava
		var arava = npc_scene.instantiate()
		arava.position = Vector2(-300, -150)
		arava.npc_name = "Arava"
		arava.greeting_key = "greeting"
		$YSort.add_child(arava)

		# Macabi
		var macabi = npc_scene.instantiate()
		macabi.position = Vector2(300, -150)
		macabi.npc_name = "Macabi"
		macabi.greeting_key = "boon_offer"
		$YSort.add_child(macabi)

		# Elder Dan
		var elder = npc_scene.instantiate()
		elder.position = Vector2(-150, -400)
		elder.npc_name = "Elder Dan"
		elder.greeting_key = "dan_greeting"
		$YSort.add_child(elder)

		# Gali the Explorer
		var gali = npc_scene.instantiate()
		gali.position = Vector2(150, -400)
		gali.npc_name = "Gali"
		gali.greeting_key = "gali_greeting"
		$YSort.add_child(gali)

		# Shop NPC
		var shop = load("res://scenes/ShopNPC.tscn").instantiate()
		shop.position = Vector2(0, -250)
		$YSort.add_child(shop)
