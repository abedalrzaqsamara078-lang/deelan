"""
=============================================================================
💖 Forever With You — Dedicated to Deelan ❤️
Zero-Dependency Standard Python Edition (Tkinter)
Runs out-of-the-box on standard Python with zero libraries required!
=============================================================================
"""

import math
import random
import tkinter as tk

WIDTH = 760
HEIGHT = 880
CENTER_X = WIDTH // 2
CENTER_Y = HEIGHT // 2 - 20

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

NUM_SAMPLES = 2000
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

ROMANTIC_POETRY = [
    "Deelan, My Everything",
    "Forever Yours, Deelan",
    "My Soulmate Deelan",
    "You Are My Universe",
    "Every Beat is Yours",
    "My Endless Love",
    "The Light of My Life",
    "Pure Magic With You"
]

class TkinterRomanticHeart:
    def __init__(self, root):
        self.root = root
        self.root.title("Forever With You — Deelan ❤️")
        self.root.geometry(f"{WIDTH}x{HEIGHT}")
        self.root.configure(bg="#060208")
        self.root.resizable(False, False)

        self.canvas = tk.Canvas(root, width=WIDTH, height=HEIGHT, bg="#060208", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True)

        self.base_scale = 14.5
        self.time_sec = 0.0
        self.bpm = 60.0
        self.spring_x = 0.0
        self.spring_v = 0.0
        self.last_beat_lub = False

        self.ruby_hearts = []
        self.poetic_whispers = []
        self.last_whisper_time = -10.0
        self.whisper_lane_toggle = 0

        # Balanced fiber count for buttery smooth Tkinter rendering (2,400 fibers)
        random.seed(2026)
        self.fibers = []
        for _ in range(1800):
            phi = random.uniform(-math.pi, math.pi)
            max_r = get_max_radius(phi)
            r_frac = (random.random() ** 0.62) * 0.99
            flen = random.uniform(6.0, 14.0) * (0.6 + 0.65 * r_frac)
            fan = random.gauss(0.0, 0.22)
            u = r_frac ** 1.3
            rc = int(185 + 70 * u)
            gc = int(15 + 35 * u)
            bc = int(60 + 65 * u)
            col = f"#{rc:02x}{gc:02x}{bc:02x}"
            self.fibers.append((phi, max_r * r_frac, flen, phi + fan, col))

        for _ in range(600):
            t = random.uniform(0.0, 2.0 * math.pi)
            hx, hy = get_heart_xy(t)
            nx, ny = get_heart_normal(t)
            phi = math.atan2(hy, hx)
            max_r = math.hypot(hx, hy)
            flen = random.uniform(10.0, 18.0) if random.random() < 0.25 else random.uniform(6.0, 12.0)
            ang = math.atan2(ny, nx) + random.gauss(0.0, 0.25)
            col = "#ffd2eb" if random.random() < 0.3 else "#ff327d"
            self.fibers.append((phi, max_r * (1.0 + random.uniform(-0.02, 0.015)), flen, ang, col))

        self.canvas.bind("<Button-1>", lambda e: self.handle_click())
        self.root.bind("<space>", lambda e: self.handle_click())
        self.animate()

    def handle_click(self):
        # Harmonic spring impulse (anti-freeze)
        self.spring_v = min(2.4, self.spring_v + 0.85)

        # Spawn ruby heart
        if len(self.ruby_hearts) < 8:
            t = random.uniform(0, 2 * math.pi)
            hx, hy = get_heart_xy(t)
            nx, ny = get_heart_normal(t)
            self.ruby_hearts.append({
                "x": CENTER_X + hx * self.base_scale + nx * 25,
                "y": CENTER_Y + hy * self.base_scale + ny * 25,
                "vy": -1.8,
                "life": 45
            })

        now = self.time_sec
        if now - self.last_whisper_time > 1.4 and len(self.poetic_whispers) < 2:
            self.last_whisper_time = now
            text = random.choice(ROMANTIC_POETRY)
            lane_x = CENTER_X - 210 if self.whisper_lane_toggle == 0 else CENTER_X + 210
            self.whisper_lane_toggle = 1 - self.whisper_lane_toggle
            self.poetic_whispers.append({
                "text": text,
                "x": lane_x,
                "y": CENTER_Y - 50,
                "vy": -0.8,
                "life": 70
            })

    def animate(self):
        dt = 0.025
        self.time_sec += dt
        period = 60.0 / self.bpm
        p = (self.time_sec % period) / period

        # Critically damped spring update
        k = 42.0
        c = 8.6
        acc = -k * self.spring_x - c * self.spring_v
        self.spring_v += acc * dt
        self.spring_x += self.spring_v * dt
        spring_offset = min(0.18, max(0.0, self.spring_x))

        # Dual Gaussian
        d1 = p - 0.10
        d2 = p - 0.28
        g1 = math.exp(-(d1 * d1) / (2.0 * 0.038 * 0.038))
        g2 = math.exp(-(d2 * d2) / (2.0 * 0.042 * 0.042))
        breath = 0.012 * math.sin(p * math.pi * 2.0)
        scale = 1.0 + 0.135 * g1 + 0.075 * g2 + breath + spring_offset

        if g1 > 0.85 and not self.last_beat_lub:
            self.last_beat_lub = True
            if len(self.ruby_hearts) < 6:
                hx, hy = get_heart_xy(random.uniform(0, 2 * math.pi))
                self.ruby_hearts.append({"x": CENTER_X + hx * self.base_scale * scale, "y": CENTER_Y + hy * self.base_scale * scale, "vy": -1.5, "life": 40})
        elif g1 < 0.2:
            self.last_beat_lub = False

        eff_scale = self.base_scale * scale
        self.canvas.delete("all")

        # Header
        self.canvas.create_text(CENTER_X, 45, text="MY HEART BEATS ONLY FOR YOU", font=("Georgia", 18, "bold"), fill="#fff5fa")
        self.canvas.create_text(CENTER_X, 80, text="In a universe of billions, my soul found its home in Deelan ♥", font=("Georgia", 11, "italic"), fill="#e6a8cb")

        # Fibers
        flutter = self.time_sec * 3.6
        for phi, base_r, flen, angle, color in self.fibers:
            r = base_r * eff_scale
            px = CENTER_X + r * math.cos(phi)
            py = CENTER_Y + r * math.sin(phi)
            fl = flen * (eff_scale / self.base_scale)
            ang = angle + 0.05 * math.sin(flutter + phi * 3.0)
            ex = px + fl * math.cos(ang)
            ey = py + fl * math.sin(ang)
            self.canvas.create_line(px, py, ex, ey, fill=color, width=1)

        # Center name "Deelan"
        self.canvas.create_text(CENTER_X, CENTER_Y - 24, text="Deelan", font=("Monotype Corsiva", 32, "bold"), fill="#ff327d")
        self.canvas.create_text(CENTER_X, CENTER_Y - 25, text="Deelan", font=("Monotype Corsiva", 32, "bold"), fill="#fff8fc")

        # Ruby Hearts
        new_hearts = []
        for h in self.ruby_hearts:
            h["y"] += h["vy"]
            h["life"] -= 1
            if h["life"] > 0:
                self.canvas.create_text(h["x"], h["y"], text="♥", font=("Georgia", 18, "bold"), fill="#ff1840")
                new_hearts.append(h)
        self.ruby_hearts = new_hearts

        # Poetic Whispers
        new_whispers = []
        for w in self.poetic_whispers:
            w["y"] += w["vy"]
            w["life"] -= 1
            if w["life"] > 0:
                self.canvas.create_text(w["x"], w["y"], text=w["text"], font=("Monotype Corsiva", 16, "italic"), fill="#fff0f5")
                new_whispers.append(w)
        self.poetic_whispers = new_whispers

        self.root.after(25, self.animate)

if __name__ == "__main__":
    root = tk.Tk()
    app = TkinterRomanticHeart(root)
    root.mainloop()
