extends CanvasModulate

# Day/Night cycle controller
# Attach this to a CanvasModulate node in any scene

const CYCLE_DURATION := 240.0  # Full day in seconds

# Color keyframes: dawn → day → dusk → night
const COLORS: Array = [
	{"time": 0.0,  "color": Color(0.85, 0.7, 0.5)},     # Dawn - warm gold
	{"time": 0.15, "color": Color(1.0, 0.95, 0.9)},      # Morning - bright warm
	{"time": 0.35, "color": Color(1.0, 1.0, 1.0)},       # Midday - full bright
	{"time": 0.5,  "color": Color(0.95, 0.85, 0.75)},    # Afternoon - warm
	{"time": 0.65, "color": Color(0.9, 0.55, 0.35)},     # Sunset - orange
	{"time": 0.75, "color": Color(0.4, 0.35, 0.6)},      # Dusk - purple
	{"time": 0.85, "color": Color(0.2, 0.2, 0.35)},      # Night - dark blue
	{"time": 0.95, "color": Color(0.25, 0.22, 0.3)},     # Deep night
	{"time": 1.0,  "color": Color(0.85, 0.7, 0.5)},      # Dawn again (loop)
]

var cycle_time := 0.0

func _ready() -> void:
	# Start at a random time of day for variety
	cycle_time = randf() * CYCLE_DURATION

func _process(delta: float) -> void:
	cycle_time += delta
	if cycle_time >= CYCLE_DURATION:
		cycle_time -= CYCLE_DURATION
	
	var t := cycle_time / CYCLE_DURATION  # 0.0 to 1.0
	color = _sample_color(t)

func _sample_color(t: float) -> Color:
	# Find the two keyframes we're between
	for i in range(COLORS.size() - 1):
		var kf_a = COLORS[i]
		var kf_b = COLORS[i + 1]
		if t >= kf_a.time and t <= kf_b.time:
			var span: float = kf_b.time - kf_a.time
			var local_t: float = (t - kf_a.time) / span if span > 0 else 0.0
			# Smooth interpolation
			local_t = local_t * local_t * (3.0 - 2.0 * local_t)
			return kf_a.color.lerp(kf_b.color, local_t)
	return Color.WHITE
