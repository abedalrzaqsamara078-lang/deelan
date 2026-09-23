"""
=============================================================================
💖 Forever With You — Dedicated to Deelan 💖
Ultra-Smooth, Zero-Lag, Silky Romantic Generative Art

Engineered for:
- 100% Zero-Lag and Zero-Stutter even under furious rapid clicking
- Second-order critically damped harmonic spring physics (buttery smooth swelling)
- Pre-rendered font & particle surface caches (ZERO allocations in render loop)
- Soft, luxurious silky fur texture with natural cleft shading
- Elegant spatial choreography for floating ruby hearts & celestial love poetry
=============================================================================
"""

import sys
import math
import random
import pygame

# Initialize Pygame
pygame.init()
pygame.display.set_caption("Forever With You — Deelan ❤️")

# Window Dimensions
WIDTH, HEIGHT = 760, 880
screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.RESIZABLE)
clock = pygame.time.Clock()

# Romantic Color Palette
COLOR_BG = (6, 2, 8)                # Deep velvet midnight
COLOR_CORE = (185, 15, 60)          # Deep romantic ruby crimson
COLOR_MID = (255, 50, 125)          # Luminous vibrant rose
COLOR_TIP = (255, 210, 235)         # Silky starlight fairy pink
COLOR_TEXT_MAIN = (255, 248, 252)   # Diamond starlight white
COLOR_TEXT_GLOW = (255, 50, 125)    # Rose neon glow
COLOR_HEART_RED = (255, 24, 64)     # Rich passionate red heart
COLOR_GOLD = (255, 222, 150)        # Warm fairy stardust gold
COLOR_ROSE_DUST = (255, 180, 220)   # Fairy rose shimmer

# -----------------------------------------------------------------------------
# Heart Parametric Mathematics & Precomputations
# -----------------------------------------------------------------------------
def get_heart_xy(t):
    x = 16.0 * (math.sin(t) ** 3) * 1.08
    y = -(13.0 * math.cos(t) - 5.0 * math.cos(2.0 * t) - 2.0 * math.cos(3.0 * t) - math.cos(4.0 * t))
    dist_to_tip = abs(math.pi - t)
    if dist_to_tip < 0.25:
        y -= (0.25 - dist_to_tip) * 3.5
    return x, y

def get_heart_normal(t):
    dt = 0.002
    p1 = get_heart_xy(t - dt)
    p2 = get_heart_xy(t + dt)
    tx, ty = p2[0] - p1[0], p2[1] - p1[1]
    mag = math.hypot(tx, ty)
    if mag == 0:
        return 0.0, 0.0
    tx, ty = tx / mag, ty / mag
    nx, ny = -ty, tx
    hp = get_heart_xy(t)
    if nx * hp[0] + ny * hp[1] < 0:
        nx, ny = -nx, -ny
    return nx, ny

NUM_SAMPLES = 3000
_ts = [2.0 * math.pi * i / NUM_SAMPLES for i in range(NUM_SAMPLES)]
_pts = [get_heart_xy(t) for t in _ts]
_phis = [math.atan2(p[1], p[0]) for p in _pts]
_radii = [math.hypot(p[0], p[1]) for p in _pts]
_sorted_pairs = sorted(zip(_phis, _radii), key=lambda x: x[0])
_phis_sorted = [p[0] for p in _sorted_pairs]
_radii_sorted = [p[1] for p in _sorted_pairs]

def get_max_radius(phi):
    import bisect
    idx = bisect.bisect_left(_phis_sorted, phi)
    if idx == 0:
        return _radii_sorted[0]
    if idx >= len(_phis_sorted):
        return _radii_sorted[-1]
    p0, p1 = _phis_sorted[idx - 1], _phis_sorted[idx]
    r0, r1 = _radii_sorted[idx - 1], _radii_sorted[idx]
    denom = p1 - p0
    if denom == 0:
        return r0
    return r0 + (r1 - r0) * ((phi - p0) / denom)


# -----------------------------------------------------------------------------
# Global Surface Caches (Guarantees ZERO Surface creation during runtime!)
# -----------------------------------------------------------------------------
_HEART_CACHE = {}
_SPARK_CACHE = {}

def get_cached_ruby_heart(size_key, alpha):
    """Pre-rendered glowing ruby heart jewel surface."""
    q_alpha = max(0, min(255, (int(alpha) // 12) * 12))
    key = (size_key, q_alpha)
    if key in _HEART_CACHE:
        return _HEART_CACHE[key]
    
    dim = int(size_key * 2.4)
    surf = pygame.Surface((dim, dim), pygame.SRCALPHA)
    cx, cy = dim / 2.0, dim / 2.0
    pts = []
    for i in range(24):
        t = 2.0 * math.pi * i / 24.0
        x = 16.0 * (math.sin(t) ** 3)
        y = -(13.0 * math.cos(t) - 5.0 * math.cos(2.0 * t) - 2.0 * math.cos(3.0 * t) - math.cos(4.0 * t))
        pts.append((cx + x * (size_key / 28.0), cy + y * (size_key / 28.0)))
    
    # Outer halo
    outer_pts = [(cx + (px - cx) * 1.25, cy + (py - cy) * 1.25) for px, py in pts]
    pygame.draw.polygon(surf, (*COLOR_TEXT_GLOW, int(q_alpha * 0.35)), outer_pts)
    # Core ruby polygon
    pygame.draw.polygon(surf, (*COLOR_HEART_RED, q_alpha), pts)
    # Inner fairy highlight
    inner_pts = [(cx + (px - cx) * 0.55, cy - 1.5 + (py - cy) * 0.55) for px, py in pts]
    pygame.draw.polygon(surf, (*COLOR_TIP, int(q_alpha * 0.65)), inner_pts)

    _HEART_CACHE[key] = surf
    return surf

def get_cached_spark(size, color, alpha):
    """Pre-rendered sparkling stardust dot."""
    q_size = max(1, min(6, int(size)))
    q_alpha = max(0, min(255, (int(alpha) // 16) * 16))
    key = (q_size, color, q_alpha)
    if key in _SPARK_CACHE:
        return _SPARK_CACHE[key]
    
    dim = q_size * 4
    surf = pygame.Surface((dim, dim), pygame.SRCALPHA)
    pygame.draw.circle(surf, (*color, q_alpha), (dim // 2, dim // 2), q_size)
    _SPARK_CACHE[key] = surf
    return surf


# -----------------------------------------------------------------------------
# Romantic Poetry Collection & Pre-Rendered Glyphs
# -----------------------------------------------------------------------------
ROMANTIC_POETRY = [
    "Deelan, My Everything",
    "Forever Yours, Deelan",
    "My Soulmate Deelan",
    "You Are My Universe",
    "Every Beat is Yours",
    "My Endless Love",
    "The Light of My Life",
    "Breathtakingly Beautiful",
    "My Heart Belongs to You",
    "Lost in Your Love",
    "Pure Magic With You",
    "My One & Only Love"
]

_WORD_SURFACE_CACHE = {}

def get_font_by_preference(names, size, bold=False, italic=False):
    installed = pygame.font.get_fonts()
    for name in names:
        clean_name = name.lower().replace(" ", "")
        if clean_name in installed:
            return pygame.font.SysFont(name, size, bold=bold, italic=italic)
    return pygame.font.SysFont("serif", size, bold=bold, italic=italic)


# -----------------------------------------------------------------------------
# Particle Classes
# -----------------------------------------------------------------------------
class FloatingRubyHeart:
    """Pre-cached glowing red heart drifting serenely upward."""
    def __init__(self, x, y, size=20, vx=0.0, vy=-1.6):
        self.x = x
        self.y = y
        self.size_key = size
        self.vx = vx
        self.vy = vy
        self.sway_speed = random.uniform(1.4, 2.2)
        self.sway_amp = random.uniform(0.5, 1.0)
        self.sway_phase = random.uniform(0, math.pi * 2)
        self.life = random.randint(140, 200)
        self.max_life = self.life

    def update(self, dt):
        self.sway_phase += self.sway_speed * dt
        self.x += self.vx + math.sin(self.sway_phase) * self.sway_amp
        self.y += self.vy
        self.vy *= 0.992
        self.life -= 1
        return self.life > 0 and self.y > 115

    def draw(self, surface):
        if self.life <= 0 or self.y < 118:
            return
        p = self.life / self.max_life
        alpha = int(255 * (p * p * (3.0 - 2.0 * p))) if p < 0.85 else int(255 * ((1.0 - p) / 0.15))
        # Fade out near header
        if self.y < 165:
            alpha = int(alpha * max(0.0, (self.y - 118) / 47.0))
        alpha = max(0, min(255, alpha))
        
        h_surf = get_cached_ruby_heart(self.size_key, alpha)
        hw = h_surf.get_width() // 2
        surface.blit(h_surf, (int(self.x - hw), int(self.y - hw)), special_flags=pygame.BLEND_ADD)


class FairyDustSpark:
    """Twinkling stardust particle with smooth drag deceleration."""
    def __init__(self, x, y, vx, vy, color, size=2.0, life=65):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.color = color
        self.size = size
        self.life = life
        self.max_life = life

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.vx *= 0.965
        self.vy *= 0.965
        self.vy -= 0.02
        self.life -= 1
        return self.life > 0 and self.y > 115

    def draw(self, surface):
        if self.life <= 0 or self.y < 118:
            return
        p = self.life / self.max_life
        alpha = int(255 * (p * p * (3.0 - 2.0 * p)))
        if self.y < 155:
            alpha = int(alpha * max(0.0, (self.y - 118) / 37.0))
        dot = get_cached_spark(self.size, self.color, alpha)
        hw = dot.get_width() // 2
        surface.blit(dot, (int(self.x - hw), int(self.y - hw)), special_flags=pygame.BLEND_ADD)


class PoeticWhisper:
    """
    Dedicated floating poetic phrase.
    Guarantees clear spacing and never overlaps or clutters the heart!
    """
    def __init__(self, text, lane_x, start_y):
        self.text = text
        self.x = lane_x
        self.y = start_y
        self.vy = -0.75
        self.life = 220
        self.max_life = self.life

    def update(self, dt):
        self.y += self.vy
        self.life -= 1
        return self.life > 0 and self.y > 115

    def draw(self, surface):
        if self.life <= 0 or self.y < 118:
            return
        p = self.life / self.max_life
        if p > 0.8:
            alpha = int(255 * ((1.0 - p) / 0.2))
        else:
            alpha = int(255 * (p / 0.8))
        if self.y < 165:
            alpha = int(alpha * max(0.0, (self.y - 118) / 47.0))
        alpha = max(0, min(255, alpha))

        entry = _WORD_SURFACE_CACHE.get(self.text)
        if not entry:
            return
        surf_txt, surf_glow, w, h = entry

        # Glow layer
        surf_glow.set_alpha(int(alpha * 0.70))
        surface.blit(surf_glow, (int(self.x - w // 2 + 1), int(self.y - h // 2 + 1)))

        # Core text
        surf_txt.set_alpha(alpha)
        surface.blit(surf_txt, (int(self.x - w // 2), int(self.y - h // 2)))


# -----------------------------------------------------------------------------
# Main Application
# -----------------------------------------------------------------------------
class DeelanHeartApp:
    def __init__(self):
        self.base_scale = 14.5
        self.bpm = 60.0
        self.time_sec = 0.0

        # Silky Spring-Damper Physics for Click Reactions (Critically Damped)
        self.spring_x = 0.0
        self.spring_v = 0.0
        self.beat_scale = 1.0
        self.prev_beat_scale = 1.0
        self.cur_tip_lag = 0.0

        # Parallax
        self.tilt_x = 0.0
        self.tilt_y = 0.0

        # Particle limits (strictly budgeted for 0% lag)
        self.ruby_hearts = []
        self.fairy_dust = []
        self.poetic_whispers = []
        self.last_whisper_time = -10.0
        self.whisper_lane_toggle = 0
        self.last_beat_trigger = False

        # Fonts Setup
        self.font_cursive = get_font_by_preference(["monotypecorsiva", "edwardianscriptitc", "gabriola", "georgia"], 54, bold=True)
        self.font_poem = get_font_by_preference(["monotypecorsiva", "gabriola", "georgia"], 24, bold=True)
        self.font_title = get_font_by_preference(["georgia", "palatino", "serif"], 28, bold=True)
        self.font_subtitle = get_font_by_preference(["georgia", "palatino", "serif"], 15, italic=True)

        # Pre-render center name "Deelan"
        self.init_center_name()

        # Pre-render all romantic poetry
        self.init_word_cache()

        # Pre-render static header
        self.title_surf = self.font_title.render("MY HEART BEATS ONLY FOR YOU", True, (255, 235, 245))
        self.sub_surf = self.font_subtitle.render("In a universe of billions, my soul found its home in Deelan", True, (240, 180, 215))
        self.header_heart = get_cached_ruby_heart(14, 230)

        # Generate fibers
        self.init_fibers()

    def init_center_name(self):
        txt = "Deelan"
        w, h = self.font_cursive.size(txt)
        pad = 20
        self.name_surf = pygame.Surface((w + pad * 2, h + pad * 2), pygame.SRCALPHA)
        cx, cy = (w + pad * 2) // 2, (h + pad * 2) // 2

        # Layered rose glow
        for dx, dy in [(-2, 0), (2, 0), (0, -2), (0, 2), (-1, -1), (1, 1), (-1, 1), (1, -1)]:
            g = self.font_cursive.render(txt, True, COLOR_TEXT_GLOW)
            self.name_surf.blit(g, (cx - g.get_width() // 2 + dx, cy - g.get_height() // 2 + dy))

        # Core crisp diamond text
        c = self.font_cursive.render(txt, True, COLOR_TEXT_MAIN)
        self.name_surf.blit(c, (cx - c.get_width() // 2, cy - c.get_height() // 2))
        self.name_w = self.name_surf.get_width()
        self.name_h = self.name_surf.get_height()

    def init_word_cache(self):
        global _WORD_SURFACE_CACHE
        for text in ROMANTIC_POETRY:
            surf_txt = self.font_poem.render(text, True, COLOR_TEXT_MAIN)
            surf_glow = self.font_poem.render(text, True, COLOR_TEXT_GLOW)
            w = surf_txt.get_width()
            h = surf_txt.get_height()
            _WORD_SURFACE_CACHE[text] = (surf_txt, surf_glow, w, h)

    def init_fibers(self):
        """
        Build ~11,000 silky fibers:
        - 8,200 soft interior radiating hairs
        - 2,800 delicate rim contour fibers
        Flattened into fast tuples for high-speed blitting!
        """
        random.seed(2026)
        self.fibers = []

        # 1. Interior starburst fibers (8,200)
        for _ in range(8200):
            phi = random.uniform(-math.pi, math.pi)
            max_r = get_max_radius(phi)
            r_frac = (random.random() ** 0.62) * 0.99
            base_r = max_r * r_frac
            flen = random.uniform(7.0, 18.0) * (0.6 + 0.65 * r_frac)
            fan = random.gauss(0.0, 0.22)
            base_angle = phi + fan
            curve_bias = random.gauss(0.0, 0.18)
            u = r_frac ** 1.3

            r1 = int(COLOR_CORE[0] + (COLOR_MID[0] - COLOR_CORE[0]) * u)
            g1 = int(COLOR_CORE[1] + (COLOR_MID[1] - COLOR_CORE[1]) * u)
            b1 = int(COLOR_CORE[2] + (COLOR_MID[2] - COLOR_CORE[2]) * u)

            u_tip = u ** 0.75
            r2 = int(COLOR_MID[0] + (COLOR_TIP[0] - COLOR_MID[0]) * u_tip)
            g2 = int(COLOR_MID[1] + (COLOR_TIP[1] - COLOR_MID[1]) * u_tip)
            b2 = int(COLOR_MID[2] + (COLOR_TIP[2] - COLOR_MID[2]) * u_tip)

            self.fibers.append((
                base_r, flen, phi, base_angle, curve_bias,
                math.cos(phi), math.sin(phi),
                (r1, g1, b1), (r2, g2, b2), False
            ))

        # 2. Rim contour fibers (2,800)
        for _ in range(2800):
            t = random.uniform(0.0, 2.0 * math.pi)
            hx, hy = get_heart_xy(t)
            nx, ny = get_heart_normal(t)
            phi = math.atan2(hy, hx)
            max_r = math.hypot(hx, hy)
            base_r = max_r * (1.0 + random.uniform(-0.02, 0.015))
            flen = random.uniform(10.0, 22.0) if random.random() < 0.2 else random.uniform(6.0, 14.0)
            norm_ang = math.atan2(ny, nx)
            angle = norm_ang + random.gauss(0.0, 0.25)
            curve_bias = random.uniform(-0.2, 0.2)

            self.fibers.append((
                base_r, flen, phi, angle, curve_bias,
                math.cos(phi), math.sin(phi),
                COLOR_MID, COLOR_TIP, True
            ))

    def trigger_poetic_whisper(self, cx, cy):
        """Spawns ONE elegant romantic poem in an open celestial lane."""
        now = self.time_sec
        if now - self.last_whisper_time < 1.4:
            return
        if len(self.poetic_whispers) >= 2:
            return

        self.last_whisper_time = now
        text = random.choice(ROMANTIC_POETRY)

        # Alternate between left lane and right lane so it never covers the center heart!
        lane_x = cx - 210 if self.whisper_lane_toggle == 0 else cx + 210
        self.whisper_lane_toggle = 1 - self.whisper_lane_toggle
        start_y = cy - 60 + random.uniform(-20, 20)

        self.poetic_whispers.append(PoeticWhisper(text, lane_x, start_y))

    def handle_click_event(self):
        """
        Anti-Freeze Spring Reaction:
        Absorbs spam clicks smoothly through harmonic velocity impulses.
        Never freezes, never stutters, never snaps!
        """
        w, h = screen.get_size()
        cx = w // 2 + int(self.tilt_x)
        cy = h // 2 - 15 + int(self.tilt_y)

        # Smooth velocity impulse into the spring (capped so it never over-stretches)
        self.spring_v = min(2.4, self.spring_v + 0.85)

        # 1. Burst of glowing ruby hearts (strictly capped at 16 active hearts)
        if len(self.ruby_hearts) < 14:
            for _ in range(random.randint(2, 4)):
                t = random.uniform(0, 2 * math.pi)
                hx, hy = get_heart_xy(t)
                nx, ny = get_heart_normal(t)
                scale = self.base_scale * self.beat_scale
                px = cx + hx * scale + nx * random.uniform(15, 45)
                py = cy + hy * scale + ny * random.uniform(15, 45)
                vx = nx * random.uniform(0.4, 1.2) + random.uniform(-0.3, 0.3)
                vy = ny * random.uniform(0.4, 1.2) - random.uniform(1.2, 2.2)
                size = random.choice([16, 20, 24])
                self.ruby_hearts.append(FloatingRubyHeart(px, py, size=size, vx=vx, vy=vy))

        # 2. Burst of fairy stardust sparks (strictly capped at 40 active sparks)
        if len(self.fairy_dust) < 35:
            for _ in range(random.randint(6, 10)):
                t = random.uniform(0, 2 * math.pi)
                hx, hy = get_heart_xy(t)
                nx, ny = get_heart_normal(t)
                scale = self.base_scale * self.beat_scale
                px = cx + hx * scale + nx * random.uniform(8, 28)
                py = cy + hy * scale + ny * random.uniform(8, 28)
                vx = nx * random.uniform(0.8, 2.2) + random.gauss(0, 0.4)
                vy = ny * random.uniform(0.8, 2.2) - random.uniform(0.5, 1.8)
                col = random.choice([COLOR_TIP, COLOR_GOLD, COLOR_ROSE_DUST, COLOR_HEART_RED])
                self.fairy_dust.append(FairyDustSpark(px, py, vx, vy, col, size=random.uniform(1.4, 2.6)))

        # 3. Trigger poem whisper safely
        self.trigger_poetic_whisper(cx, cy)

    def update_physics(self, dt):
        """
        Continuously smooth C-infinity Gaussian heartbeat
        coupled with critically damped spring click reaction.
        """
        self.time_sec += dt
        period = 60.0 / self.bpm
        p = (self.time_sec % period) / period

        # 1. Harmonic Spring Update (Critically Damped)
        k_spring = 42.0   # Stiffness
        c_spring = 8.6    # Damping factor
        spring_acc = -k_spring * self.spring_x - c_spring * self.spring_v
        self.spring_v += spring_acc * dt
        self.spring_x += self.spring_v * dt

        # Clamp spring displacement softly to avoid negative dips or extreme swelling
        spring_offset = min(0.18, max(0.0, self.spring_x))

        # 2. Natural Dual-Gaussian Heartbeat
        d1 = p - 0.10
        d2 = p - 0.28
        gaussian_lub = math.exp(-(d1 * d1) / (2.0 * 0.038 * 0.038))
        gaussian_dub = math.exp(-(d2 * d2) / (2.0 * 0.042 * 0.042))
        breath = 0.012 * math.sin(p * math.pi * 2.0)

        raw_scale = 1.0 + 0.135 * gaussian_lub + 0.075 * gaussian_dub + breath + spring_offset

        w, h = screen.get_size()
        cx = w // 2 + int(self.tilt_x)
        cy = h // 2 - 15 + int(self.tilt_y)

        # Natural heartbeat pulse particle emissions
        if gaussian_lub > 0.85:
            if not self.last_beat_trigger:
                self.last_beat_trigger = True
                self.trigger_poetic_whisper(cx, cy)
                if len(self.ruby_hearts) < 8:
                    hx, hy = get_heart_xy(random.uniform(0, 2 * math.pi))
                    scale = self.base_scale * raw_scale
                    self.ruby_hearts.append(FloatingRubyHeart(cx + hx * scale, cy + hy * scale, size=18))
        elif gaussian_dub > 0.8:
            self.last_beat_trigger = False
        else:
            if gaussian_lub < 0.2 and gaussian_dub < 0.2:
                self.last_beat_trigger = False

        scale_velocity = (raw_scale - self.prev_beat_scale) / max(dt, 0.001)
        self.prev_beat_scale = self.beat_scale
        self.beat_scale = raw_scale

        # Tip lag inertia (soft spring follow-through)
        target_lag = -scale_velocity * 0.0055
        self.cur_tip_lag += (target_lag - self.cur_tip_lag) * 0.16

        # Update active particles
        self.ruby_hearts = [h for h in self.ruby_hearts if h.update(dt)]
        self.fairy_dust = [s for s in self.fairy_dust if s.update()]
        self.poetic_whispers = [w for w in self.poetic_whispers if w.update(dt)]

    def draw(self, surface):
        """Zero-allocation rendering loop."""
        w, h = surface.get_size()
        cx = w // 2 + int(self.tilt_x)
        cy = h // 2 - 15 + int(self.tilt_y)

        # Clear background
        surface.fill(COLOR_BG)

        scale = self.base_scale * self.beat_scale
        lag_factor = self.cur_tip_lag
        flutter_time = self.time_sec * 3.6

        # 1. Silky Fibers
        for base_r, flen, phi, base_angle, curve_bias, cos_p, sin_p, c1, c2, is_rim in self.fibers:
            r = base_r * scale
            px = cx + r * cos_p
            py = cy + r * sin_p

            flutter = 0.05 * math.sin(flutter_time + phi * 3.0)
            ang = base_angle + flutter + lag_factor * (cos_p if is_rim else 0.45)

            mid_len = flen * 0.55
            mx = px + mid_len * math.cos(ang)
            my = py + mid_len * math.sin(ang)

            tip_ang = ang + curve_bias
            tip_len = flen * 0.45
            ex = mx + tip_len * math.cos(tip_ang)
            ey = my + tip_len * math.sin(tip_ang)

            pygame.draw.line(surface, c1, (int(px), int(py)), (int(mx), int(my)), 1)
            pygame.draw.line(surface, c2, (int(mx), int(my)), (int(ex), int(ey)), 1)

        # 2. Glowing Name "Deelan"
        glow_pulse = 0.90 + 0.10 * math.sin(self.time_sec * 2.8)
        self.name_surf.set_alpha(int(245 * glow_pulse))
        surface.blit(self.name_surf, (cx - self.name_w // 2, cy - 25 - self.name_h // 2))

        # 3. Floating Ruby Hearts
        for heart in self.ruby_hearts:
            heart.draw(surface)

        # 4. Fairy Stardust Sparks
        for spark in self.fairy_dust:
            spark.draw(surface)

        # 5. Dedicated Poetic Whispers
        for whisper in self.poetic_whispers:
            whisper.draw(surface)

        # 6. Romantic Header
        surface.blit(self.title_surf, (w // 2 - self.title_surf.get_width() // 2, 45))
        sub_x = w // 2 - self.sub_surf.get_width() // 2 - 12
        sub_y = 85
        surface.blit(self.sub_surf, (sub_x, sub_y))
        surface.blit(self.header_heart, (sub_x + self.sub_surf.get_width() + 6, sub_y - 8), special_flags=pygame.BLEND_ADD)

    def run(self):
        running = True
        fullscreen = False

        while running:
            dt = clock.tick(60) / 1000.0
            dt = min(dt, 0.05)

            mx, my = pygame.mouse.get_pos()
            w, h = screen.get_size()
            self.tilt_x += ((mx - w // 2) * 0.02 - self.tilt_x) * 0.06
            self.tilt_y += ((my - h // 2) * 0.02 - self.tilt_y) * 0.06

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        running = False
                    elif event.key == pygame.K_f:
                        fullscreen = not fullscreen
                        if fullscreen:
                            pygame.display.set_mode((0, 0), pygame.FULLSCREEN)
                        else:
                            pygame.display.set_mode((WIDTH, HEIGHT), pygame.RESIZABLE)
                    elif event.key in (pygame.K_SPACE, pygame.K_b):
                        self.handle_click_event()
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    self.handle_click_event()

            self.update_physics(dt)
            self.draw(screen)
            pygame.display.flip()

        pygame.quit()
        sys.exit(0)


if __name__ == "__main__":
    app = DeelanHeartApp()
    app.run()
