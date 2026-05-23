extends Node2D

# CPU-based sandstorm particle system
# Renders wind-blown sand particles across the viewport

const MAX_PARTICLES := 120
const WIND_DIR := Vector2(1.5, 0.3)  # Mostly horizontal wind
const WIND_SPEED := 160.0
const PARTICLE_SPREAD := 2400.0

var particles: Array = []
var intensity := 1.0

class SandParticle:
	var pos: Vector2
	var vel: Vector2
	var life: float
	var max_life: float
	var size: float
	var alpha: float
	var color: Color

func _ready() -> void:
	z_index = 100
	for i in MAX_PARTICLES:
		_spawn_particle(true)

func _process(delta: float) -> void:
	var camera := get_viewport().get_camera_2d()
	var cam_pos := camera.global_position if camera else Vector2.ZERO
	
	for i in range(particles.size() - 1, -1, -1):
		var p: SandParticle = particles[i]
		p.life -= delta
		if p.life <= 0:
			particles.remove_at(i)
			_spawn_particle(false, cam_pos)
			continue
		
		# Wind gusts
		var gust := sin(p.pos.x * 0.01 + p.life * 3.0) * 40.0
		p.pos += (p.vel + Vector2(gust, 0)) * delta
		p.alpha = clampf((p.life / p.max_life) * intensity * 0.6, 0.0, 0.6)
	
	queue_redraw()

func _draw() -> void:
	var camera := get_viewport().get_camera_2d()
	var cam_pos := camera.global_position if camera else Vector2.ZERO
	
	for p: SandParticle in particles:
		var screen_pos: Vector2 = p.pos - cam_pos + get_viewport_rect().size / 2.0
		var c := Color(p.color.r, p.color.g, p.color.b, p.alpha)
		# Draw as a short streak (wind trail)
		var trail: Vector2 = p.vel.normalized() * p.size * 3.0
		draw_line(screen_pos - trail, screen_pos + trail, c, p.size * 0.5)

func _spawn_particle(initial: bool, cam_pos: Vector2 = Vector2.ZERO) -> void:
	var p := SandParticle.new()
	if initial:
		p.pos = Vector2(randf_range(-PARTICLE_SPREAD, PARTICLE_SPREAD), randf_range(-PARTICLE_SPREAD, PARTICLE_SPREAD))
	else:
		# Spawn from upwind edge
		p.pos = cam_pos + Vector2(-PARTICLE_SPREAD * 0.6, randf_range(-PARTICLE_SPREAD * 0.5, PARTICLE_SPREAD * 0.5))
	
	p.vel = WIND_DIR * WIND_SPEED * randf_range(0.5, 1.5) + Vector2(randf_range(-20, 20), randf_range(-30, 30))
	p.max_life = randf_range(2.0, 6.0)
	p.life = p.max_life if not initial else randf_range(0.5, p.max_life)
	p.size = randf_range(1.0, 3.0)
	# Sandy color variations
	var r_offset := randf_range(-0.05, 0.05)
	p.color = Color(0.85 + r_offset, 0.7 + r_offset, 0.45 + r_offset)
	p.alpha = 0.3
	particles.append(p)
