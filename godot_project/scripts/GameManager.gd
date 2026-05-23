extends Node

var current_state: String = "PLAYING"
var current_health: int = 100
var max_health: int = 100

func _ready() -> void:
    print("GameManager initialized.")

func transition_map(scene_path: String, new_pos: Vector2) -> void:
    print("Transitioning to: " + scene_path)
    var current_scene = get_tree().current_scene
    var player = get_tree().get_first_node_in_group("player")
    if player:
        # We need to persist the player between scenes, but simple change_scene destroys it.
        # For simplicity in this demo, we'll just reload the scene and let it spawn a new player
        # and we set the global position via a global var.
        pass
    get_tree().change_scene_to_file(scene_path)
    # The new scene will need to handle setting the player's position on _ready.
