extends Node2D

# Draws a subtle procedural ground tile pattern
# Only renders tiles visible to the camera for performance

const TILE_SIZE := 64
const MAP_HALF := 2000

var base_color := Color(0.12, 0.12, 0.12)
var line_color := Color(1, 1, 1, 0.03)
var accent_color := Color(1, 1, 1, 0.015)
var region_name := "default"

func set_region(rname: String) -> void:
	region_name = rname
	match rname:
		"central_district":
			base_color = Color(0.1, 0.1, 0.15)
			line_color = Color(0.4, 0.35, 0.5, 0.06)
			accent_color = Color(0.3, 0.25, 0.4, 0.04)
		"negev_desert":
			base_color = Color(0.35, 0.28, 0.15)
			line_color = Color(0.5, 0.4, 0.25, 0.08)
			accent_color = Color(0.45, 0.35, 0.2, 0.05)
		_:
			base_color = Color(0.12, 0.12, 0.14)
			line_color = Color(0.3, 0.3, 0.3, 0.05)
			accent_color = Color(0.25, 0.25, 0.25, 0.03)

func _ready() -> void:
	z_index = -10

func _process(_delta: float) -> void:
	queue_redraw()

func _draw() -> void:
	var camera := get_viewport().get_camera_2d()
	if not camera:
		return
	
	var cam_pos := camera.global_position
	var vp_size := get_viewport_rect().size / camera.zoom
	
	# Calculate visible tile range
	var start_x := int((cam_pos.x - vp_size.x) / TILE_SIZE) - 1
	var end_x := int((cam_pos.x + vp_size.x) / TILE_SIZE) + 1
	var start_y := int((cam_pos.y - vp_size.y) / TILE_SIZE) - 1
	var end_y := int((cam_pos.y + vp_size.y) / TILE_SIZE) + 1
	
	# Clamp to map bounds
	start_x = clampi(start_x, -MAP_HALF / TILE_SIZE, MAP_HALF / TILE_SIZE)
	end_x = clampi(end_x, -MAP_HALF / TILE_SIZE, MAP_HALF / TILE_SIZE)
	start_y = clampi(start_y, -MAP_HALF / TILE_SIZE, MAP_HALF / TILE_SIZE)
	end_y = clampi(end_y, -MAP_HALF / TILE_SIZE, MAP_HALF / TILE_SIZE)
	
	# Draw tiles
	for tx in range(start_x, end_x + 1):
		for ty in range(start_y, end_y + 1):
			var rect := Rect2(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE)
			
			if region_name != "negev_desert":
				# Draw Cobblestone Pattern in Towns
				# Subdivide into 4 smaller cobblestone blocks with randomized shapes
				var sub_w := TILE_SIZE / 2.0
				var sub_h := TILE_SIZE / 2.0
				for sx in 2:
					for sy in 2:
						# Generate a deterministic offset using coordinates
						var stone_seed := (tx * 31 + ty * 17 + sx * 13 + sy * 7) % 5
						var ox := float(stone_seed - 2) * 1.5
						var oy := float((stone_seed * 3) % 5 - 2) * 1.5
						var s_rect := Rect2(
							rect.position.x + sx * sub_w + 1 + ox,
							rect.position.y + sy * sub_h + 1 + oy,
							sub_w - 2,
							sub_h - 2
						)
						
						# Vary the stone shades for pseudo-texture depth
						var base_grey := 0.12 + float(stone_seed) * 0.012
						var stone_col := Color(base_grey, base_grey + 0.008, base_grey + 0.016)
						if (tx + ty + sx + sy) % 2 == 0:
							stone_col = Color(base_grey + 0.02, base_grey + 0.025, base_grey + 0.035)
							
						draw_rect(s_rect, stone_col)
						
						# Light highlight on top-left borders
						draw_line(s_rect.position, Vector2(s_rect.position.x + s_rect.size.x, s_rect.position.y), Color(1, 1, 1, 0.05), 1.0)
						draw_line(s_rect.position, Vector2(s_rect.position.x, s_rect.position.y + s_rect.size.y), Color(1, 1, 1, 0.05), 1.0)
						# Shadow on bottom-right borders
						draw_line(Vector2(s_rect.position.x, s_rect.position.y + s_rect.size.y), s_rect.position + s_rect.size, Color(0, 0, 0, 0.12), 1.0)
						draw_line(Vector2(s_rect.position.x + s_rect.size.x, s_rect.position.y), s_rect.position + s_rect.size, Color(0, 0, 0, 0.12), 1.0)
			else:
				# Negev Desert: Shaded Sand Dunes & Ripples
				# Base sand fill
				draw_rect(rect, base_color)
				
				# Occasional shaded dune ridges
				var hash_dune := int(tx * 13 + ty * 7) % 10
				if hash_dune < 4:
					var start_pt := Vector2(rect.position.x, rect.position.y + clampf(10.0 + float(hash_dune) * 8.0, 0.0, TILE_SIZE - 2.0))
					var end_pt := Vector2(rect.position.x + TILE_SIZE, rect.position.y + clampf(30.0 + float(hash_dune) * 12.0, 0.0, TILE_SIZE - 2.0))
					var shadow_pts := PackedVector2Array([
						start_pt,
						end_pt,
						rect.position + Vector2(TILE_SIZE, TILE_SIZE),
						rect.position + Vector2(0, TILE_SIZE)
					])
					var shadow_color := Color(base_color.r - 0.05, base_color.g - 0.04, base_color.b - 0.03, 0.35)
					draw_colored_polygon(shadow_pts, shadow_color)
					# Wind-blown sand ridge line
					draw_line(start_pt, end_pt, Color(0.9, 0.85, 0.65, 0.12), 1.5)
				
				# Desert ripples on other tiles
				var ripple_hash := (tx * 7919 + ty * 6271) % 100
				if ripple_hash < 12:
					var cx := rect.position.x + TILE_SIZE * 0.5
					var cy := rect.position.y + TILE_SIZE * 0.5
					draw_line(Vector2(cx - 10, cy - 4), Vector2(cx + 10, cy - 4), Color(1.0, 0.9, 0.7, 0.06), 1.0)
					draw_line(Vector2(cx - 6, cy), Vector2(cx + 6, cy), Color(1.0, 0.9, 0.7, 0.06), 1.0)
					draw_line(Vector2(cx - 8, cy + 4), Vector2(cx + 8, cy + 4), Color(1.0, 0.9, 0.7, 0.06), 1.0)
