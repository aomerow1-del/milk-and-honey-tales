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

@onready var sprite = $ColorRect
@onready var attack_area = $AttackArea/CollisionShape2D

func _ready() -> void:
    attack_area.disabled = true

func _physics_process(delta: float) -> void:
    # Handle Cooldowns
    if dash_cd_timer > 0:
        dash_cd_timer -= delta

    if is_dashing:
        dash_timer -= delta
        if dash_timer <= 0:
            is_dashing = false
            sprite.color = Color(0, 0.5, 1) # Normal color
    elif is_attacking:
        attack_timer -= delta
        if attack_timer <= 0:
            is_attacking = false
            attack_area.disabled = true
            sprite.color = Color(0, 0.5, 1)
    else:
        # Normal movement
        var input_dir = Input.get_vector("move_left", "move_right", "move_up", "move_down")
        velocity = input_dir * SPEED

        # Dash
        if Input.is_action_just_pressed("dash") and dash_cd_timer <= 0 and input_dir != Vector2.ZERO:
            is_dashing = true
            dash_timer = DASH_DURATION
            dash_cd_timer = DASH_COOLDOWN
            velocity = input_dir * (SPEED * DASH_MULTIPLIER)
            sprite.color = Color(0.5, 0.8, 1) # Dash color

        # Attack
        elif Input.is_action_just_pressed("attack"):
            is_attacking = true
            attack_timer = ATTACK_DURATION
            velocity = Vector2.ZERO # Stop moving while attacking
            attack_area.disabled = false
            sprite.color = Color(1, 0.2, 0.2) # Attack color

            # Point attack area towards mouse
            var mouse_pos = get_global_mouse_position()
            $AttackArea.look_at(mouse_pos)

    move_and_slide()
    check_map_transitions()

func check_map_transitions() -> void:
    if position.x > MAP_SIZE / 2:
        GameManager.transition_map("res://scenes/NegevDesert.tscn", Vector2(-MAP_SIZE / 2 + 100, position.y))
    elif position.x < -MAP_SIZE / 2:
        GameManager.transition_map("res://scenes/CentralDistrict.tscn", Vector2(MAP_SIZE / 2 - 100, position.y))

func take_damage(amount: int) -> void:
    if not is_dashing: # i-frames during dash
        GameManager.current_health -= amount
        print("Player took damage! Health: " + str(GameManager.current_health))
        if get_tree().root.has_node("Main/HUD"):
            get_tree().root.get_node("Main/HUD").update_ui()

        if GameManager.current_health <= 0:
            print("Game Over")
            # Implement death logic

func _on_attack_area_body_entered(body: Node2D) -> void:
    if body.is_in_group("enemies") and body.has_method("take_damage"):
        body.take_damage(25)
