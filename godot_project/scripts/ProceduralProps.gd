class_name ProceduralProps
extends Node2D

# Procedural prop spawner for world environments
# Each region has unique prop types and distributions

const GRID_STEP := 140
const MAP_HALF := 1800

var rng := RandomNumberGenerator.new()

func spawn_props(region_name: String) -> void:
    rng.seed = region_name.hash()
    
    match region_name:
        "negev_desert":
            _spawn_desert_props()
        "central_district":
            _spawn_town_props()
        _:
            _spawn_wilderness_props()

# ===================== DESERT =====================
func _spawn_desert_props() -> void:
    for gx in range(-MAP_HALF, MAP_HALF, GRID_STEP):
        for gy in range(-MAP_HALF, MAP_HALF, GRID_STEP):
            var r = rng.randf()
            var jx = rng.randf_range(-50, 50)
            var jy = rng.randf_range(-50, 50)
            var pos = Vector2(gx + jx, gy + jy)
            if r < 0.04:
                _add(OasisPool.new(), pos)
            elif r < 0.10:
                _add(Cactus.new(), pos)
            elif r < 0.16:
                _add(DesertBoulder.new(), pos)
            elif r < 0.20:
                _add(ObsidianSpike.new(), pos)
            elif r < 0.23:
                _add(SkullBones.new(), pos)
            elif r < 0.27:
                _add(SandDune.new(), pos)
            elif r < 0.30:
                _add(DesertFlower.new(), pos)
            elif r < 0.32:
                _add(AncientJar.new(), pos)
            elif r < 0.35:
                _add(TumbleweedStatic.new(), pos)

# ===================== TOWN =====================
func _spawn_town_props() -> void:
    # Spawn a ring of lanterns near center
    for i in 8:
        var angle = float(i) / 8.0 * TAU
        _add(Lantern.new(), Vector2(cos(angle), sin(angle)) * 350)
    # Stone path segments along X axis
    for px in range(-600, 600, 60):
        _add(StonePath.new(), Vector2(px, rng.randf_range(-8, 8)))
    # Market stall area
    _add(MarketStall.new(), Vector2(-300, -350))
    _add(MarketStall.new(), Vector2(100, -350))
    # Well
    _add(Well.new(), Vector2(0, 150))
    # Scatter props
    for gx in range(-MAP_HALF, MAP_HALF, GRID_STEP):
        for gy in range(-MAP_HALF, MAP_HALF, GRID_STEP):
            var r = rng.randf()
            var jx = rng.randf_range(-50, 50)
            var jy = rng.randf_range(-50, 50)
            var pos = Vector2(gx + jx, gy + jy)
            if r < 0.05:
                _add(OliveTree.new(), pos)
            elif r < 0.12:
                _add(AncientJar.new(), pos)
            elif r < 0.16:
                _add(FlowerBush.new(), pos)
            elif r < 0.19:
                _add(Barrel.new(), pos)
            elif r < 0.22:
                _add(BannerPole.new(), pos)
            elif r < 0.25:
                _add(StoneRuins.new(), pos)

# ===================== WILDERNESS =====================
func _spawn_wilderness_props() -> void:
    for gx in range(-MAP_HALF, MAP_HALF, GRID_STEP):
        for gy in range(-MAP_HALF, MAP_HALF, GRID_STEP):
            var r = rng.randf()
            var jx = rng.randf_range(-50, 50)
            var jy = rng.randf_range(-50, 50)
            var pos = Vector2(gx + jx, gy + jy)
            if r < 0.08:
                _add(OliveTree.new(), pos)
            elif r < 0.14:
                _add(DesertBoulder.new(), pos)
            elif r < 0.23:
                _add(AncientJar.new(), pos)
            elif r < 0.26:
                _add(ObsidianSpike.new(), pos)
            elif r < 0.29:
                _add(FlowerBush.new(), pos)
            elif r < 0.31:
                _add(Campfire.new(), pos)

func _add(node: Node2D, pos: Vector2) -> void:
    node.position = pos
    if node.has_method("set_scale_factor"):
        node.set_scale_factor(rng.randf_range(0.7, 1.3))
    add_child(node)

# Helper geometry class that inner classes can access without compilation dependency issues
class PropGeometry:
    static func _ellipse(center: Vector2, rx: float, ry: float) -> PackedVector2Array:
        var pts = PackedVector2Array()
        for i in 20:
            var a = float(i) / 20.0 * TAU
            pts.append(center + Vector2(cos(a) * rx, sin(a) * ry))
        return pts

# =========== OLIVE TREE ===========
class OliveTree extends Node2D:
    var sf = 1.0
    var sway_t = 0.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void:
        sway_t = randf() * TAU
        z_index = 0
    func _process(d: float) -> void:
        sway_t += d * 1.2
        queue_redraw()
    func _draw() -> void:
        var sw = sin(sway_t) * 3.0 * sf
        var tc = Color(0.35, 0.25, 0.15)
        draw_line(Vector2(0, 0), Vector2(sw, -40*sf), tc, 4.0*sf)
        draw_line(Vector2(sw, -40*sf), Vector2(sw-8, -55*sf), tc, 2.5*sf)
        draw_line(Vector2(sw, -40*sf), Vector2(sw+10, -52*sf), tc, 2.5*sf)
        draw_circle(Vector2(sw-10, -55*sf), 18*sf, Color(0.2,0.45,0.15,0.9))
        draw_circle(Vector2(sw+8, -50*sf), 15*sf, Color(0.25,0.55,0.2,0.85))
        draw_circle(Vector2(sw, -62*sf), 14*sf, Color(0.18,0.4,0.12,0.8))
        draw_circle(Vector2(sw+2, -54*sf), 12*sf, Color(0.25,0.55,0.2,0.85))
        draw_colored_polygon(PropGeometry._ellipse(Vector2(0,2), 14*sf, 5*sf), Color(0,0,0,0.2))

# =========== ANCIENT JAR ===========
class AncientJar extends Node2D:
    var sf = 1.0
    var gt = 0.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: 
        gt = randf()*TAU
        z_index = 0
    func _process(d: float) -> void: 
        gt += d*2.0
        queue_redraw()
    func _draw() -> void:
        var s = sf
        draw_circle(Vector2(0,-8*s), 10*s, Color(0.7,0.5,0.3))
        draw_rect(Rect2(-8*s,-8*s,16*s,12*s), Color(0.7,0.5,0.3))
        draw_rect(Rect2(-4*s,-16*s,8*s,8*s), Color(0.5,0.35,0.2))
        draw_rect(Rect2(-6*s,-18*s,12*s,3*s), Color(0.7,0.5,0.3))
        draw_rect(Rect2(-9*s,-4*s,18*s,2*s), Color(0.8,0.6,0.2))
        var ga = (sin(gt)+1.0)*0.1
        draw_circle(Vector2(0,-8*s), 14*s, Color(1,0.8,0.3,ga))
        draw_colored_polygon(PropGeometry._ellipse(Vector2(0,4),10*s,4*s), Color(0,0,0,0.15))

# =========== OASIS POOL ===========
class OasisPool extends Node2D:
    var sf = 1.0
    var rt = 0.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: 
        rt = randf()*TAU
        z_index = -1
    func _process(d: float) -> void: 
        rt += d*0.8
        queue_redraw()
    func _draw() -> void:
        var s = sf
        draw_colored_polygon(PropGeometry._ellipse(Vector2.ZERO,28*s,16*s), Color(0.5,0.45,0.3,0.3))
        draw_colored_polygon(PropGeometry._ellipse(Vector2.ZERO,24*s,13*s), Color(0.08,0.25,0.5,0.8))
        draw_colored_polygon(PropGeometry._ellipse(Vector2.ZERO,20*s,10*s), Color(0.12,0.35,0.65,0.85))
        # Light sparkle
        draw_circle(Vector2(4*s, -2*s), 3*s, Color(0.3,0.6,0.9, (sin(rt*2.0)+1.0)*0.15))
        var rr = 8.0+sin(rt)*3.0
        draw_arc(Vector2.ZERO, rr*s, 0, TAU, 24, Color(0.3,0.6,0.9,0.35), 1.0)
        # Palm tree next to oasis
        var palm_x = 26.0*s
        draw_line(Vector2(palm_x, 6), Vector2(palm_x+2, -30*s), Color(0.45,0.3,0.15), 3.0*s)
        # Palm fronds
        for i in 5:
            var fa = float(i)/5.0*PI - PI*0.5 + sin(rt*0.5)*0.1
            var tip = Vector2(palm_x+2+cos(fa)*20*s, -30*s+sin(fa)*12*s)
            draw_line(Vector2(palm_x+2, -30*s), tip, Color(0.15,0.5,0.18,0.8), 2.0*s)

# =========== CACTUS ===========
class Cactus extends Node2D:
    var sf = 1.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: z_index = 0
    func _draw() -> void:
        var s = sf
        var green = Color(0.2, 0.5, 0.2)
        # Main trunk
        draw_rect(Rect2(-5*s, -40*s, 10*s, 40*s), green)
        draw_circle(Vector2(0, -40*s), 5*s, green)
        # Left arm
        draw_rect(Rect2(-12*s, -25*s, 8*s, 6*s), green)
        draw_rect(Rect2(-12*s, -35*s, 6*s, 10*s), green)
        draw_circle(Vector2(-9*s, -35*s), 3*s, green)
        # Right arm
        draw_rect(Rect2(4*s, -18*s, 8*s, 6*s), green)
        draw_rect(Rect2(10*s, -28*s, 6*s, 10*s), green)
        draw_circle(Vector2(13*s, -28*s), 3*s, green)
        # Shadow
        draw_colored_polygon(PropGeometry._ellipse(Vector2(0, 2), 10*s, 3*s), Color(0, 0, 0, 0.15))

# =========== DESERT BOULDER ===========
class DesertBoulder extends Node2D:
    var sf = 1.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: z_index = 0
    func _draw() -> void:
        var s = sf
        var pts = PackedVector2Array([
            Vector2(-14*s,2*s), Vector2(-12*s,-10*s), Vector2(-4*s,-16*s),
            Vector2(8*s,-14*s), Vector2(14*s,-6*s), Vector2(12*s,4*s), Vector2(0,6*s)
        ])
        draw_colored_polygon(pts, Color(0.4, 0.38, 0.35))
        # Highlight
        var highlight_pts := PackedVector2Array([
            Vector2(-8*s, -8*s), Vector2(-2*s, -14*s), Vector2(6*s, -12*s), Vector2(2*s, -6*s)
        ])
        draw_colored_polygon(highlight_pts, Color(0.55, 0.52, 0.48))
        # Shadow
        draw_colored_polygon(PropGeometry._ellipse(Vector2(0, 3*s), 12*s, 3*s), Color(0, 0, 0, 0.15))

# =========== OBSIDIAN SPIKE ===========
class ObsidianSpike extends Node2D:
    var scale_factor := 1.0
    var pulse_time := 0.0
    func set_scale_factor(v: float) -> void: scale_factor = v
    func _ready() -> void: 
        pulse_time = randf() * TAU
        z_index = 0
    func _process(delta: float) -> void: 
        pulse_time += delta * 1.5
        queue_redraw()
    func _draw() -> void:
        var s := scale_factor
        # Main spike
        var spike_pts := PackedVector2Array([
            Vector2(-6*s, 4*s), Vector2(0, -28*s), Vector2(6*s, 4*s)
        ])
        draw_colored_polygon(spike_pts, Color(0.15, 0.1, 0.2))
        # Highlight edge
        draw_line(Vector2(0, -28*s), Vector2(4*s, 0), Color(0.3, 0.2, 0.4, 0.6), 1.5)
        # Secondary smaller spike
        var s2 := PackedVector2Array([
            Vector2(4*s, 4*s), Vector2(7*s, -14*s), Vector2(10*s, 4*s)
        ])
        draw_colored_polygon(s2, Color(0.18, 0.12, 0.25))
        # Purple energy glow
        var glow_a := (sin(pulse_time) + 1.0) * 0.15
        draw_circle(Vector2(0, -14*s), 8*s, Color(0.5, 0.2, 0.8, glow_a))
        # Shadow
        draw_colored_polygon(PropGeometry._ellipse(Vector2(0, 2*s), 8*s, 2.5*s), Color(0, 0, 0, 0.2))

# =========== SKULL BONES ===========
class SkullBones extends Node2D:
    var sf = 1.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: z_index = 0
    func _draw() -> void:
        var s = sf
        var bone = Color(0.85, 0.83, 0.8)
        draw_circle(Vector2(0, 0), 5*s, bone)
        # Eye sockets
        draw_circle(Vector2(-2*s, -2*s), 1.2*s, Color(0.15, 0.1, 0.1))
        draw_circle(Vector2(2*s, -2*s), 1.2*s, Color(0.15, 0.1, 0.1))
        # Bones
        draw_line(Vector2(-8*s, 4*s), Vector2(8*s, -4*s), bone, 1.5*s)
        draw_line(Vector2(8*s, 4*s), Vector2(-8*s, -4*s), bone, 1.5*s)
        # Shadow
        draw_colored_polygon(PropGeometry._ellipse(Vector2(0, 4*s), 8*s, 2.5*s), Color(0, 0, 0, 0.08))

# =========== SAND DUNE ===========
class SandDune extends Node2D:
    var sf = 1.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: z_index = -5
    func _draw() -> void:
        var s = sf
        var dune_col = Color(0.9, 0.75, 0.5)
        var shadow_col = Color(0.8, 0.65, 0.42)
        var pts = PackedVector2Array([
            Vector2(-40*s, 5*s), Vector2(-10*s, -15*s), Vector2(15*s, -8*s),
            Vector2(40*s, 5*s), Vector2(20*s, 10*s), Vector2(-20*s, 10*s)
        ])
        draw_colored_polygon(pts, dune_col)
        draw_line(Vector2(-10*s, -15*s), Vector2(20*s, 10*s), shadow_col, 2.0*s)

# =========== DESERT FLOWER ===========
class DesertFlower extends Node2D:
    var sf = 1.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: z_index = 0
    func _draw() -> void:
        var s = sf
        draw_line(Vector2.ZERO, Vector2(0, -8*s), Color(0.3, 0.5, 0.2), 2.0*s)
        var red = Color(0.9, 0.2, 0.3)
        draw_circle(Vector2(-3*s, -9*s), 4*s, red)
        draw_circle(Vector2(3*s, -9*s), 4*s, red)
        draw_circle(Vector2(0, -9*s), 2.5*s, Color(0.95, 0.8, 0.2))
        draw_colored_polygon(PropGeometry._ellipse(Vector2.ZERO, 6*s, 2*s), Color(0, 0, 0, 0.1))

# =========== TUMBLEWEED ===========
class TumbleweedStatic extends Node2D:
    var sf = 1.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: z_index = 0
    func _draw() -> void:
        var s = sf
        var c = Color(0.55, 0.45, 0.35)
        draw_arc(Vector2.ZERO, 10*s, 0, TAU, 12, c, 1.5*s)
        draw_arc(Vector2(2*s, -2*s), 8*s, 0, TAU, 10, c, 1.2*s)
        draw_arc(Vector2(-3*s, 1*s), 9*s, 0, TAU, 10, c, 1.2*s)
        draw_line(Vector2(-12*s, 2*s), Vector2(10*s, -3*s), c, 1.2*s)
        draw_line(Vector2(-5*s, -10*s), Vector2(6*s, 8*s), c, 1.2*s)
        draw_colored_polygon(PropGeometry._ellipse(Vector2(0, 8*s), 8*s, 2.5*s), Color(0, 0, 0, 0.1))

# =========== FLOWER BUSH ===========
class FlowerBush extends Node2D:
    var sf = 1.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: z_index = 0
    func _draw() -> void:
        var s = sf
        draw_circle(Vector2(-8*s, -6*s), 14*s, Color(0.18, 0.42, 0.2))
        draw_circle(Vector2(8*s, -4*s), 13*s, Color(0.15, 0.38, 0.18))
        draw_circle(Vector2(0, -12*s), 15*s, Color(0.2, 0.45, 0.22))
        var pink = Color(0.9, 0.4, 0.6)
        draw_circle(Vector2(-8*s, -12*s), 3*s, pink)
        draw_circle(Vector2(6*s, -8*s), 3*s, pink)
        draw_circle(Vector2(-2*s, -4*s), 3*s, pink)
        draw_circle(Vector2(2*s, -16*s), 3*s, pink)
        draw_colored_polygon(PropGeometry._ellipse(Vector2(0, 4), 22*s, 6*s), Color(0, 0, 0, 0.2))

# =========== CAMPFIRE ===========
class Campfire extends Node2D:
    var sf = 1.0
    var ft = 0.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: 
        ft = randf()*TAU
        z_index = 0
    func _process(d: float) -> void: 
        ft += d*5.0
        queue_redraw()
    func _draw() -> void:
        var s = sf
        draw_line(Vector2(-14*s, 4*s), Vector2(14*s, -4*s), Color(0.35, 0.2, 0.1), 4.0*s)
        draw_line(Vector2(14*s, 4*s), Vector2(-14*s, -4*s), Color(0.35, 0.2, 0.1), 4.0*s)
        for i in 6:
            var a = float(i)/6.0*TAU
            draw_circle(Vector2(cos(a)*18*s, sin(a)*8*s), 4*s, Color(0.45, 0.45, 0.45))
        var h = 18.0 + sin(ft)*4.0
        var fire_pts = PackedVector2Array([
            Vector2(-8*s, 0), Vector2(0, -h*s), Vector2(8*s, 0), Vector2(0, 4*s)
        ])
        draw_colored_polygon(fire_pts, Color(0.95, 0.4, 0.1))
        var inner_fire = PackedVector2Array([
            Vector2(-4*s, 0), Vector2(0, -h*0.6*s), Vector2(4*s, 0)
        ])
        draw_colored_polygon(inner_fire, Color(0.98, 0.8, 0.2))
        draw_colored_polygon(PropGeometry._ellipse(Vector2.ZERO, 22*s, 8*s), Color(0, 0, 0, 0.25))

# =========== LANTERN ===========
class Lantern extends Node2D:
    var sf = 1.0
    var lt = 0.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: 
        lt = randf()*TAU
        z_index = 0
    func _process(d: float) -> void: 
        lt += d*3.0
        queue_redraw()
    func _draw() -> void:
        var s = sf
        draw_line(Vector2.ZERO, Vector2(0, -35*s), Color(0.25, 0.25, 0.25), 3.0*s)
        draw_line(Vector2(0, -35*s), Vector2(8*s, -35*s), Color(0.25, 0.25, 0.25), 2.0*s)
        draw_line(Vector2(8*s, -35*s), Vector2(8*s, -30*s), Color(0.2, 0.2, 0.2), 1.5*s)
        draw_circle(Vector2(8*s, -25*s), 4*s, Color(0.2, 0.2, 0.2))
        var pulse = (sin(lt) + 1.0) * 0.15
        draw_circle(Vector2(8*s, -25*s), 12*s, Color(1.0, 0.9, 0.4, 0.2 + pulse))
        draw_colored_polygon(PropGeometry._ellipse(Vector2.ZERO, 6*s, 2*s), Color(0, 0, 0, 0.15))

# =========== STONE PATH ===========
class StonePath extends Node2D:
    var sf = 1.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: z_index = -10
    func _draw() -> void:
        var s = sf
        draw_colored_polygon(PropGeometry._ellipse(Vector2.ZERO, 16*s, 8*s), Color(0.35, 0.35, 0.35))
        draw_colored_polygon(PropGeometry._ellipse(Vector2(-3*s, -1*s), 10*s, 5*s), Color(0.42, 0.42, 0.42))

# =========== MARKET STALL ===========
class MarketStall extends Node2D:
    var sf = 1.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: z_index = 0
    func _draw() -> void:
        var s = sf
        var wood = Color(0.45, 0.3, 0.15)
        draw_rect(Rect2(-24*s, -40*s, 4*s, 40*s), wood)
        draw_rect(Rect2(20*s, -40*s, 4*s, 40*s), wood)
        draw_rect(Rect2(-28*s, -22*s, 56*s, 8*s), wood)
        var red = Color(0.8, 0.2, 0.2)
        var white = Color(0.95, 0.95, 0.95)
        draw_rect(Rect2(-30*s, -44*s, 60*s, 6*s), red)
        for i in 6:
            var col = red if i % 2 == 0 else white
            draw_rect(Rect2((-30 + i*10)*s, -38*s, 10*s, 6*s), col)
        draw_colored_polygon(PropGeometry._ellipse(Vector2(0, 2), 26*s, 6*s), Color(0, 0, 0, 0.25))

# =========== WELL ===========
class Well extends Node2D:
    var sf = 1.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: z_index = 0
    func _draw() -> void:
        var s = sf
        var stone = Color(0.4, 0.4, 0.4)
        var wood = Color(0.45, 0.3, 0.15)
        var roof = Color(0.6, 0.2, 0.2)
        draw_colored_polygon(PropGeometry._ellipse(Vector2(0, 0), 22*s, 10*s), Color(0.3, 0.3, 0.3))
        draw_rect(Rect2(-20*s, -12*s, 40*s, 12*s), stone)
        draw_colored_polygon(PropGeometry._ellipse(Vector2(0, -12*s), 20*s, 8*s), Color(0.5, 0.5, 0.5))
        draw_rect(Rect2(-16*s, -36*s, 3*s, 24*s), wood)
        draw_rect(Rect2(13*s, -36*s, 3*s, 24*s), wood)
        var rpts = PackedVector2Array([
            Vector2(-22*s, -36*s), Vector2(0, -48*s), Vector2(22*s, -36*s), Vector2(0, -32*s)
        ])
        draw_colored_polygon(rpts, roof)
        draw_colored_polygon(PropGeometry._ellipse(Vector2(0, 2), 24*s, 8*s), Color(0, 0, 0, 0.3))

# =========== BARREL ===========
class Barrel extends Node2D:
    var sf = 1.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: z_index = 0
    func _draw() -> void:
        var s = sf
        var wood = Color(0.5, 0.35, 0.2)
        var iron = Color(0.3, 0.3, 0.3)
        draw_circle(Vector2(0, -15*s), 9*s, wood)
        draw_rect(Rect2(-9*s, -15*s, 18*s, 15*s), wood)
        draw_rect(Rect2(-9*s, -11*s, 18*s, 2*s), iron)
        draw_rect(Rect2(-9*s, -4*s, 18*s, 2*s), iron)
        draw_colored_polygon(PropGeometry._ellipse(Vector2(0, 2), 10*s, 3*s), Color(0, 0, 0, 0.2))

# =========== BANNER POLE ===========
class BannerPole extends Node2D:
    var sf = 1.0
    var bt = 0.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: 
        bt = randf()*TAU
        z_index = 0
    func _process(d: float) -> void: 
        bt += d*2.0
        queue_redraw()
    func _draw() -> void:
        var s = sf
        var wood = Color(0.45, 0.3, 0.15)
        draw_rect(Rect2(-2*s, -50*s, 4*s, 50*s), wood)
        var wave = sin(bt)*3.0*s
        var flag_pts = PackedVector2Array([
            Vector2(2*s, -46*s), Vector2(20*s+wave, -42*s), Vector2(16*s+wave, -32*s), Vector2(2*s, -36*s)
        ])
        draw_colored_polygon(flag_pts, Color(0.2, 0.4, 0.7))
        draw_colored_polygon(PropGeometry._ellipse(Vector2.ZERO, 6*s, 2*s), Color(0, 0, 0, 0.15))

# =========== STONE RUINS ===========
class StoneRuins extends Node2D:
    var sf = 1.0
    func set_scale_factor(v: float) -> void: sf = v
    func _ready() -> void: z_index = 0
    func _draw() -> void:
        var s = sf
        var stone = Color(0.45, 0.45, 0.45)
        var dark_stone = Color(0.35, 0.35, 0.35)
        draw_rect(Rect2(-16*s, -12*s, 16*s, 12*s), stone)
        draw_rect(Rect2(0, -8*s, 14*s, 8*s), dark_stone)
        draw_rect(Rect2(-6*s, -18*s, 12*s, 6*s), stone)
        draw_colored_polygon(PropGeometry._ellipse(Vector2(0, 2), 18*s, 4*s), Color(0, 0, 0, 0.2))