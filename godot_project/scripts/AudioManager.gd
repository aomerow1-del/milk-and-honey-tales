extends Node

var bgm_player: AudioStreamPlayer

func _ready() -> void:
    bgm_player = AudioStreamPlayer.new()
    add_child(bgm_player)
    print("AudioManager initialized.")

func play_bgm(path: String) -> void:
    # Mocks playing audio since we lack assets
    print("Playing background music: " + path)
