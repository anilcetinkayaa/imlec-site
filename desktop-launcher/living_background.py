from __future__ import annotations

import math
import random
import time

from PySide6.QtCore import QPointF, QRectF, QTimer, Qt
from PySide6.QtGui import QColor, QImage, QLinearGradient, QPainter, QPainterPath, QPen, QRadialGradient
from PySide6.QtWidgets import QWidget


REV9_PALETTES: dict[str, list[tuple[int, int, int]]] = {
    "mavi": [(86, 136, 255), (122, 108, 255), (74, 170, 255), (150, 118, 255), (96, 150, 255)],
    "mor": [(168, 102, 255), (224, 108, 236), (132, 92, 255), (255, 118, 198), (192, 110, 255)],
    "zumrut": [(52, 200, 160), (70, 214, 122), (58, 182, 204), (112, 228, 150), (42, 160, 190)],
    "gunbatimi": [(255, 122, 84), (255, 92, 140), (255, 162, 72), (242, 104, 122), (255, 142, 100)],
    "altin": [(255, 188, 84), (255, 158, 62), (240, 198, 120), (222, 142, 52), (255, 208, 140)],
    "buz": [(168, 214, 255), (196, 232, 255), (128, 192, 255), (214, 240, 255), (148, 204, 255)],
}

REV9_ATMOSPHERES: tuple[tuple[str, str], ...] = (
    ("aurora", "Aurora"),
    ("mesh", "Renk Kumaşı"),
    ("silk", "İpek"),
    ("shimmer", "Işıltı"),
    ("horizon", "Ufuk"),
    ("polar", "Kutup"),
    ("orb", "Küre"),
    ("dawn", "Şafak"),
    ("off", "Kapalı"),
)

CUSTOM_PRESETS: dict[str, dict[str, object]] = {
    "aurora": {
        "label": "Aurora",
        "bg0": "#060b0d",
        "bg1": "#081014",
        "bg2": "#0e1a1c",
        "bg3": "#132428",
        "line": "rgba(120,255,210,0.14)",
        "line2": "rgba(120,255,210,0.26)",
        "tx1": "#eafff6",
        "tx2": "#a9d9cc",
        "tx3": "#5f8b7f",
        "acc": "#39e6b0",
        "accTx": "#04140f",
        "accSoft": "rgba(57,230,176,0.16)",
        "panel": "rgba(7,18,20,0.5)",
        "colors": [(57, 230, 176), (90, 176, 255), (170, 110, 255)],
    },
    "nebula": {
        "label": "Nebula",
        "bg0": "#0a0714",
        "bg1": "#0c081a",
        "bg2": "#150f24",
        "bg3": "#1c1430",
        "line": "rgba(180,150,255,0.14)",
        "line2": "rgba(180,150,255,0.26)",
        "tx1": "#f3eefc",
        "tx2": "#c2b3de",
        "tx3": "#7c6f9a",
        "acc": "#c86bff",
        "accTx": "#170a24",
        "accSoft": "rgba(200,107,255,0.16)",
        "panel": "rgba(11,7,24,0.5)",
        "colors": [(200, 107, 255), (110, 150, 255), (255, 130, 210)],
    },
    "akiskan": {
        "label": "Akışkan",
        "bg0": "#080b12",
        "bg1": "#0a0e17",
        "bg2": "#101623",
        "bg3": "#161d2d",
        "line": "rgba(120,170,255,0.14)",
        "line2": "rgba(120,170,255,0.24)",
        "tx1": "#f1f5fc",
        "tx2": "#a9bcdc",
        "tx3": "#647089",
        "acc": "#4fd1ff",
        "accTx": "#031824",
        "accSoft": "rgba(79,209,255,0.16)",
        "panel": "rgba(8,11,18,0.5)",
        "colors": [(79, 209, 255), (120, 110, 255), (60, 230, 200)],
    },
    "nefes": {
        "label": "Nefes",
        "bg0": "#0a0d16",
        "bg1": "#0c1019",
        "bg2": "#111726",
        "bg3": "#171f30",
        "line": "rgba(255,200,140,0.12)",
        "line2": "rgba(255,200,140,0.22)",
        "tx1": "#f4f2fb",
        "tx2": "#a9b2c9",
        "tx3": "#606a82",
        "acc": "#ffb454",
        "accTx": "#1a1206",
        "accSoft": "rgba(255,180,84,0.16)",
        "panel": "rgba(9,12,20,0.5)",
        "colors": [(255, 180, 84), (255, 200, 140), (130, 170, 255)],
    },
    "safak": {
        "label": "Şafak",
        "bg0": "#150c16",
        "bg1": "#180e1a",
        "bg2": "#211323",
        "bg3": "#2b1a2d",
        "line": "rgba(255,175,150,0.14)",
        "line2": "rgba(255,175,150,0.25)",
        "tx1": "#fbeeec",
        "tx2": "#d9b3ac",
        "tx3": "#8f6b68",
        "acc": "#ff7a68",
        "accTx": "#1d0906",
        "accSoft": "rgba(255,122,104,0.16)",
        "panel": "rgba(19,10,20,0.5)",
        "colors": [(255, 122, 104), (255, 180, 84), (160, 80, 180)],
    },
    "particles": {
        "label": "Parçacıklar",
        "bg0": "#0a0d0a",
        "bg1": "#0c0f0c",
        "bg2": "#121712",
        "bg3": "#181f18",
        "line": "rgba(255,210,140,0.12)",
        "line2": "rgba(255,210,140,0.22)",
        "tx1": "#f5f4ec",
        "tx2": "#b9bcae",
        "tx3": "#71766a",
        "acc": "#ffcf6b",
        "accTx": "#1c1404",
        "accSoft": "rgba(255,207,107,0.16)",
        "panel": "rgba(9,12,9,0.5)",
        "colors": [(255, 207, 107), (255, 180, 84), (120, 220, 160)],
    },
}


def color_rgba(rgb: tuple[int, int, int], alpha: float) -> QColor:
    return QColor(rgb[0], rgb[1], rgb[2], max(0, min(255, round(alpha * 255))))


def mix_rgb(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def ease_in_out(t: float) -> float:
    t = clamp(t)
    return 0.5 - 0.5 * math.cos(t * math.pi)


def cycle(t: float, duration: float, delay: float = 0.0) -> float:
    if duration <= 0:
        return 0.0
    return ((t - delay) % duration) / duration


def pingpong(t: float, duration: float, delay: float = 0.0) -> float:
    p = cycle(t, duration, delay)
    return ease_in_out(p * 2 if p <= 0.5 else (1 - p) * 2)


class CustomLiveBackground(QWidget):
    """Mockup'taki 6 hazir CSS animasyonlu temanin (launcher-tasarim.html .lv-* katmanlari)
    birebir Qt karsiligi. Yumusak (blur'lu) ogeler dusuk cozunurluklu bir ara katmana cizilip
    buyutulur (CSS filter:blur emulasyonu); yildiz/halka/atesbocegi gibi keskin ogeler tam
    cozunurlukte ustune cizilir. Karisim modu CSS'teki gibi 'screen'."""

    def __init__(self, parent: QWidget | None = None, *, preview: bool = False):
        super().__init__(parent)
        self.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents, True)
        self.preset = "aurora"
        self.preview = preview
        self.reduce_motion = False
        self.started_at = time.monotonic()
        self.phase = 0.0
        self.layer: QImage | None = None
        self.timer = QTimer(self)
        self.timer.setInterval(50 if preview else 33)
        self.timer.timeout.connect(self.tick)
        rnd = random.Random(260 if preview else 261)
        self.stars = [(rnd.random(), rnd.random(), 2 + rnd.random() * 3, -rnd.random() * 4) for _ in range(40)]
        self.flies = [(rnd.random(), 0.4 + rnd.random() * 0.55, 8 + rnd.random() * 8, -rnd.random() * 16) for _ in range(26)]
        self.hide()

    def set_preset(self, preset: str):
        self.preset = preset if preset in CUSTOM_PRESETS else "aurora"
        self.started_at = time.monotonic()
        self.show()
        self.update_timer()
        self.update()

    def set_reduce_motion(self, reduce: bool):
        self.reduce_motion = reduce
        self.update_timer()

    def stop(self):
        self.timer.stop()
        self.hide()

    def update_timer(self):
        if self.reduce_motion:
            self.timer.stop()
        elif not self.timer.isActive():
            self.timer.start()

    def tick(self):
        self.phase = time.monotonic() - self.started_at
        self.update()

    PREVIEW_BLOBS = {
        "aurora": ("#04100f", "#0a1c1a", (57, 230, 176), (90, 176, 255)),
        "nebula": ("#0a0714", "#150f24", (200, 107, 255), (107, 176, 255)),
        "akiskan": ("#080b12", "#101623", (79, 209, 255), (138, 123, 255)),
    }

    def paintEvent(self, event):
        w = max(1, self.width())
        h = max(1, self.height())
        t = self.phase
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        painter.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform, True)
        factor = 3 if self.preview else 6
        layer_w = max(1, round(w / factor))
        layer_h = max(1, round(h / factor))
        if self.layer is None or self.layer.width() != layer_w or self.layer.height() != layer_h:
            self.layer = QImage(layer_w, layer_h, QImage.Format.Format_ARGB32_Premultiplied)
        self.layer.fill(0)
        soft = QPainter(self.layer)
        soft.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        soft.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform, True)
        soft.scale(layer_w / w, layer_h / h)
        if self.preview:
            self.preview_soft(soft, w, h, t)
        else:
            getattr(self, f"soft_{self.preset}", self.soft_aurora)(soft, w, h, t)
        soft.end()
        painter.drawImage(QRectF(0, 0, w, h), self.layer)
        if self.preview:
            if self.preset == "particles":
                self.preview_crisp_particles(painter, w, h, t)
        else:
            crisp = getattr(self, f"crisp_{self.preset}", None)
            if crisp is not None:
                crisp(painter, w, h, t)

    def css_blob(self, p: QPainter, cx: float, cy: float, radius: float, rgb: tuple[int, int, int], peak: float, opacity: float, fade: float = 0.70):
        # CSS radial-gradient(circle, rgba(c,peak), transparent fade%) + element opacity karsiligi
        gradient = QRadialGradient(QPointF(cx, cy), radius)
        gradient.setColorAt(0.0, color_rgba(rgb, peak))
        gradient.setColorAt(fade, color_rgba(rgb, 0.0))
        gradient.setColorAt(1.0, color_rgba(rgb, 0.0))
        p.setOpacity(opacity)
        p.setPen(Qt.PenStyle.NoPen)
        p.setBrush(gradient)
        p.drawEllipse(QPointF(cx, cy), radius, radius)
        p.setOpacity(1.0)

    # ── Aurora — yeniden tasarim: gercek kuzey isigi gibi dikey isik huzmeleri.
    # Dalgali bir bant boyunca uzunlugu/parlakligi titresen isinlar; renk yesilden
    # maviye, mora akar. Ustune yildizlar (keskin katman). ──
    AURORA_STOPS = ((57, 230, 176), (90, 190, 255), (170, 110, 255))

    def aurora_color(self, u: float) -> tuple[int, int, int]:
        u = u % 1.0
        if u < 0.5:
            return mix_rgb(self.AURORA_STOPS[0], self.AURORA_STOPS[1], u * 2)
        return mix_rgb(self.AURORA_STOPS[1], self.AURORA_STOPS[2], (u - 0.5) * 2)

    def soft_aurora(self, p: QPainter, w: float, h: float, t: float):
        base = QLinearGradient(QPointF(0, 0), QPointF(0, h))
        base.setColorAt(0.0, QColor("#03120f"))
        base.setColorAt(0.55, QColor("#060b0d"))
        base.setColorAt(1.0, QColor("#04090b"))
        p.fillRect(QRectF(0, 0, w, h), base)
        p.setCompositionMode(QPainter.CompositionMode.CompositionMode_Screen)
        p.setPen(Qt.PenStyle.NoPen)
        step = 14.0
        x = -step
        while x <= w + step:
            u = x / max(w, 1.0)
            # perdenin ust cizgisi ve isin uzunlugu dalgalanir
            top = h * (0.10 + 0.06 * math.sin(u * 4.4 + t * 0.30) + 0.03 * math.sin(u * 9.7 - t * 0.22 + 1.3))
            length = h * (0.24 + 0.11 * math.sin(u * 6.2 + t * 0.42 + 0.7) + 0.06 * math.sin(u * 13.0 - t * 0.31 + 2.9))
            # isin parlakligi: yavas zarf + hizli titresim (aurora dalgalanmasi)
            envelope = 0.55 + 0.45 * math.sin(u * 7.5 + t * 0.9)
            flicker = 0.75 + 0.25 * math.sin(u * 23.0 - t * 1.6 + 4.0)
            alpha = 0.42 * max(0.0, envelope) * flicker
            if alpha > 0.01:
                rgb = self.aurora_color(u * 0.7 + 0.06 * math.sin(t * 0.12))
                gradient = QLinearGradient(QPointF(0, top), QPointF(0, top + length))
                gradient.setColorAt(0.00, color_rgba(rgb, alpha * 0.35))
                gradient.setColorAt(0.22, color_rgba(rgb, alpha))
                gradient.setColorAt(0.70, color_rgba(rgb, alpha * 0.30))
                gradient.setColorAt(1.00, color_rgba(rgb, 0.0))
                p.fillRect(QRectF(x, top, step - 3.0, length), gradient)
            x += step
        # perdenin tabaninda yumusak parilti
        self.css_blob(p, w * 0.5, h * 0.16, w * 0.42, (57, 230, 176), 0.14, 1.0)
        p.setCompositionMode(QPainter.CompositionMode.CompositionMode_SourceOver)

    def crisp_aurora(self, p: QPainter, w: float, h: float, t: float):
        p.setPen(Qt.PenStyle.NoPen)
        for sx, sy, duration, delay in self.stars[:28]:
            twinkle = 0.15 + 0.85 * pingpong(t, duration, delay)
            p.setBrush(QColor(214, 255, 240, round(twinkle * 210)))
            p.drawEllipse(QRectF(sx * w, sy * h * 0.5, 1.8, 1.8))

    # ── Bulutsu: elips degrade zemin + 3 bulut (screen) + tam cozunurlukte yildizlar ──
    def soft_nebula(self, p: QPainter, w: float, h: float, t: float):
        p.fillRect(QRectF(0, 0, w, h), QColor("#0a0714"))
        p.save()
        p.translate(w * 0.30, h * 0.20)
        rx = w * 0.90
        ry = h * 0.70
        p.scale(1.0, ry / rx)
        base = QRadialGradient(QPointF(0, 0), rx)
        base.setColorAt(0.0, QColor("#1b1030"))
        base.setColorAt(0.65, QColor("#0a0714"))
        p.setPen(Qt.PenStyle.NoPen)
        p.setBrush(base)
        p.drawEllipse(QPointF(0, 0), rx, rx)
        p.restore()
        p.setCompositionMode(QPainter.CompositionMode.CompositionMode_Screen)
        clouds = (
            (w * 0.08, h * 0.12, 340.0, (190, 110, 255), 0.55, 34.0, 0.0),
            (w - w * 0.10 - 280, h * 0.38, 280.0, (110, 150, 255), 0.50, 28.0, -10.0),
            (w * 0.34, h - h * 0.06 - 220, 220.0, (255, 130, 210), 0.40, 40.0, -20.0),
        )
        for x, y, size, rgb, peak, duration, delay in clouds:
            k = pingpong(t, duration, delay)
            cx = x + size / 2 + 0.04 * size * k
            cy = y + size / 2 - 0.06 * size * k
            self.css_blob(p, cx, cy, (size / 2) * (1 + 0.15 * k), rgb, peak, 0.5)
        p.setCompositionMode(QPainter.CompositionMode.CompositionMode_SourceOver)

    def crisp_nebula(self, p: QPainter, w: float, h: float, t: float):
        p.setPen(Qt.PenStyle.NoPen)
        for sx, sy, duration, delay in self.stars:
            twinkle = 0.15 + 0.85 * pingpong(t, duration, delay)
            p.setBrush(QColor(255, 255, 255, round(twinkle * 255)))
            p.drawEllipse(QRectF(sx * w, sy * h, 2, 2))

    # ── Akiskan — yeniden tasarim: lav lambasi gibi Lissajous yorungelerinde suzulen,
    # birlesip ayrilan sivi lekeler + ekrani capraz kat eden akis seritleri. ──
    def soft_akiskan(self, p: QPainter, w: float, h: float, t: float):
        base = QLinearGradient(QPointF(0, 0), QPointF(0, h))
        base.setColorAt(0.0, QColor("#071019"))
        base.setColorAt(1.0, QColor("#080b12"))
        p.fillRect(QRectF(0, 0, w, h), base)
        p.setCompositionMode(QPainter.CompositionMode.CompositionMode_Screen)
        blobs = (
            # merkez, gezinme genligi, frekanslar(rad/s), yaricap, renk, tepe alfa, faz
            (0.38, 0.38, 0.18, 0.14, 0.48, 0.33, 250.0, (79, 209, 255), 0.60, 0.0),
            (0.62, 0.34, 0.16, 0.17, 0.35, 0.50, 220.0, (120, 110, 255), 0.55, 1.9),
            (0.50, 0.60, 0.21, 0.12, 0.41, 0.29, 235.0, (60, 230, 200), 0.50, 3.7),
            (0.28, 0.64, 0.13, 0.10, 0.60, 0.43, 160.0, (150, 220, 255), 0.45, 5.2),
        )
        for cxf, cyf, axf, ayf, fx, fy, radius, rgb, peak, phase in blobs:
            x = w * (cxf + axf * math.sin(t * fx + phase))
            y = h * (cyf + ayf * math.sin(t * fy + phase * 1.7 + 1.0))
            r = radius * (1.0 + 0.10 * math.sin(t * 0.9 + phase))
            self.css_blob(p, x, y, r, rgb, peak, 0.60)
        # akis seritleri: yatayda suzulen, uzatilmis parilti
        for i, (yf, speed, radius, rgb, alpha) in enumerate((
            (0.38, 46.0, 110.0, (79, 209, 255), 0.32),
            (0.64, 34.0, 130.0, (60, 230, 200), 0.26),
        )):
            span = w + 700.0
            bx = ((t * speed + i * 500.0) % span) - 350.0
            by = h * (yf + 0.05 * math.sin(t * 0.4 + i * 2.0))
            p.save()
            p.translate(bx, by)
            p.scale(3.2, 1.0)
            self.css_blob(p, 0, 0, radius, rgb, alpha, 0.55)
            p.restore()
        p.setCompositionMode(QPainter.CompositionMode.CompositionMode_SourceOver)

    # ── Nefes: 220px nefes alan kure (yumusak) + 344/280px halkalar ve yorunge noktalari (keskin) ──
    def soft_nefes(self, p: QPainter, w: float, h: float, t: float):
        p.fillRect(QRectF(0, 0, w, h), QColor("#0a0d16"))
        p.setCompositionMode(QPainter.CompositionMode.CompositionMode_Screen)
        k = pingpong(t, 4.5)
        self.css_blob(p, w / 2, h / 2, 110.0 * (0.92 + 0.14 * k), (255, 180, 84), 0.60, 0.75 + 0.25 * k, fade=0.72)
        p.setCompositionMode(QPainter.CompositionMode.CompositionMode_SourceOver)

    def crisp_nefes(self, p: QPainter, w: float, h: float, t: float):
        cx, cy = w / 2, h / 2
        for radius, duration, reverse in ((172.0, 50.0, False), (140.0, 34.0, True)):
            p.setPen(QPen(color_rgba((255, 200, 140), 0.18), 1.0))
            p.setBrush(Qt.BrushStyle.NoBrush)
            p.drawEllipse(QPointF(cx, cy), radius, radius)
            direction = -1.0 if reverse else 1.0
            angle = -math.pi / 2 + direction * (t / duration) * math.tau
            dx = cx + math.cos(angle) * radius
            dy = cy + math.sin(angle) * radius
            glow = QRadialGradient(QPointF(dx, dy), 12.0)
            glow.setColorAt(0.0, color_rgba((255, 180, 84), 0.7))
            glow.setColorAt(1.0, color_rgba((255, 180, 84), 0.0))
            p.setPen(Qt.PenStyle.NoPen)
            p.setBrush(glow)
            p.drawEllipse(QPointF(dx, dy), 12.0, 12.0)
            p.setBrush(color_rgba((255, 207, 138), 1.0))
            p.drawEllipse(QPointF(dx, dy), 3.0, 3.0)

    # ── Safak — yeniden tasarim: kayan gokyuzu degradesi + nabiz gibi atan gunes
    # + ufukta suzulen pus bantlari. Hareket net gorulur. ──
    def soft_safak(self, p: QPainter, w: float, h: float, t: float):
        shift = pingpong(t, 24.0)  # 12 saniyede bir yon degistiren gokyuzu kaymasi
        virtual_w, virtual_h = 1.8 * w, 1.8 * h
        off_x = -shift * (virtual_w - w)
        off_y = -(0.2 + 0.6 * shift) * (virtual_h - h)
        angle = math.radians(200.0)
        dir_x, dir_y = math.sin(angle), -math.cos(angle)
        length = abs(virtual_w * dir_x) + abs(virtual_h * dir_y)
        cx = off_x + virtual_w / 2
        cy = off_y + virtual_h / 2
        gradient = QLinearGradient(
            QPointF(cx - dir_x * length / 2, cy - dir_y * length / 2),
            QPointF(cx + dir_x * length / 2, cy + dir_y * length / 2),
        )
        gradient.setColorAt(0.0, QColor("#150c2c"))
        gradient.setColorAt(0.38, QColor("#3a1c3c"))
        gradient.setColorAt(0.62, QColor("#8a3d4a"))
        gradient.setColorAt(0.82, QColor("#c96a3e"))
        gradient.setColorAt(1.0, QColor("#e8a253"))
        p.fillRect(QRectF(0, 0, w, h), gradient)
        p.setCompositionMode(QPainter.CompositionMode.CompositionMode_Screen)
        # gunes: ufkun hemen ustunde yavasca yukselip alcalan, nabiz gibi atan kure
        pulse = 0.5 + 0.5 * math.sin(t * 0.8)
        sun_x = w * (0.5 + 0.06 * math.sin(t * 0.15))
        sun_y = h * (0.80 - 0.03 * pingpong(t, 16.0))
        self.css_blob(p, sun_x, sun_y, w * 0.085, (255, 236, 190), 0.85, 0.9 + 0.1 * pulse, fade=0.55)
        p.save()
        p.translate(sun_x, sun_y)
        p.scale(1.0, 0.45)
        self.css_blob(p, 0, 0, w * 0.30, (255, 190, 120), 0.45 + 0.10 * pulse, 1.0)
        p.restore()
        # pus bantlari: ufukta sagdan sola suzulen uzatilmis parlak lekeler
        for i, (yf, speed, radius, alpha) in enumerate((
            (0.70, 26.0, 95.0, 0.20),
            (0.60, 18.0, 75.0, 0.14),
            (0.80, 34.0, 120.0, 0.16),
        )):
            span = w + 800.0
            bx = w + 400.0 - ((t * speed + i * 430.0) % span)
            by = h * (yf + 0.02 * math.sin(t * 0.3 + i * 1.6))
            p.save()
            p.translate(bx, by)
            p.scale(3.6, 1.0)
            self.css_blob(p, 0, 0, radius, (255, 214, 170), alpha, 0.85)
            p.restore()
        # genis parilti (mockup'taki glare korunuyor)
        k = pingpong(t, 20.0)
        glare_w, glare_h = 0.70 * w, 0.46 * h
        gx = 0.15 * w + (-0.04 + 0.08 * k) * glare_w
        gy = h - 0.06 * h - glare_h
        p.save()
        p.translate(gx + glare_w / 2, gy + glare_h / 2)
        p.scale(1.0, glare_h / glare_w)
        self.css_blob(p, 0, 0, glare_w / 2, (255, 224, 170), 0.45, 0.85 + 0.15 * k)
        p.restore()
        p.setCompositionMode(QPainter.CompositionMode.CompositionMode_SourceOver)

    # ── Parcaciklar: 26 atesbocegi, alttan yukari suzulur (keskin katman) ──
    def soft_particles(self, p: QPainter, w: float, h: float, t: float):
        p.fillRect(QRectF(0, 0, w, h), QColor("#0a0d0a"))

    def crisp_particles(self, p: QPainter, w: float, h: float, t: float):
        p.setPen(Qt.PenStyle.NoPen)
        for fx, fy, duration, delay in self.flies:
            phase = cycle(t, duration, delay)
            if phase < 0.12:
                alpha = 0.9 * (phase / 0.12)
            elif phase < 0.88:
                alpha = 0.9 - 0.2 * ((phase - 0.12) / 0.76)
            else:
                alpha = 0.7 * (1 - (phase - 0.88) / 0.12)
            x = fx * w
            y = fy * h - phase * 160.0
            glow = QRadialGradient(QPointF(x, y), 9.0)
            glow.setColorAt(0.0, color_rgba((255, 207, 107), 0.7 * alpha))
            glow.setColorAt(1.0, color_rgba((255, 207, 107), 0.0))
            p.setBrush(glow)
            p.drawEllipse(QPointF(x, y), 9.0, 9.0)
            p.setBrush(color_rgba((255, 207, 107), alpha))
            p.drawEllipse(QPointF(x, y), 2.5, 2.5)

    # ── Ayarlar kartlarindaki mini onizlemeler (mockup .thp-live / .thp-safak) ──
    def preview_soft(self, p: QPainter, w: float, h: float, t: float):
        if self.preset in self.PREVIEW_BLOBS:
            c0, c1, rgb1, rgb2 = self.PREVIEW_BLOBS[self.preset]
            gradient = QLinearGradient(QPointF(0, 0), QPointF(w, h))
            gradient.setColorAt(0.0, QColor(c0))
            gradient.setColorAt(1.0, QColor(c1))
            p.fillRect(QRectF(0, 0, w, h), gradient)
            p.setCompositionMode(QPainter.CompositionMode.CompositionMode_Screen)
            k1 = pingpong(t, 6.0)
            self.css_blob(p, -8 + 22 + 5 * k1, -8 + 22 - 5 * k1, 22.0 * (1 + 0.18 * k1), rgb1, 1.0, 0.7)
            k2 = pingpong(t, 7.0, -3.2)
            self.css_blob(p, w + 6 - 16 + 5 * k2, h + 8 - 16 - 5 * k2, 16.0 * (1 + 0.18 * k2), rgb2, 1.0, 0.7)
            p.setCompositionMode(QPainter.CompositionMode.CompositionMode_SourceOver)
        elif self.preset == "nefes":
            p.fillRect(QRectF(0, 0, w, h), QColor("#0a0d16"))
            p.setCompositionMode(QPainter.CompositionMode.CompositionMode_Screen)
            k = pingpong(t, 4.5)
            self.css_blob(p, w / 2, h / 2, 19.0 * (0.92 + 0.14 * k), (255, 180, 84), 1.0, 0.75 + 0.25 * k, fade=0.72)
            p.setCompositionMode(QPainter.CompositionMode.CompositionMode_SourceOver)
        elif self.preset == "safak":
            shift = pingpong(t, 18.0)  # 9s alternate
            virtual_w, virtual_h = 1.8 * w, 1.8 * h
            off_x = -shift * (virtual_w - w)
            off_y = -(0.2 + 0.6 * shift) * (virtual_h - h)
            angle = math.radians(200.0)
            dir_x, dir_y = math.sin(angle), -math.cos(angle)
            length = abs(virtual_w * dir_x) + abs(virtual_h * dir_y)
            cx = off_x + virtual_w / 2
            cy = off_y + virtual_h / 2
            gradient = QLinearGradient(
                QPointF(cx - dir_x * length / 2, cy - dir_y * length / 2),
                QPointF(cx + dir_x * length / 2, cy + dir_y * length / 2),
            )
            gradient.setColorAt(0.0, QColor("#150c2c"))
            gradient.setColorAt(0.40, QColor("#3a1c3c"))
            gradient.setColorAt(0.66, QColor("#8a3d4a"))
            gradient.setColorAt(1.0, QColor("#e8a253"))
            p.fillRect(QRectF(0, 0, w, h), gradient)
        elif self.preset == "particles":
            p.fillRect(QRectF(0, 0, w, h), QColor("#0a0d0a"))

    def preview_crisp_particles(self, p: QPainter, w: float, h: float, t: float):
        fixed = ((0.18, 0.70, 5.0, -1.0), (0.42, 0.40, 6.5, -3.0), (0.65, 0.60, 5.8, -0.5), (0.80, 0.30, 7.0, -4.0))
        p.setPen(Qt.PenStyle.NoPen)
        for fx, fy, duration, delay in fixed:
            phase = cycle(t, duration, delay)
            if phase < 0.12:
                alpha = 0.9 * (phase / 0.12)
            elif phase < 0.88:
                alpha = 0.9 - 0.2 * ((phase - 0.12) / 0.76)
            else:
                alpha = 0.7 * (1 - (phase - 0.88) / 0.12)
            x = fx * w
            y = fy * h - phase * 60.0
            glow = QRadialGradient(QPointF(x, y), 6.0)
            glow.setColorAt(0.0, color_rgba((255, 207, 107), 0.8 * alpha))
            glow.setColorAt(1.0, color_rgba((255, 207, 107), 0.0))
            p.setBrush(glow)
            p.drawEllipse(QPointF(x, y), 6.0, 6.0)
            p.setBrush(color_rgba((255, 207, 107), alpha))
            p.drawEllipse(QPointF(x, y), 1.75, 1.75)


class LivingBackground(QWidget):
    def __init__(self, parent: QWidget | None = None, *, preview: bool = False):
        super().__init__(parent)
        self.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents, True)
        self.preview = preview
        self.atmosphere = "off"
        self.color_name = "mavi"
        self.intensity = 1.0
        self.base_color = QColor(5, 7, 11)
        self.reduce_motion = False
        self.started_at = time.monotonic()
        self.phase = 0.0
        self.mx = 0.5
        self.my = 0.3
        self.ix = 0.5
        self.iy = 0.3
        self.timer = QTimer(self)
        self.timer.setInterval(50 if preview else 33)
        self.timer.timeout.connect(self.tick)
        self.mesh_w = 36
        self.mesh_h = 20
        self.mesh = QImage(self.mesh_w, self.mesh_h, QImage.Format.Format_ARGB32_Premultiplied)
        self.layer: QImage | None = None
        self.hide()

    def configure(self, *, atmosphere: str, color_name: str = "mavi", intensity: float = 1.0):
        self.atmosphere = atmosphere if atmosphere in {key for key, _ in REV9_ATMOSPHERES} else "off"
        self.color_name = color_name if color_name in REV9_PALETTES else "mavi"
        self.intensity = max(0.35, min(1.6, float(intensity or 1.0)))
        self.started_at = time.monotonic()
        if self.atmosphere == "off":
            self.stop()
            return
        self.show()
        self.update_timer()
        self.update()

    def set_base_color(self, color: QColor):
        if color.isValid():
            self.base_color = QColor(color.red(), color.green(), color.blue())
            self.update()

    def set_reduce_motion(self, reduce: bool):
        self.reduce_motion = reduce
        self.update_timer()

    def set_pointer(self, x: float, y: float):
        if self.preview:
            return
        self.mx = clamp(x)
        self.my = clamp(y)

    def stop(self):
        self.timer.stop()
        self.hide()

    def update_timer(self):
        if self.atmosphere == "off" or self.reduce_motion:
            self.timer.stop()
        elif not self.timer.isActive():
            self.timer.start()

    def tick(self):
        self.phase = time.monotonic() - self.started_at
        # 30 FPS'te web motorunun 60 FPS %5 yumusatmasina denk gelmesi icin %12
        self.ix += (self.mx - self.ix) * 0.12
        self.iy += (self.my - self.iy) * 0.12
        self.update()

    def paintEvent(self, event):
        if self.atmosphere == "off":
            return
        # Web motoru saydam canvas'a "lighter" ile cizer, canvas normal alfayla bg0 uzerine biner.
        # Ayni sonuc icin atmosfer saydam bir ara katmana cizilip taban rengin uzerine bindirilir.
        width = max(1, self.width())
        height = max(1, self.height())
        if self.layer is None or self.layer.width() != width or self.layer.height() != height:
            self.layer = QImage(width, height, QImage.Format.Format_ARGB32_Premultiplied)
        self.layer.fill(0)
        layer_painter = QPainter(self.layer)
        layer_painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        layer_painter.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform, True)
        rect = QRectF(0, 0, width, height)
        if self.atmosphere != "mesh":
            layer_painter.setCompositionMode(QPainter.CompositionMode.CompositionMode_Plus)
        getattr(self, f"draw_{self.atmosphere}", self.draw_aurora)(layer_painter, rect, self.phase)
        layer_painter.end()
        painter = QPainter(self)
        painter.fillRect(rect, self.base_color)
        painter.drawImage(0, 0, self.layer)

    @property
    def palette(self) -> list[tuple[int, int, int]]:
        return REV9_PALETTES.get(self.color_name, REV9_PALETTES["mavi"])

    def radial(self, painter: QPainter, x: float, y: float, radius: float, rgb: tuple[int, int, int], alpha: float):
        gradient = QRadialGradient(QPointF(x, y), radius)
        gradient.setColorAt(0, color_rgba(rgb, alpha * self.intensity))
        gradient.setColorAt(1, color_rgba(rgb, 0))
        painter.fillRect(QRectF(x - radius, y - radius, radius * 2, radius * 2), gradient)

    def radial_stops(self, painter: QPainter, rect: QRectF, x: float, y: float, radius: float, stops: list[tuple[float, tuple[int, int, int], float]]):
        # Web'deki createRadialGradient + fillRect(0,0,W,H) karsiligi: degrade son
        # duragindaki rengiyle tuvalin tamamina yayilir (kenarda sert cizgi olusmaz).
        gradient = QRadialGradient(QPointF(x, y), radius)
        for pos, rgb, alpha in stops:
            gradient.setColorAt(pos, color_rgba(rgb, alpha * self.intensity))
        painter.fillRect(rect, gradient)

    def draw_aurora(self, painter: QPainter, rect: QRectF, s: float):
        blobs = [
            (0.66, 0.34, 0.085, 0.115, 0.0, 0.62, 0.10, 0.26, 0.15),
            (0.52, 0.26, 0.065, 0.095, 2.1, 0.24, 0.24, 0.20, 0.13),
            (0.46, 0.24, 0.105, 0.075, 4.2, 0.84, 0.32, 0.15, 0.17),
            (0.40, 0.20, 0.055, 0.085, 1.2, 0.44, 0.04, 0.30, 0.10),
            (0.34, 0.18, 0.125, 0.100, 3.3, 0.10, 0.06, 0.14, 0.12),
        ]
        base = min(rect.width(), rect.height())
        for i, (radius, alpha, f1, f2, ph, ox, oy, ax, ay) in enumerate(blobs):
            x = rect.width() * (ox + ax * math.sin(s * f1 * math.tau + ph)) + (self.ix - 0.5) * 70
            y = rect.height() * (oy + ay * math.cos(s * f2 * math.tau + ph)) + (self.iy - 0.5) * 46
            self.radial(painter, x, y, base * radius, self.palette[i % 5], alpha)
        self.fade_mask(painter, rect, 0.60, 0.22)

    def draw_mesh(self, painter: QPainter, rect: QRectF, s: float):
        # Rev9 kumas dokusunun gelistirilmis hali: daha ince doku (36x20), nefes alan
        # yogunluk, isaretciyi belirgin sekilde takip eden sicak bir odak + tam
        # cozunurlukte ek isaretci parlamasi.
        self.mesh.fill(QColor(0, 0, 0, 0))
        mesh_painter = QPainter(self.mesh)
        mesh_painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        mesh_painter.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform, True)
        mesh_painter.setCompositionMode(QPainter.CompositionMode.CompositionMode_Plus)
        breathe = 1.0 + 0.10 * math.sin(s * 0.5)
        anchors = [
            (0.55, 0.050, 0.070, 0.0, 0.72, 0.14, 0.24, 0.20),
            (0.45, 0.040, 0.060, 2.0, 0.18, 0.30, 0.20, 0.22),
            (0.42, 0.060, 0.050, 4.1, 0.86, 0.52, 0.16, 0.24),
            (0.40, 0.045, 0.065, 1.1, 0.44, 0.06, 0.30, 0.16),
            (0.38, 0.052, 0.044, 3.2, 0.10, 0.78, 0.14, 0.18),
            (0.62, 0.000, 0.000, 0.0, -1.0, -1.0, 0.00, 0.00),
        ]
        for i, (alpha, f1, f2, ph, ox, oy, ax, ay) in enumerate(anchors):
            if ox < 0:
                x = self.ix * self.mesh_w
                y = self.iy * self.mesh_h
                radius = 17.0
            else:
                x = (ox + ax * math.sin(s * f1 * math.tau + ph)) * self.mesh_w
                y = (oy + ay * math.cos(s * f2 * math.tau + ph)) * self.mesh_h
                radius = 15.0
            gradient = QRadialGradient(QPointF(x, y), radius)
            gradient.setColorAt(0, color_rgba(self.palette[i % 5], alpha * breathe * self.intensity))
            gradient.setColorAt(1, color_rgba(self.palette[i % 5], 0))
            mesh_painter.fillRect(QRectF(0, 0, self.mesh_w, self.mesh_h), gradient)
        mesh_painter.end()
        painter.drawImage(rect, self.mesh)
        if not self.preview:
            painter.setCompositionMode(QPainter.CompositionMode.CompositionMode_Plus)
            gx = self.ix * rect.width()
            gy = self.iy * rect.height()
            self.radial(painter, gx, gy, min(rect.width(), rect.height()) * 0.38, self.palette[0], 0.08)
            painter.setCompositionMode(QPainter.CompositionMode.CompositionMode_SourceOver)
        self.fade_mask(painter, rect, 0.55, 0.12)

    def draw_silk(self, painter: QPainter, rect: QRectF, s: float):
        self.draw_ribbons(painter, rect, s, shimmer=False)

    def draw_shimmer(self, painter: QPainter, rect: QRectF, s: float):
        self.draw_ribbons(painter, rect, s, shimmer=True)

    def draw_ribbons(self, painter: QPainter, rect: QRectF, s: float, *, shimmer: bool):
        ribbons = [(0.15 + i * 0.075, 34 + i * 12, 0.0016 + i * 0.0005, (0.25 + i * 0.07) * (-1 if i % 2 else 1), 46 + i * 16, 0.11 - i * 0.008) for i in range(5)]
        for i, (base, amp, k, speed, width, alpha) in enumerate(ribbons):
            path = QPainterPath()
            lift = (self.iy - 0.5) * 44
            amp_mul = 1 + (self.ix - 0.5) * 0.5
            start_y = rect.height() * base + lift
            path.moveTo(-70, start_y)
            x = -70
            while x <= rect.width() + 70:
                y = start_y + (amp * amp_mul) * math.sin(x * k + s * speed * 2) + (amp * amp_mul) * 0.5 * math.sin(x * k * 2.3 - s * speed * 1.3)
                path.lineTo(x, y)
                x += 14
            gradient = QLinearGradient(QPointF(0, start_y - 100), QPointF(0, start_y + 100))
            gradient.setColorAt(0.0, color_rgba(self.palette[i % 5], 0))
            gradient.setColorAt(0.5, color_rgba(self.palette[i % 5], alpha * (0.9 if shimmer else 1.0) * self.intensity))
            gradient.setColorAt(1.0, color_rgba(self.palette[i % 5], 0))
            painter.setPen(QPen(gradient, width, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
            painter.drawPath(path)
            if shimmer:
                p = ((s * (0.055 + i * 0.014) + i * 0.27) % 1.3) - 0.15
                if 0.02 < p < 0.98:
                    sweep = tuple(min(255, c + 130) for c in self.palette[0])
                    painter.setPen(QPen(color_rgba(sweep, 0.30 * self.intensity), max(10, width * 0.45), Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
                    painter.drawPath(path)
        self.fade_mask(painter, rect, 0.65, 0.16)

    def draw_horizon(self, painter: QPainter, rect: QRectF, s: float):
        # Ufuk — yeniden tasarim: ustten sarkan cift katmanli isik kavisi, kavis
        # boyunca zit yonlerde suzulen iki isilti ve belirgin isaretci paralaksi.
        w = rect.width()
        h = rect.height()
        col = mix_rgb(self.palette[0], self.palette[1], (math.sin(s * 0.16) + 1) / 2)
        cx = w * (0.5 + (self.ix - 0.5) * 0.34)
        cy = -h * (0.50 - (self.iy - 0.5) * 0.14)
        radius = h * (1.02 + 0.04 * math.sin(s * 0.22))
        # dis hale: genis, yumusak parlama; rimin altina da hafif isik sizar
        self.radial_stops(painter, rect, cx, cy, radius * 1.45, [
            (0.52, col, 0.0),
            (0.72, col, 0.10),
            (0.84, col, 0.20),
            (1.00, col, 0.05),
        ])
        # kubbe + parlak kavis: icten rime dogru artan isik, rimde tepe, disari dogru sonumlenir
        self.radial_stops(painter, rect, cx, cy, radius * 1.16, [
            (0.00, col, 0.10),
            (0.52, col, 0.13),
            (0.72, col, 0.20),
            (0.80, self.palette[2], 0.38),
            (0.88, col, 0.13),
            (1.00, col, 0.0),
        ])
        # ic dolgu: ustten sizan isik
        gradient = QLinearGradient(rect.topLeft(), QPointF(0, h * 0.72))
        gradient.setColorAt(0, color_rgba(col, 0.14 * self.intensity))
        gradient.setColorAt(1, color_rgba(col, 0))
        painter.fillRect(QRectF(0, 0, w, h * 0.72), gradient)
        # kavis boyunca suzulen isiltilar (isaretciyle birlikte kayar)
        rim = radius * 1.16 * 0.80
        base_glow = min(w, h)
        for freq, spread, phase_off, size, color_index, alpha in (
            (0.14, 0.55, 0.0, 0.24, 3, 0.22),
            (0.10, 0.70, 2.6, 0.16, 4, 0.16),
        ):
            angle = math.pi / 2 + spread * math.sin(s * freq * math.tau + phase_off) + (self.ix - 0.5) * 0.6
            px = cx + math.cos(angle) * rim
            py = cy + math.sin(angle) * rim
            self.radial(painter, px, py, base_glow * size, self.palette[color_index], alpha)
        self.fade_mask(painter, rect, 0.72, 0.26)

    def draw_polar(self, painter: QPainter, rect: QRectF, s: float):
        bg = QLinearGradient(QPointF(0, 0), QPointF(0, rect.height() * 0.5))
        bg.setColorAt(0, color_rgba(self.palette[0], 0.10 * self.intensity))
        bg.setColorAt(1, color_rgba(self.palette[0], 0))
        painter.fillRect(QRectF(0, 0, rect.width(), rect.height() * 0.5), bg)
        curtains = [(0.13 + i * 0.24, 0.20 + (i % 2) * 0.06, 0.05 + i * 0.012, i * 1.7, 70 + i * 20) for i in range(4)]
        for i, (x0, width_factor, freq, ph, sway) in enumerate(curtains):
            col = self.palette[i % 5]
            band_w = rect.width() * width_factor
            center = rect.width() * x0 + math.sin(s * freq * math.tau + ph) * sway + (self.ix - 0.5) * 60
            top_y = -40
            bot_y = rect.height() * (0.62 + 0.07 * math.sin(s * 0.2 + ph))
            gradient = QLinearGradient(QPointF(0, top_y), QPointF(0, bot_y))
            gradient.setColorAt(0, color_rgba(col, 1.0 * self.intensity))
            gradient.setColorAt(0.55, color_rgba(col, 0.55 * self.intensity))
            gradient.setColorAt(1, color_rgba(col, 0))
            painter.setBrush(gradient)
            painter.setPen(Qt.PenStyle.NoPen)
            step = 9
            x = -band_w / 2
            while x < band_w / 2:
                env = math.cos((x / band_w) * math.pi)
                wob = math.sin(s * 1.2 + (x + center) * 0.014 + ph)
                opacity = max(0, env * (0.26 + 0.12 * wob)) * self.intensity
                if opacity >= 0.004:
                    painter.setOpacity(min(1.0, opacity))
                    painter.fillRect(QRectF(center + x + wob * 18, top_y, step - 2, bot_y - top_y), gradient)
                x += step
            painter.setOpacity(1.0)
        self.fade_mask(painter, rect, 0.62, 0.18)

    def draw_orb(self, painter: QPainter, rect: QRectF, s: float):
        cx = rect.width() * (0.70 + (self.ix - 0.5) * 0.08)
        cy = rect.height() * (0.34 + (self.iy - 0.5) * 0.06)
        radius = min(rect.width(), rect.height()) * (0.24 + 0.012 * math.sin(s * 0.45))
        self.radial_stops(painter, rect, cx, cy, radius * 2.8, [
            (0.0, self.palette[0], 0.34),
            (0.4, self.palette[1], 0.12),
            (1.0, self.palette[1], 0.0),
        ])
        self.radial(painter, cx, cy, radius * 0.95, self.palette[2], 0.30)
        for k in range(2):
            angle = s * (0.10 + k * 0.06) * math.tau + k * 2.6
            self.radial(painter, cx + math.cos(angle) * radius * 1.9, cy + math.sin(angle) * radius * 1.15, 70 + k * 30, self.palette[3 + k], 0.22)
        self.radial(painter, rect.width() * 0.12, rect.height() * 0.05, rect.height() * 0.5, self.palette[4], 0.10)
        self.fade_mask(painter, rect, 0.70, 0.20)

    def draw_dawn(self, painter: QPainter, rect: QRectF, s: float):
        gradient = QLinearGradient(rect.topLeft(), rect.bottomLeft())
        gradient.setColorAt(0, color_rgba(self.palette[1], 0.20 * self.intensity))
        gradient.setColorAt(0.30 + 0.04 * math.sin(s * 0.18), color_rgba(self.palette[0], 0.16 * self.intensity))
        gradient.setColorAt(0.58 + 0.04 * math.sin(s * 0.14 + 2), color_rgba(self.palette[2], 0.10 * self.intensity))
        gradient.setColorAt(1, QColor(0, 0, 0, 0))
        painter.fillRect(rect, gradient)
        sx = rect.width() * (0.5 + 0.18 * math.sin(s * 0.05)) + (self.ix - 0.5) * 80
        sy = rect.height() * (0.34 + 0.02 * math.sin(s * 0.3)) + (self.iy - 0.5) * 30
        painter.save()
        painter.translate(sx, sy)
        painter.scale(1, 0.55)
        self.radial(painter, 0, 0, rect.width() * 0.28, self.palette[3], 0.30)
        painter.restore()
        self.fade_mask(painter, rect, 0.75, 0.22)

    def fade_mask(self, painter: QPainter, rect: QRectF, mid: float = 0.68, bottom: float = 0.22):
        painter.setCompositionMode(QPainter.CompositionMode.CompositionMode_DestinationIn)
        gradient = QLinearGradient(rect.topLeft(), rect.bottomLeft())
        gradient.setColorAt(0, QColor(0, 0, 0, 255))
        gradient.setColorAt(mid, QColor(0, 0, 0, 217))
        gradient.setColorAt(1, QColor(0, 0, 0, int(255 * bottom)))
        painter.fillRect(rect, gradient)
        painter.setCompositionMode(QPainter.CompositionMode.CompositionMode_SourceOver)
