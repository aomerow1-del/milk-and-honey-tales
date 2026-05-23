extends Node

var current_state: String = "PLAYING"
var current_health: int = 100
var max_health: int = 100
var score: int = 0
var active_boss: Node2D = null
var glow_enabled: bool = true


# Screen shake state
var shake_intensity := 0.0
var shake_duration := 0.0
var shake_timer := 0.0

func _ready() -> void:
	print("GameManager initialized.")

func _process(delta: float) -> void:
	# Handle screen shake
	if shake_timer > 0:
		shake_timer -= delta
		if shake_timer <= 0:
			shake_intensity = 0.0
			_reset_camera_offset()
		else:
			_apply_shake()

func screen_shake(intensity: float, duration: float) -> void:
	shake_intensity = intensity
	shake_duration = duration
	shake_timer = duration

func _apply_shake() -> void:
	var camera := get_viewport().get_camera_2d()
	if camera:
		var decay := shake_timer / shake_duration
		var offset := Vector2(
			randf_range(-shake_intensity, shake_intensity) * decay,
			randf_range(-shake_intensity, shake_intensity) * decay
		)
		camera.offset = offset

func _reset_camera_offset() -> void:
	var camera := get_viewport().get_camera_2d()
	if camera:
		camera.offset = Vector2.ZERO

func transition_map(scene_path: String, _new_pos: Vector2) -> void:
	print("Transitioning to: " + scene_path)
	SaveSystem.save_game()
	get_tree().change_scene_to_file(scene_path)


func player_died() -> void:
	if current_state == "DEAD":
		return
	current_state = "DEAD"
	print("Player died! Respawning...")
	# Respawn after a short delay
	await get_tree().create_timer(1.5).timeout
	current_health = max_health
	current_state = "PLAYING"
	get_tree().change_scene_to_file("res://scenes/Main.tscn")
