extends CharacterBody2D

const SPEED = 150.0
var health: int = 100
var player: Node2D = null
var damage_cooldown: float = 0.0

@onready var sprite = $ColorRect

func _ready() -> void:
    # Find player (assuming only one)
    player = get_tree().get_first_node_in_group("player")

func _physics_process(delta: float) -> void:
    if damage_cooldown > 0:
        damage_cooldown -= delta

    if player:
        var dir = global_position.direction_to(player.global_position)
        velocity = dir * SPEED
        move_and_slide()

        # Check collision with player
        for i in get_slide_collision_count():
            var collision = get_slide_collision(i)
            if collision.get_collider().is_in_group("player") and damage_cooldown <= 0:
                collision.get_collider().take_damage(10)
                damage_cooldown = 1.0 # 1 second cooldown between hits

func take_damage(amount: int) -> void:
    health -= amount
    print("Enemy took " + str(amount) + " damage! Health: " + str(health))
    # Flash red
    var old_color = sprite.color
    sprite.color = Color.RED
    await get_tree().create_timer(0.1).timeout
    if is_instance_valid(sprite):
        sprite.color = old_color

    if health <= 0:
        die()

func die() -> void:
    print("Enemy died.")
    queue_free()
