import base64
import ctypes
import hashlib
import json
import os
import platform
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import traceback
import uuid
import zipfile
from datetime import datetime
from pathlib import Path

import requests
from PySide6.QtCore import QEasingCurve, QEvent, QObject, QPoint, QPointF, QRectF, QSize, QSettings, QThread, Qt, QTimer, QUrl, QVariantAnimation, Signal, Slot
from PySide6.QtGui import QAction, QColor, QDesktopServices, QFont, QIcon, QImage, QLinearGradient, QMouseEvent, QPainter, QPainterPath, QPen, QPixmap, QRadialGradient
from PySide6.QtWidgets import (
    QApplication,
    QCheckBox,
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMenu,
    QMessageBox,
    QProgressBar,
    QPushButton,
    QScrollArea,
    QSizePolicy,
    QSpacerItem,
    QStackedWidget,
    QSystemTrayIcon,
    QToolButton,
    QVBoxLayout,
    QWidget,
)

from living_background import CUSTOM_PRESETS, REV9_ATMOSPHERES, REV9_PALETTES, CustomLiveBackground, LivingBackground


AUTH_BASE_URL = os.environ.get("IMLEC_AUTH_BASE_URL", "https://imlecyazilim.com").rstrip("/")
LAUNCHER_VERSION = "0.1.8"
PRODUCT_EXE_NAMES = {
    "fis260": "FIS260.exe",
    "cozver": "Cozver.exe",
    "çözver": "Cozver.exe",
}
DEFAULT_THEME = "gece"
STATIC_THEMES = {
    "gece": {"label": "Gece", "bg0": "#0b0e15", "bg1": "#0d1119", "bg2": "#121724", "bg3": "#171d2e", "line": "rgba(148,170,220,0.12)", "line2": "rgba(148,170,220,0.20)", "tx1": "#f2f5fc", "tx2": "#a9b6cd", "tx3": "#68758d", "acc": "#4d91ff", "accTx": "#0b1220", "accSoft": "rgba(77,145,255,0.14)", "ok": "#3ddc97", "warn": "#ffc857", "danger": "#ff6b6b"},
    "komur": {"label": "Kömür", "bg0": "#101113", "bg1": "#131416", "bg2": "#18191c", "bg3": "#1e2024", "line": "rgba(255,255,255,0.08)", "line2": "rgba(255,255,255,0.15)", "tx1": "#f4f4f5", "tx2": "#a8adb8", "tx3": "#6b7078", "acc": "#8b93a3", "accTx": "#101113", "accSoft": "rgba(139,147,163,0.15)", "ok": "#3ddc97", "warn": "#ffc857", "danger": "#ff6b6b"},
    "zumrut": {"label": "Zümrüt", "bg0": "#0a110e", "bg1": "#0c1411", "bg2": "#101a15", "bg3": "#15221c", "line": "rgba(110,220,180,0.12)", "line2": "rgba(110,220,180,0.22)", "tx1": "#eefaf4", "tx2": "#9fbfb0", "tx3": "#5f7d6f", "acc": "#2fd39a", "accTx": "#04120c", "accSoft": "rgba(47,211,154,0.13)", "ok": "#3ddc97", "warn": "#ffc857", "danger": "#ff6b6b"},
    "mor": {"label": "Mor", "bg0": "#120e1b", "bg1": "#150f20", "bg2": "#1c1428", "bg3": "#241a33", "line": "rgba(190,140,255,0.13)", "line2": "rgba(190,140,255,0.24)", "tx1": "#f6f1fc", "tx2": "#bfaed6", "tx3": "#79688f", "acc": "#a86bff", "accTx": "#170a24", "accSoft": "rgba(168,107,255,0.16)", "ok": "#3ddc97", "warn": "#ffc857", "danger": "#ff6b6b"},
    "gunbatimi": {"label": "Gün Batımı", "bg0": "#170f0c", "bg1": "#1a1210", "bg2": "#221714", "bg3": "#2b1d18", "line": "rgba(255,170,110,0.14)", "line2": "rgba(255,170,110,0.25)", "tx1": "#fbf1ea", "tx2": "#d9b8a3", "tx3": "#8a6d5e", "acc": "#ff8a4c", "accTx": "#1a0d06", "accSoft": "rgba(255,138,76,0.16)", "ok": "#3ddc97", "warn": "#ffc857", "danger": "#ff6b6b"},
    "altin": {"label": "Altın", "bg0": "#14110a", "bg1": "#17130b", "bg2": "#1e190e", "bg3": "#262010", "line": "rgba(212,175,90,0.14)", "line2": "rgba(212,175,90,0.25)", "tx1": "#f9f4e7", "tx2": "#cdbb8e", "tx3": "#8a7c58", "acc": "#d4af5a", "accTx": "#1a1508", "accSoft": "rgba(212,175,90,0.16)", "ok": "#3ddc97", "warn": "#ffc857", "danger": "#ff6b6b"},
    "aydinlik": {"label": "Aydınlık", "bg0": "#eef1f6", "bg1": "#f7f9fc", "bg2": "#ffffff", "bg3": "#eef2f8", "line": "rgba(20,35,70,0.10)", "line2": "rgba(20,35,70,0.18)", "tx1": "#141a26", "tx2": "#4c5870", "tx3": "#8b95a8", "acc": "#2f6df6", "accTx": "#ffffff", "accSoft": "rgba(47,109,246,0.10)", "ok": "#13a06b", "warn": "#c98a12", "danger": "#d64545"},
    "buz": {"label": "Buz", "bg0": "#eef4f8", "bg1": "#f6fafc", "bg2": "#ffffff", "bg3": "#e9f2f6", "line": "rgba(20,90,120,0.10)", "line2": "rgba(20,90,120,0.19)", "tx1": "#0f1c24", "tx2": "#47606d", "tx3": "#84a0ac", "acc": "#0fb3c4", "accTx": "#ffffff", "accSoft": "rgba(15,179,196,0.12)", "ok": "#0f9c72", "warn": "#b9790f", "danger": "#c93f3f"},
}
LIVE_THEME_PREFIX = "live:"
THEME_KEYS = tuple(STATIC_THEMES.keys())
CUSTOM_LIVE_KEYS = tuple(CUSTOM_PRESETS.keys())


def preset_theme(preset: str) -> dict[str, str]:
    data = CUSTOM_PRESETS[preset]
    return {
        key: str(data[key])
        for key in ("label", "bg0", "bg1", "bg2", "bg3", "line", "line2", "tx1", "tx2", "tx3", "acc", "accTx", "accSoft", "panel")
    } | {"ok": "#3ddc97", "warn": "#ffc857", "danger": "#ff6b6b"}


def rgba_from_hex(hex_color: str, alpha: float) -> str:
    color = QColor(hex_color)
    if not color.isValid():
        return f"rgba(9,12,18,{alpha:.2f})"
    return f"rgba({color.red()},{color.green()},{color.blue()},{alpha:.2f})"


def qcolor(value: str, fallback: str = "#0b0e15") -> QColor:
    text = (value or "").strip()
    if text.startswith("rgba(") and text.endswith(")"):
        parts = [part.strip() for part in text[5:-1].split(",")]
        if len(parts) == 4:
            try:
                alpha = float(parts[3])
                if alpha <= 1:
                    alpha *= 255
                return QColor(int(parts[0]), int(parts[1]), int(parts[2]), max(0, min(255, int(alpha))))
            except ValueError:
                pass
    parsed = QColor(text)
    return parsed if parsed.isValid() else QColor(fallback)


ICON_PATHS = {
    "home": '<path d="m3 11 9-8 9 8"/><path d="M5 9.5V21h14V9.5"/>',
    "grid": '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    "refresh": '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    "user": '<circle cx="12" cy="8" r="4.5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    "settings": '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "minus": '<path d="M5 12h14"/>',
    "square": '<rect x="5" y="5" width="14" height="14" rx="1.5"/>',
    "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    "more": '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    "folder": '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z"/>',
    "trash": '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/>',
    "wrench": '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-3 3-3-3z"/>',
    "check": '<path d="m5 13 4 4L19 7"/>',
}


def line_icon(name: str, color: str = "#a9b6cd", size: int = 20) -> QIcon:
    paths = ICON_PATHS.get(name, ICON_PATHS["grid"])
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 24 24" '
        f'fill="none" stroke="{color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{paths}</svg>'
    )
    pixmap = QPixmap()
    pixmap.loadFromData(svg.encode("utf-8"), "SVG")
    return QIcon(pixmap)


def app_root() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def data_root() -> Path:
    return Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "ImlecYazilim"


def launcher_log_path() -> Path:
    return data_root() / "launcher_debug.log"


def log_debug(message: str) -> None:
    try:
        path = launcher_log_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().isoformat(timespec="seconds")
        with path.open("a", encoding="utf-8") as handle:
            handle.write(f"[{timestamp}] {message}\n")
    except Exception:
        pass


def safe_slug(slug: str) -> str:
    value = "".join(ch for ch in str(slug).lower().strip() if ch.isalnum() or ch in "-_")
    return value or "product"


def product_install_dir(slug: str) -> Path:
    return data_root() / "Products" / safe_slug(slug).upper()


def product_manifest_path(slug: str) -> Path:
    return product_install_dir(slug) / "imlec_product.json"


def product_exe_name(product: dict) -> str:
    explicit = str(product.get("executableName") or product.get("exeName") or "").strip()
    if explicit:
        return explicit
    slug = safe_slug(str(product.get("slug") or ""))
    return PRODUCT_EXE_NAMES.get(slug, f"{slug.upper()}.exe")


def product_exe_path(product: dict) -> Path:
    return product_install_dir(str(product.get("slug") or "")) / product_exe_name(product)


def product_display_shortcut_name(product: dict) -> str:
    slug = safe_slug(str(product.get("slug") or ""))
    if slug == "fis260":
        return "FIS260"
    return str(product.get("name") or slug.upper()).strip() or slug.upper()


def resource_path(*parts: str) -> Path:
    base = Path(getattr(sys, "_MEIPASS", app_root()))
    return base.joinpath(*parts)


def create_windows_shortcut(shortcut_path: Path, target_path: Path, working_dir: Path, icon_path: Path | None = None) -> None:
    if sys.platform != "win32":
        return
    try:
        shortcut_path.parent.mkdir(parents=True, exist_ok=True)
        import win32com.client

        shell = win32com.client.Dispatch("WScript.Shell")
        shortcut = shell.CreateShortCut(str(shortcut_path))
        shortcut.Targetpath = str(target_path)
        shortcut.WorkingDirectory = str(working_dir)
        if icon_path and icon_path.exists():
            shortcut.IconLocation = str(icon_path)
        shortcut.save()
        log_debug(f"shortcut_created path={shortcut_path} target={target_path}")
    except Exception as exc:
        log_debug(f"shortcut_create_error path={shortcut_path} error={exc}")


def create_product_shortcuts(product: dict) -> None:
    if sys.platform != "win32":
        return
    slug = safe_slug(str(product.get("slug") or ""))
    exe = product_exe_path(product)
    if not exe.is_file():
        return
    name = product_display_shortcut_name(product)
    icon = exe
    desktop_root = Path(os.environ.get("USERPROFILE", str(Path.home()))) / "Desktop"
    start_menu_root = (
        Path(os.environ.get("APPDATA", str(Path.home())))
        / "Microsoft"
        / "Windows"
        / "Start Menu"
        / "Programs"
    )
    try:
        import winreg

        with winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders",
        ) as key:
            desktop_root = Path(os.path.expandvars(str(winreg.QueryValueEx(key, "Desktop")[0])))
            start_menu_root = Path(os.path.expandvars(str(winreg.QueryValueEx(key, "Programs")[0])))
    except Exception as exc:
        log_debug(f"shortcut_shell_folder_fallback error={exc}")
    desktop = desktop_root / f"{name}.lnk"
    start_menu = start_menu_root / "İmleç Yazılım" / f"{name}.lnk"
    create_windows_shortcut(desktop, exe, exe.parent, icon)
    create_windows_shortcut(start_menu, exe, exe.parent, icon)
    log_debug(f"product_shortcuts_ready slug={slug} desktop={desktop} start_menu={start_menu}")


def _dpapi_blob(data: bytes):
    class DATA_BLOB(ctypes.Structure):
        _fields_ = [
            ("cbData", ctypes.c_ulong),
            ("pbData", ctypes.POINTER(ctypes.c_ubyte)),
        ]

    buffer = ctypes.create_string_buffer(data)
    return DATA_BLOB(len(data), ctypes.cast(buffer, ctypes.POINTER(ctypes.c_ubyte))), DATA_BLOB


def _dpapi_protect(text: str) -> str:
    if sys.platform != "win32" or not text:
        return text
    try:
        in_blob, blob_type = _dpapi_blob(text.encode("utf-8"))
        out_blob = blob_type()
        if not ctypes.windll.crypt32.CryptProtectData(
            ctypes.byref(in_blob),
            None,
            None,
            None,
            None,
            0,
            ctypes.byref(out_blob),
        ):
            return text
        try:
            encrypted = ctypes.string_at(out_blob.pbData, out_blob.cbData)
            return "dpapi:v1:" + base64.b64encode(encrypted).decode("ascii")
        finally:
            ctypes.windll.kernel32.LocalFree(out_blob.pbData)
    except Exception:
        return text


def _dpapi_unprotect(text: str) -> str:
    if not text.startswith("dpapi:v1:"):
        return text
    if sys.platform != "win32":
        return ""
    try:
        raw = base64.b64decode(text.split(":", 2)[2])
        in_blob, blob_type = _dpapi_blob(raw)
        out_blob = blob_type()
        if not ctypes.windll.crypt32.CryptUnprotectData(
            ctypes.byref(in_blob),
            None,
            None,
            None,
            None,
            0,
            ctypes.byref(out_blob),
        ):
            return ""
        try:
            return ctypes.string_at(out_blob.pbData, out_blob.cbData).decode("utf-8")
        finally:
            ctypes.windll.kernel32.LocalFree(out_blob.pbData)
    except Exception:
        return ""


def stable_device_fingerprint(settings: QSettings) -> str:
    parts: list[str] = []
    if sys.platform == "win32":
        try:
            import winreg

            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Cryptography") as key:
                machine_guid, _ = winreg.QueryValueEx(key, "MachineGuid")
                parts.append(str(machine_guid))
        except Exception:
            pass
    parts.extend([platform.node(), platform.machine(), platform.processor()])
    material = "|".join(part.strip().lower() for part in parts if str(part).strip())
    if material:
        device_id = hashlib.sha256(f"fis260-device-v1|{material}".encode("utf-8")).hexdigest()
    else:
        device_id = str(settings.value("auth/device_id", "") or "").strip()
        if not device_id:
            device_id = str(uuid.uuid4())
    settings.setValue("auth/device_id", device_id)
    settings.sync()
    return device_id


def read_installed_version(slug: str) -> str:
    path = product_manifest_path(slug)
    if not path.is_file():
        return ""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return ""
    return str(data.get("version") or "").strip()


def is_newer_version(candidate: str, current: str) -> bool:
    def parts(value: str) -> tuple[int, ...]:
        result = []
        for item in str(value).replace("-", ".").split("."):
            digits = "".join(ch for ch in item if ch.isdigit())
            if digits:
                result.append(int(digits))
        return tuple(result or [0])

    left = list(parts(candidate))
    right = list(parts(current))
    width = max(len(left), len(right))
    left.extend([0] * (width - len(left)))
    right.extend([0] * (width - len(right)))
    return tuple(left) > tuple(right)


def clear_layout(layout) -> None:
    while layout.count():
        item = layout.takeAt(0)
        widget = item.widget()
        child_layout = item.layout()
        if widget is not None:
            widget.deleteLater()
        elif child_layout is not None:
            clear_layout(child_layout)


def friendly_error(exc: Exception) -> str:
    if isinstance(exc, requests.HTTPError) and exc.response is not None:
        status = exc.response.status_code
        url = exc.response.url
        if status == 401:
            if "/api/desktop-auth/login" in url:
                return "E-posta veya şifre hatalı. Bilgileri kontrol edip tekrar deneyin."
            return "Oturum süreniz doldu. Lütfen yeniden giriş yapın."
        if status == 404 and "/api/desktop/products" in url:
            return (
                "Canlı site henüz launcher ürün endpoint'ini içermiyor.\n\n"
                "Çözüm: imlec-site değişikliklerini Vercel'e deploy edip veritabanı migration'ını çalıştırın."
            )
        return f"Sunucu {status} yanıtı verdi.\n{url}"
    return str(exc)


def is_authentication_error(exc: Exception) -> bool:
    return (
        isinstance(exc, requests.HTTPError)
        and exc.response is not None
        and exc.response.status_code == 401
    )


class ApiClient:
    def __init__(self, settings: QSettings):
        self.settings = settings
        self.current_token = ""

    def token(self) -> str:
        if self.current_token:
            return self.current_token
        stored = str(self.settings.value("auth/token", "") or "").strip()
        token = _dpapi_unprotect(stored)
        if token and stored and not stored.startswith("dpapi:v1:"):
            self.settings.setValue("auth/token", _dpapi_protect(token))
            self.settings.sync()
        self.current_token = token
        return token

    def set_token(self, token: str, email: str, remember: bool) -> None:
        self.current_token = token
        if remember:
            self.settings.setValue("auth/token", _dpapi_protect(token))
            self.settings.setValue("auth/email", email)
            self.settings.setValue("auth/remember", True)
        else:
            self.settings.remove("auth/token")
            self.settings.remove("auth/email")
            self.settings.setValue("auth/remember", False)
        self.settings.sync()

    def clear_token(self) -> None:
        self.current_token = ""
        self.settings.remove("auth/token")
        self.settings.remove("auth/email")
        self.settings.remove("auth/remember")
        self.settings.sync()

    def expire_token(self) -> None:
        self.current_token = ""
        self.settings.remove("auth/token")
        self.settings.sync()

    def login(self, email: str, password: str) -> dict:
        response = requests.post(
            f"{AUTH_BASE_URL}/api/desktop-auth/login",
            json={"email": email, "password": password},
            timeout=20,
        )
        if response.status_code == 401:
            log_debug(f"login_failed status=401 email={email}")
        response.raise_for_status()
        payload = response.json()
        token = payload.get("desktopToken") or payload.get("token") or payload.get("accessToken")
        if not token:
            raise RuntimeError("Sunucu oturum anahtarı döndürmedi.")
        payload["desktopToken"] = token
        return payload

    def device_headers(self) -> dict[str, str]:
        installed_fis260 = read_installed_version("fis260")
        return {
            "X-Imlec-Device-Id": stable_device_fingerprint(self.settings),
            "X-Imlec-Device-Name": socket.gethostname(),
            "X-Imlec-OS": platform.platform(),
            "X-Imlec-App-Version": LAUNCHER_VERSION,
            "X-Imlec-Product-Version": installed_fis260,
        }

    def register_fis260_device(self) -> None:
        token = self.token()
        if not token:
            return
        installed_fis260 = read_installed_version("fis260")
        try:
            requests.post(
                f"{AUTH_BASE_URL}/api/desktop-auth/device/register",
                json={
                    "deviceId": stable_device_fingerprint(self.settings),
                    "deviceName": socket.gethostname(),
                    "os": platform.platform(),
                    "appVersion": installed_fis260,
                    "launcherVersion": LAUNCHER_VERSION,
                },
                headers={"Authorization": f"Bearer {token}"},
                timeout=15,
            )
        except Exception:
            pass

    def products(self) -> dict:
        token = self.token()
        if not token:
            raise RuntimeError("Oturum bulunamadı.")
        self.register_fis260_device()
        response = requests.get(
            f"{AUTH_BASE_URL}/api/desktop/products",
            headers={"Authorization": f"Bearer {token}", **self.device_headers()},
            timeout=20,
        )
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            raise RuntimeError("Ürün listesi okunamadı.")
        return payload

    def announcements(self) -> list[dict]:
        try:
            response = requests.get(f"{AUTH_BASE_URL}/api/desktop/announcements?target=launcher", timeout=10)
            response.raise_for_status()
            payload = response.json()
            announcements = payload.get("announcements") if isinstance(payload, dict) else []
            return announcements if isinstance(announcements, list) else []
        except Exception as exc:
            log_debug(f"announcement_fetch_error error={exc}")
            return []


class ProductInstallWorker(QObject):
    progress = Signal(str, int, str)
    finished = Signal(str, dict)
    error = Signal(str, str)

    def __init__(self, product: dict):
        super().__init__()
        self.product = dict(product)
        self.slug = safe_slug(str(self.product.get("slug") or ""))

    def run(self):
        try:
            download_url = str(self.product.get("downloadUrl") or "").strip()
            sha256 = str(self.product.get("sha256") or "").strip().lower()
            version = str(self.product.get("latestVersion") or "").strip()
            log_debug(
                f"product_install_start slug={self.slug} version={version or '-'} "
                f"download_url={download_url or '-'}"
            )
            if not download_url or not sha256 or not version:
                raise RuntimeError("İndirme paketi bilgisi eksik.")

            work_dir = data_root() / "Downloads"
            work_dir.mkdir(parents=True, exist_ok=True)
            package_path = work_dir / f"{self.slug}-{version}.zip"
            temp_path = package_path.with_suffix(".zip.part")
            digest = hashlib.sha256()
            log_debug(f"product_install_paths slug={self.slug} package_path={package_path} temp_path={temp_path}")

            self.progress.emit(self.slug, 3, "Paket indiriliyor")
            response = requests.get(download_url, stream=True, timeout=(10, 90))
            log_debug(
                f"product_download_response slug={self.slug} status={response.status_code} "
                f"final_url={response.url} content_length={response.headers.get('content-length') or '-'}"
            )
            try:
                response.raise_for_status()
            except requests.HTTPError as exc:
                raise RuntimeError(f"İndirme başarısız. HTTP {response.status_code}: {response.url}") from exc
            total = int(response.headers.get("content-length") or 0)
            done = 0
            with temp_path.open("wb") as handle:
                for chunk in response.iter_content(chunk_size=1024 * 1024):
                    if not chunk:
                        continue
                    handle.write(chunk)
                    digest.update(chunk)
                    done += len(chunk)
                    if total:
                        percent = 3 + int(done * 62 / total)
                        self.progress.emit(self.slug, min(percent, 65), "Paket indiriliyor")
            if not total:
                self.progress.emit(self.slug, 65, "Paket indirildi")

            actual = digest.hexdigest().lower()
            if actual != sha256:
                temp_path.unlink(missing_ok=True)
                log_debug(
                    f"product_download_sha_mismatch slug={self.slug} expected={sha256} "
                    f"actual={actual} path={temp_path}"
                )
                raise RuntimeError("İndirilen paket doğrulanamadı.")
            if package_path.exists():
                package_path.unlink()
            temp_path.replace(package_path)
            log_debug(f"product_download_complete slug={self.slug} path={package_path} sha256={actual}")

            install_dir = product_install_dir(self.slug)
            backup_dir = install_dir.with_name(f"{install_dir.name}_backup")
            extract_dir = Path(tempfile.mkdtemp(prefix=f"imlec_{self.slug}_"))
            backup_created = False
            self.progress.emit(self.slug, 72, "Paket açılıyor")
            try:
                with zipfile.ZipFile(package_path, "r") as archive:
                    archive.extractall(extract_dir)

                exe_name = product_exe_name(self.product)
                source = extract_dir / self.slug.upper()
                if not source.is_dir():
                    source = extract_dir / str(self.product.get("name") or "").strip()
                if not source.is_dir():
                    source = extract_dir

                exe = source / exe_name
                if not exe.is_file():
                    matches = list(extract_dir.rglob(exe_name))
                    if matches:
                        source = matches[0].parent
                        exe = matches[0]
                if not exe.is_file():
                    raise RuntimeError(f"Paket içinde {exe_name} bulunamadı.")

                if backup_dir.exists():
                    shutil.rmtree(backup_dir, ignore_errors=True)
                if install_dir.exists():
                    try:
                        install_dir.rename(backup_dir)
                        backup_created = True
                    except PermissionError as exc:
                        raise RuntimeError(
                            f"{str(self.product.get('name') or self.slug).strip()} açık. "
                            "Uygulamayı kapatıp Güncelle düğmesine tekrar basın."
                        ) from exc
                install_dir.parent.mkdir(parents=True, exist_ok=True)
                shutil.copytree(source, install_dir)
                manifest = {
                    "slug": self.slug,
                    "name": str(self.product.get("name") or self.slug),
                    "version": version,
                    "sha256": sha256,
                    "exeName": exe_name,
                }
                product_manifest_path(self.slug).write_text(
                    json.dumps(manifest, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
                create_product_shortcuts(self.product)
                shutil.rmtree(backup_dir, ignore_errors=True)
                log_debug(f"product_install_complete slug={self.slug} install_dir={install_dir} exe={exe_name}")
            except Exception:
                if backup_created:
                    if install_dir.exists():
                        shutil.rmtree(install_dir, ignore_errors=True)
                    if backup_dir.exists():
                        backup_dir.rename(install_dir)
                raise
            finally:
                shutil.rmtree(extract_dir, ignore_errors=True)

            self.progress.emit(self.slug, 100, "Hazır")
            self.finished.emit(self.slug, {"version": version})
        except Exception as exc:
            log_debug(f"product_install_error slug={self.slug} error={exc}\n{traceback.format_exc()}")
            self.error.emit(self.slug, str(exc))


class LauncherSelfUpdateWorker(QObject):
    progress = Signal(int, str)
    finished = Signal()
    error = Signal(str)

    def __init__(self, product: dict):
        super().__init__()
        self.product = dict(product)

    def run(self):
        try:
            download_url = str(self.product.get("downloadUrl") or "").strip()
            sha256 = str(self.product.get("sha256") or "").strip().lower()
            version = str(self.product.get("latestVersion") or "").strip()
            if not download_url or not sha256 or not version:
                raise RuntimeError("Launcher güncelleme paketi bilgisi eksik.")

            work_dir = data_root() / "Downloads"
            work_dir.mkdir(parents=True, exist_ok=True)
            package_path = work_dir / f"launcher-{version}.zip"
            temp_path = package_path.with_suffix(".zip.part")
            digest = hashlib.sha256()

            self.progress.emit(5, "Launcher güncellemesi indiriliyor")
            response = requests.get(download_url, stream=True, timeout=(10, 90))
            response.raise_for_status()
            total = int(response.headers.get("content-length") or 0)
            done = 0
            with temp_path.open("wb") as handle:
                for chunk in response.iter_content(chunk_size=1024 * 1024):
                    if not chunk:
                        continue
                    handle.write(chunk)
                    digest.update(chunk)
                    done += len(chunk)
                    if total:
                        self.progress.emit(min(85, 5 + int(done * 80 / total)), "Launcher güncellemesi indiriliyor")

            actual = digest.hexdigest().lower()
            if actual != sha256:
                temp_path.unlink(missing_ok=True)
                raise RuntimeError("Launcher güncelleme paketi doğrulanamadı.")
            if package_path.exists():
                package_path.unlink()
            temp_path.replace(package_path)

            updater = app_root() / "ImlecLauncherUpdater.exe"
            if not updater.is_file():
                raise RuntimeError("Launcher güncelleme yardımcısı bulunamadı.")

            update_run_dir = data_root() / "Updates" / f"_launcher_updater_{int(time.time())}"
            update_run_dir.mkdir(parents=True, exist_ok=True)
            temp_updater = update_run_dir / updater.name
            shutil.copy2(updater, temp_updater)
            log_debug(f"launcher_update_helper_copied source={updater} target={temp_updater}")

            self.progress.emit(95, "Launcher yeniden başlatmaya hazırlanıyor")
            subprocess.Popen(
                [
                    str(temp_updater),
                    "--package",
                    str(package_path),
                    "--install-dir",
                    str(app_root()),
                    "--exe-name",
                    Path(sys.executable).name if getattr(sys, "frozen", False) else "ImlecLauncher.exe",
                    "--parent-pid",
                    str(os.getpid()),
                ],
                cwd=str(update_run_dir),
                close_fds=True,
            )
            self.finished.emit()
        except Exception as exc:
            self.error.emit(str(exc))


class RefreshWorker(QObject):
    finished = Signal(dict, list)
    error = Signal(str, bool)

    def __init__(self, api: ApiClient):
        super().__init__()
        self.api = api

    def run(self):
        try:
            self.finished.emit(self.api.products(), self.api.announcements())
        except Exception as exc:
            self.error.emit(friendly_error(exc), is_authentication_error(exc))


class ImageFetchWorker(QObject):
    finished = Signal(str, object)

    def __init__(self, url: str):
        super().__init__()
        self.url = url

    def run(self):
        try:
            response = requests.get(self.url, timeout=8)
            response.raise_for_status()
            self.finished.emit(self.url, response.content)
        except Exception:
            self.finished.emit(self.url, b"")


class RefreshToolButton(QToolButton):
    """Yenile butonu: tiklaninca vurgu renginde puruzsuz donen yay (16ms kare araligi).
    Yenileme cok hizli bitse bile animasyon en az 0.7 sn gorunur kalir."""

    MIN_SPIN_SECONDS = 0.7

    def __init__(self):
        super().__init__()
        self.setObjectName("iconButton")
        self.setToolTip("Yenile")
        self.setIconSize(QSize(18, 18))
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.accent = QColor("#4d91ff")
        self.idle_icon = QIcon()
        self.angle = 0.0
        self.spinning = False
        self.stop_requested = False
        self.spin_started = 0.0
        self.timer = QTimer(self)
        self.timer.setInterval(16)
        self.timer.timeout.connect(self.rotate)

    def set_accent(self, color: str):
        parsed = QColor(color)
        if parsed.isValid():
            self.accent = parsed

    def set_idle_icon(self, icon: QIcon):
        self.idle_icon = icon
        if not self.spinning:
            self.setIcon(icon)

    def start_spin(self):
        self.stop_requested = False
        if self.spinning:
            return
        self.spinning = True
        self.spin_started = time.monotonic()
        self.setIcon(QIcon())
        self.timer.start()

    def stop_spin(self):
        self.stop_requested = True

    def rotate(self):
        self.angle = (self.angle + 9.0) % 360.0
        if self.stop_requested and time.monotonic() - self.spin_started >= self.MIN_SPIN_SECONDS:
            self.timer.stop()
            self.spinning = False
            self.stop_requested = False
            self.angle = 0.0
            self.setIcon(self.idle_icon)
        self.update()

    def paintEvent(self, event):
        super().paintEvent(event)
        if not self.spinning:
            return
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        painter.setPen(QPen(self.accent, 2.2, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        rect = self.rect().adjusted(11, 11, -11, -11)
        painter.drawArc(rect, int(-self.angle * 16), int(275 * 16))


class GearButton(QToolButton):
    """Ayarlar butonu: fare uzerine gelince disli yumusakca doner."""

    def __init__(self):
        super().__init__()
        self.setObjectName("iconButton")
        self.setToolTip("Ayarlar")
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.gear_pixmap = QPixmap()
        self.rotation = 0.0
        self.anim = QVariantAnimation(self)
        self.anim.setDuration(340)
        self.anim.setEasingCurve(QEasingCurve.Type.OutCubic)
        self.anim.valueChanged.connect(self.on_rotation)

    def on_rotation(self, value):
        self.rotation = float(value)
        self.update()

    def animate_to(self, target: float):
        self.anim.stop()
        self.anim.setStartValue(self.rotation)
        self.anim.setEndValue(target)
        self.anim.start()

    def apply_icon_color(self, color: str):
        self.gear_pixmap = line_icon("settings", color, 20).pixmap(20, 20)
        self.update()

    def enterEvent(self, event):
        self.animate_to(60.0)
        super().enterEvent(event)

    def leaveEvent(self, event):
        self.animate_to(0.0)
        super().leaveEvent(event)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.animate_to(self.rotation + 120.0)
        super().mousePressEvent(event)

    def paintEvent(self, event):
        super().paintEvent(event)
        if self.gear_pixmap.isNull():
            return
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        painter.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform, True)
        painter.translate(self.width() / 2, self.height() / 2)
        painter.rotate(self.rotation)
        painter.drawPixmap(-10, -10, self.gear_pixmap)


class IconButton(QToolButton):
    def __init__(self, icon_name: str, tooltip: str):
        super().__init__()
        self.icon_name = icon_name
        self.setObjectName("iconButton")
        self.setToolTip(tooltip)
        self.setIconSize(QSize(18, 18))
        self.setCursor(Qt.CursorShape.PointingHandCursor)

    def apply_icon_color(self, color: str):
        self.setIcon(line_icon(self.icon_name, color, 20))


class ColorSwatchButton(QPushButton):
    def __init__(self, color: QColor, tooltip: str):
        super().__init__()
        self.swatch = color
        self.hovered = False
        self.setObjectName("swatchButton")
        self.setCheckable(True)
        self.setToolTip(tooltip)
        self.setFixedSize(26, 26)
        self.setCursor(Qt.CursorShape.PointingHandCursor)

    def enterEvent(self, event):
        self.hovered = True
        self.update()
        super().enterEvent(event)

    def leaveEvent(self, event):
        self.hovered = False
        self.update()
        super().leaveEvent(event)

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        rect = QRectF(self.rect()).adjusted(2.5, 2.5, -2.5, -2.5)
        if self.hovered:
            rect = rect.adjusted(-1, -1, 1, 1)
        painter.setBrush(self.swatch)
        painter.setPen(QPen(QColor("#f4f7ff") if self.isChecked() else QColor(0, 0, 0, 46), 2 if self.isChecked() else 1))
        painter.drawEllipse(rect)


class TitleBar(QFrame):
    def __init__(self, window: QMainWindow):
        super().__init__()
        self.window = window
        self.drag_pos: QPoint | None = None
        self.setObjectName("titleBar")
        self.setFixedHeight(38)
        layout = QHBoxLayout(self)
        layout.setContentsMargins(14, 0, 6, 0)
        layout.setSpacing(8)
        logo = QLabel()
        logo.setFixedSize(18, 18)
        pixmap = QPixmap(str(resource_path("assets", "branding", "imlec-yazilim-logo-mark.png")))
        if pixmap.isNull():
            pixmap = QPixmap(str(resource_path("assets", "branding", "imlec-yazilim.ico")))
        if not pixmap.isNull():
            logo.setPixmap(pixmap.scaled(18, 18, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation))
        title = QLabel("İmleç Yazılım")
        title.setObjectName("titleText")
        layout.addWidget(logo)
        layout.addWidget(title)
        layout.addStretch(1)
        self.window_buttons: list[QToolButton] = []
        for icon_name, tooltip, handler in (
            ("minus", "Küçült", window.showMinimized),
            ("square", "Büyüt", self.toggle_maximized),
            ("x", "Kapat", window.close),
        ):
            button = QToolButton()
            button.setObjectName("windowButton")
            button.setToolTip(tooltip)
            button.setIconSize(QSize(17, 17))
            button.clicked.connect(handler)
            if icon_name == "x":
                button.setProperty("danger", True)
            button.setProperty("iconName", icon_name)
            self.window_buttons.append(button)
            layout.addWidget(button)

    def apply_icon_color(self, color: str):
        for button in self.window_buttons:
            icon_name = str(button.property("iconName") or "square")
            button.setIcon(line_icon(icon_name, color, 18))

    def toggle_maximized(self):
        self.window.showNormal() if self.window.isMaximized() else self.window.showMaximized()

    def mousePressEvent(self, event: QMouseEvent):
        if event.button() == Qt.MouseButton.LeftButton:
            self.drag_pos = event.globalPosition().toPoint() - self.window.frameGeometry().topLeft()
            event.accept()
            return
        super().mousePressEvent(event)

    def mouseMoveEvent(self, event: QMouseEvent):
        if self.drag_pos is not None and event.buttons() & Qt.MouseButton.LeftButton and not self.window.isMaximized():
            self.window.move(event.globalPosition().toPoint() - self.drag_pos)
            event.accept()
            return
        super().mouseMoveEvent(event)

    def mouseReleaseEvent(self, event: QMouseEvent):
        self.drag_pos = None
        super().mouseReleaseEvent(event)


class HeroBanner(QFrame):
    hoverChanged = Signal(bool)
    prevRequested = Signal()
    nextRequested = Signal()

    def __init__(self):
        super().__init__()
        self.setObjectName("heroBanner")
        self.setMinimumHeight(330)
        self.setMouseTracking(True)
        self.pixmap = QPixmap()
        self.palette = STATIC_THEMES[DEFAULT_THEME]
        self.arrows_available = False
        self.prev_button = QToolButton(self)
        self.next_button = QToolButton(self)
        for button, icon_name, handler in (
            (self.prev_button, "chevron-left", self.prevRequested),
            (self.next_button, "chevron-right", self.nextRequested),
        ):
            button.setObjectName("heroArrow")
            button.setFixedSize(38, 38)
            button.setCursor(Qt.CursorShape.PointingHandCursor)
            button.setIcon(line_icon(icon_name, "#dfe8f8", 18))
            button.setIconSize(QSize(18, 18))
            button.clicked.connect(handler.emit)
            button.hide()

    def set_theme(self, palette: dict[str, str]):
        self.palette = palette
        self.update()

    def set_pixmap(self, pixmap: QPixmap):
        self.pixmap = pixmap
        self.update()

    def set_arrows_available(self, available: bool):
        self.arrows_available = available
        if not available:
            self.prev_button.hide()
            self.next_button.hide()

    def position_arrows(self):
        y = (self.height() - 38) // 2
        self.prev_button.move(14, y)
        self.next_button.move(self.width() - 14 - 38, y)
        self.prev_button.raise_()
        self.next_button.raise_()

    def resizeEvent(self, event):
        super().resizeEvent(event)
        self.position_arrows()

    def enterEvent(self, event):
        if self.arrows_available:
            self.position_arrows()
            self.prev_button.show()
            self.next_button.show()
        self.hoverChanged.emit(True)
        super().enterEvent(event)

    def leaveEvent(self, event):
        self.prev_button.hide()
        self.next_button.hide()
        self.hoverChanged.emit(False)
        super().leaveEvent(event)

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        rect = QRectF(self.rect()).adjusted(0.5, 0.5, -0.5, -0.5)
        path = QPainterPath()
        path.addRoundedRect(rect, 16, 16)
        painter.setClipPath(path)
        if not self.pixmap.isNull():
            scaled = self.pixmap.scaled(
                int(rect.width()),
                int(rect.height()),
                Qt.AspectRatioMode.KeepAspectRatioByExpanding,
                Qt.TransformationMode.SmoothTransformation,
            )
            x = int((rect.width() - scaled.width()) / 2)
            y = int((rect.height() - scaled.height()) / 2)
            painter.drawPixmap(x, y, scaled)
        else:
            gradient = QLinearGradient(rect.topLeft(), rect.bottomRight())
            gradient.setColorAt(0, QColor(str(self.palette["bg0"])))
            gradient.setColorAt(0.45, QColor("#101b2c"))
            gradient.setColorAt(1, QColor(str(self.palette["bg2"])))
            painter.fillPath(path, gradient)
            for i, color in enumerate(("#4d91ff", "#7a6cff", "#4aaaff")):
                center = QPointF(rect.width() * (0.20 + i * 0.28), rect.height() * (0.18 + i * 0.16))
                glow = QRadialGradient(center, rect.height() * 0.55)
                base = QColor(color)
                glow.setColorAt(0, QColor(base.red(), base.green(), base.blue(), 50))
                glow.setColorAt(1, QColor(base.red(), base.green(), base.blue(), 0))
                painter.fillRect(rect, glow)
        shade = QLinearGradient(rect.topLeft(), rect.bottomLeft())
        shade.setColorAt(0.0, QColor(5, 8, 14, 18))
        shade.setColorAt(0.58, QColor(5, 8, 14, 140))
        shade.setColorAt(1.0, QColor(5, 8, 14, 230))
        painter.fillPath(path, shade)
        painter.setClipping(False)
        painter.setPen(QPen(qcolor(str(self.palette["line2"]), "#566277"), 1))
        painter.drawRoundedRect(rect, 16, 16)


class ClickableFrame(QFrame):
    clicked = Signal()

    def mousePressEvent(self, event: QMouseEvent):
        if event.button() == Qt.MouseButton.LeftButton:
            self.clicked.emit()
            event.accept()
            return
        super().mousePressEvent(event)


class DotsIndicator(QWidget):
    dotClicked = Signal(int)

    DOT = 6
    ACTIVE_WIDTH = 18
    GAP = 6

    def __init__(self):
        super().__init__()
        self.count = 0
        self.index = 0
        self.setFixedHeight(10)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.refresh_width()

    def set_state(self, count: int, index: int):
        self.count = max(0, count)
        self.index = max(0, min(index, self.count - 1)) if self.count else 0
        self.refresh_width()
        self.update()

    def refresh_width(self):
        if self.count <= 0:
            self.setFixedWidth(0)
            return
        self.setFixedWidth((self.count - 1) * (self.DOT + self.GAP) + self.ACTIVE_WIDTH)

    def dot_spans(self) -> list[tuple[float, float]]:
        spans = []
        x = 0.0
        for i in range(self.count):
            width = self.ACTIVE_WIDTH if i == self.index else self.DOT
            spans.append((x, width))
            x += width + self.GAP
        return spans

    def mousePressEvent(self, event: QMouseEvent):
        for i, (x, width) in enumerate(self.dot_spans()):
            if x - self.GAP / 2 <= event.position().x() <= x + width + self.GAP / 2:
                self.dotClicked.emit(i)
                return

    def paintEvent(self, event):
        if self.count <= 0:
            return
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        painter.setPen(Qt.PenStyle.NoPen)
        y = (self.height() - self.DOT) / 2
        for i, (x, width) in enumerate(self.dot_spans()):
            painter.setBrush(QColor(255, 255, 255, 255 if i == self.index else 90))
            painter.drawRoundedRect(QRectF(x, y, width, self.DOT), 3, 3)


class ToggleSwitch(QWidget):
    toggled = Signal(bool)

    def __init__(self, checked: bool = False):
        super().__init__()
        self.checked = bool(checked)
        self.acc = QColor("#4d91ff")
        self.acc_tx = QColor("#0b1220")
        self.track = QColor("#171d2e")
        self.border = QColor(148, 170, 220, 51)
        self.knob = QColor("#68758d")
        self.setFixedSize(40, 22)
        self.setCursor(Qt.CursorShape.PointingHandCursor)

    def set_colors(self, palette: dict[str, str]):
        self.acc = qcolor(palette["acc"])
        self.acc_tx = qcolor(palette["accTx"])
        self.track = qcolor(palette["bg3"])
        self.border = qcolor(palette["line2"])
        self.knob = qcolor(palette["tx3"])
        self.update()

    def setChecked(self, checked: bool):
        self.checked = bool(checked)
        self.update()

    def isChecked(self) -> bool:
        return self.checked

    def mousePressEvent(self, event: QMouseEvent):
        if event.button() == Qt.MouseButton.LeftButton:
            self.checked = not self.checked
            self.update()
            self.toggled.emit(self.checked)
            event.accept()
            return
        super().mousePressEvent(event)

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        rect = QRectF(self.rect()).adjusted(0.5, 0.5, -0.5, -0.5)
        if self.checked:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(self.acc)
        else:
            painter.setPen(QPen(self.border, 1))
            painter.setBrush(self.track)
        painter.drawRoundedRect(rect, rect.height() / 2, rect.height() / 2)
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(self.acc_tx if self.checked else self.knob)
        x = self.width() - 19 if self.checked else 3
        painter.drawEllipse(QRectF(x, 3, 16, 16))


class AvatarButton(QToolButton):
    def __init__(self):
        super().__init__()
        self.setObjectName("iconButton")
        self.setToolTip("Hesap menüsü")
        self.setFixedSize(38, 38)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.initial = "İ"
        self.soft = QColor(77, 145, 255, 36)
        self.acc = QColor("#4d91ff")

    def set_initial(self, initial: str):
        self.initial = (initial or "İ")[:1].upper()
        self.update()

    def set_colors(self, palette: dict[str, str]):
        self.soft = qcolor(palette["accSoft"])
        self.acc = qcolor(palette["acc"])
        self.update()

    def paintEvent(self, event):
        super().paintEvent(event)
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        rect = QRectF((self.width() - 26) / 2, (self.height() - 26) / 2, 26, 26)
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(self.soft)
        painter.drawRoundedRect(rect, 7, 7)
        painter.setPen(self.acc)
        font = self.font()
        font.setPixelSize(12)
        font.setWeight(QFont.Weight.Bold)
        painter.setFont(font)
        painter.drawText(rect, Qt.AlignmentFlag.AlignCenter, self.initial)


class StatusDot(QWidget):
    def __init__(self, color: str = "#3ddc97"):
        super().__init__()
        self.color = QColor(color)
        self.setFixedSize(7, 7)

    def set_color(self, color: str):
        parsed = QColor(color)
        if parsed.isValid():
            self.color = parsed
            self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(self.color)
        painter.drawEllipse(QRectF(0, 0, 7, 7))


class LivePreviewFrame(QFrame):
    def __init__(self, kind: str, value: str):
        super().__init__()
        self.setObjectName("themePreview")
        self.setFixedHeight(74)
        self.kind = kind
        self.value = value
        self.bg: QWidget | None = None
        if kind == "custom":
            self.bg = CustomLiveBackground(self, preview=True)
            self.bg.set_preset(value)  # type: ignore[attr-defined]
        elif kind == "engine" and value != "off":
            self.bg = LivingBackground(self, preview=True)
            self.bg.configure(atmosphere=value, color_name="mavi", intensity=0.9)  # type: ignore[attr-defined]

    def resizeEvent(self, event):
        super().resizeEvent(event)
        if self.bg is not None:
            self.bg.setGeometry(self.rect())

    def set_engine_theme(self, color_name: str, intensity: float):
        if self.kind == "engine" and self.bg is not None and hasattr(self.bg, "configure"):
            self.bg.configure(atmosphere=self.value, color_name=color_name, intensity=intensity)  # type: ignore[attr-defined]

    def set_reduce_motion(self, reduce: bool):
        if self.bg is not None and hasattr(self.bg, "set_reduce_motion"):
            self.bg.set_reduce_motion(reduce)  # type: ignore[attr-defined]


class OffPreviewFrame(QFrame):
    def __init__(self):
        super().__init__()
        self.setObjectName("themePreview")
        self.setFixedHeight(74)

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        painter.fillRect(self.rect(), QColor("#171d2e"))
        center = QPointF(self.width() / 2, self.height() / 2)
        painter.setPen(QPen(QColor("#8ea3c8"), 1.5))
        painter.setBrush(Qt.BrushStyle.NoBrush)
        painter.drawEllipse(center, 6, 6)
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QColor("#8ea3c8"))
        painter.drawPie(QRectF(center.x() - 6, center.y() - 6, 12, 12), 90 * 16, 180 * 16)


class ThemeTile(ClickableFrame):
    def __init__(self, label: str, subtitle: str, preview: QWidget | None = None):
        super().__init__()
        self.setObjectName("themeTile")
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setProperty("selected", False)
        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.setMinimumWidth(0)
        self.setMinimumHeight(108)
        self.setMaximumHeight(108)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)
        if preview is not None:
            layout.addWidget(preview)
        text_box = QFrame()
        text_box.setObjectName("themeTileLabel")
        text_box.setFixedHeight(33)
        text_layout = QVBoxLayout(text_box)
        text_layout.setContentsMargins(11, 0, 11, 0)
        text_layout.setSpacing(0)
        title = QLabel(label)
        title.setObjectName("themeTileTitle")
        title.setMinimumWidth(0)
        title_row = QHBoxLayout()
        title_row.setSpacing(6)
        title_row.addWidget(title)
        title_row.addStretch(1)
        if subtitle == "Canlı":
            live = QLabel("CANLI")
            live.setObjectName("livePill")
            live.setFixedSize(40, 15)
            live.setAlignment(Qt.AlignmentFlag.AlignCenter)
            title_row.addWidget(live)
        else:
            sub = QLabel(subtitle)
            sub.setObjectName("themeTileSubtitle")
            title_row.addWidget(sub)
        text_layout.addLayout(title_row)
        layout.addWidget(text_box)

    def set_selected(self, selected: bool):
        self.setProperty("selected", selected)
        self.style().unpolish(self)
        self.style().polish(self)


class LauncherWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowFlag(Qt.WindowType.FramelessWindowHint, True)
        self.setMouseTracking(True)
        self.settings = QSettings("ImlecYazilim", "Launcher")
        self.api = ApiClient(self.settings)
        self.products: list[dict] = []
        self.product_widgets: dict[str, dict[str, QWidget]] = {}
        self.product_cards: dict[str, QFrame] = {}
        self.worker_thread: QThread | None = None
        self.worker: ProductInstallWorker | None = None
        self.launcher_update_thread: QThread | None = None
        self.launcher_update_worker: LauncherSelfUpdateWorker | None = None
        self.refresh_thread: QThread | None = None
        self.refresh_worker: RefreshWorker | None = None
        self.image_threads: dict[str, QThread] = {}
        self.image_workers: dict[str, ImageFetchWorker] = {}
        self.announcements: list[dict] = []
        self.announcement_index = 0
        self.announcement_images: dict[str, QPixmap] = {}
        self.announcement_progress = 0
        self.hero_hovered = False
        self.theme_name = str(self.settings.value("appearance/theme", DEFAULT_THEME) or DEFAULT_THEME)
        if self.theme_name not in STATIC_THEMES:
            self.theme_name = DEFAULT_THEME
        self.live_kind = str(self.settings.value("appearance/live_kind", "none") or "none")
        self.custom_live = str(self.settings.value("appearance/custom_live", "aurora") or "aurora")
        self.rev9_atmosphere = str(self.settings.value("appearance/rev9_atmosphere", "off") or "off")
        self.rev9_color = str(self.settings.value("appearance/rev9_color", "mavi") or "mavi")
        self.rev9_intensity = float(self.settings.value("appearance/rev9_intensity", 1.0) or 1.0)
        if self.live_kind not in {"none", "custom", "engine"}:
            self.live_kind = "none"
        if self.custom_live not in CUSTOM_PRESETS:
            self.custom_live = "aurora"
        if self.rev9_atmosphere not in {key for key, _label in REV9_ATMOSPHERES}:
            self.rev9_atmosphere = "off"
        if self.rev9_color not in REV9_PALETTES:
            self.rev9_color = "mavi"
        if self.live_kind == "engine" and self.rev9_atmosphere == "off":
            self.live_kind = "none"
        self.reduce_motion = bool(self.settings.value("appearance/reduce_motion", False, type=bool))
        self.theme_tiles: dict[str, ThemeTile] = {}
        self.custom_tiles: dict[str, ThemeTile] = {}
        self.rev9_tiles: dict[str, ThemeTile] = {}
        self.rev9_color_buttons: dict[str, QPushButton] = {}
        self.rev9_intensity_buttons: dict[float, QPushButton] = {}
        self.icon_buttons: list[IconButton] = []
        self.nav_icons: dict[str, str] = {}
        self.announcement_timer = QTimer(self)
        self.announcement_timer.setInterval(10000)
        self.announcement_timer.timeout.connect(self.next_announcement)
        self.announcement_progress_timer = QTimer(self)
        self.announcement_progress_timer.setInterval(100)
        self.announcement_progress_timer.timeout.connect(self.advance_announcement_progress)

        self.setWindowTitle("İmleç Yazılım")
        self.resize(1180, 760)
        self.setMinimumSize(1080, 680)
        icon = resource_path("assets", "branding", "imlec-yazilim.ico")
        if icon.is_file():
            self.setWindowIcon(QIcon(str(icon)))

        self.shell = QWidget()
        self.shell.setObjectName("launcherShell")
        self.shell.setMouseTracking(True)
        self.custom_background = CustomLiveBackground(self.shell)
        self.rev9_background = LivingBackground(self.shell)
        shell_layout = QVBoxLayout(self.shell)
        shell_layout.setContentsMargins(0, 0, 0, 0)
        shell_layout.setSpacing(0)
        self.title_bar = TitleBar(self)
        shell_layout.addWidget(self.title_bar)
        self.stack = QStackedWidget()
        shell_layout.addWidget(self.stack, 1)
        self.setCentralWidget(self.shell)
        app = QApplication.instance()
        if app is not None:
            app.installEventFilter(self)
        self.login_page = self.build_login_page()
        self.home_page = self.build_home_page()
        self.stack.addWidget(self.login_page)
        self.stack.addWidget(self.home_page)
        self.apply_style()
        self.configure_live_background()
        self.position_backgrounds()

        if self.api.token():
            self.show_home(refresh=True)
        else:
            self.stack.setCurrentWidget(self.login_page)

    def resizeEvent(self, event):
        super().resizeEvent(event)
        self.position_backgrounds()

    def eventFilter(self, watched, event):
        if event.type() == QEvent.Type.MouseMove and hasattr(self, "rev9_background") and self.live_kind == "engine":
            global_position = event.globalPosition().toPoint() if hasattr(event, "globalPosition") else None
            if global_position is not None:
                local = self.shell.mapFromGlobal(global_position)
                if self.shell.rect().contains(local):
                    self.rev9_background.set_pointer(
                        local.x() / max(1, self.shell.width()),
                        local.y() / max(1, self.shell.height()),
                    )
        return super().eventFilter(watched, event)

    def position_backgrounds(self):
        if hasattr(self, "shell"):
            self.custom_background.setGeometry(0, 0, self.shell.width(), self.shell.height())
            self.rev9_background.setGeometry(0, 0, self.shell.width(), self.shell.height())
            self.custom_background.lower()
            self.rev9_background.lower()

    def closeEvent(self, event):
        if bool(self.settings.value("behavior/minimize_to_tray", False, type=bool)) and QSystemTrayIcon.isSystemTrayAvailable():
            event.ignore()
            self.ensure_tray_icon()
            self.hide()
            return
        super().closeEvent(event)

    def ensure_tray_icon(self):
        if hasattr(self, "tray_icon"):
            self.tray_icon.show()
            return
        icon_path = resource_path("assets", "branding", "imlec-yazilim.ico")
        icon = QIcon(str(icon_path)) if icon_path.is_file() else self.windowIcon()
        self.tray_icon = QSystemTrayIcon(icon, self)
        menu = QMenu(self)
        show_action = QAction("Göster", self)
        show_action.triggered.connect(self.showNormal)
        quit_action = QAction("Çıkış", self)
        quit_action.triggered.connect(QApplication.quit)
        menu.addAction(show_action)
        menu.addAction(quit_action)
        self.tray_icon.setContextMenu(menu)
        self.tray_icon.activated.connect(lambda reason: self.showNormal() if reason == QSystemTrayIcon.ActivationReason.DoubleClick else None)
        self.tray_icon.show()

    def build_login_page(self) -> QWidget:
        page = QWidget()
        page.setObjectName("loginRoot")
        root = QGridLayout(page)
        root.setContentsMargins(58, 44, 58, 44)
        root.setHorizontalSpacing(36)

        hero = QFrame()
        hero.setObjectName("loginHero")
        hero_layout = QVBoxLayout(hero)
        hero_layout.setContentsMargins(48, 42, 48, 42)
        hero_layout.setSpacing(20)

        logo = QLabel()
        logo.setObjectName("brandLogo")
        pixmap = QPixmap(str(resource_path("assets", "branding", "imlec-yazilim-logo2-login-wide.png")))
        if pixmap.isNull():
            pixmap = QPixmap(str(resource_path("assets", "branding", "imlec-yazilim-logo2.png")))
        if not pixmap.isNull():
            logo.setPixmap(pixmap.scaled(430, 150, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation))
        else:
            logo.setText("İmleç Yazılım")
        logo.setFixedHeight(150)

        headline = QLabel("Ürünlerinizi tek merkezden yönetin.")
        headline.setObjectName("heroTitle")
        headline.setWordWrap(True)
        subtitle = QLabel("Hesabınıza girin; sahip olduğunuz uygulamaları indirin, güncelleyin ve başlatın.")
        subtitle.setObjectName("heroSubtitle")
        subtitle.setWordWrap(True)

        chips = QHBoxLayout()
        for text in ("Güvenli oturum", "Tek tık güncelleme", "Çoklu ürün"):
            chip = QLabel(text)
            chip.setObjectName("chip")
            chips.addWidget(chip)
        chips.addStretch(1)

        hero_layout.addWidget(logo)
        hero_layout.addStretch(1)
        hero_layout.addWidget(headline)
        hero_layout.addWidget(subtitle)
        hero_layout.addLayout(chips)

        form_wrap = QFrame()
        form_wrap.setObjectName("loginPanel")
        form_layout = QVBoxLayout(form_wrap)
        form_layout.setContentsMargins(44, 44, 44, 44)
        form_layout.setSpacing(14)
        title = QLabel("Hesabınıza giriş yapın")
        title.setObjectName("sectionTitle")
        hint = QLabel("İmleç Yazılım hesabınızla erişiminiz olan uygulamalar burada görünür.")
        hint.setObjectName("mutedText")
        hint.setWordWrap(True)
        self.email_input = QLineEdit()
        self.email_input.setPlaceholderText("E-posta")
        self.email_input.setText(str(self.settings.value("auth/email", "") or ""))
        self.password_input = QLineEdit()
        self.password_input.setPlaceholderText("Şifre")
        self.password_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.remember_check = QCheckBox("Beni hatırla")
        self.remember_check.setChecked(str(self.settings.value("auth/remember", "true")).lower() != "false")
        self.login_status = QLabel("")
        self.login_status.setObjectName("mutedText")
        login_button = QPushButton("Giriş Yap")
        login_button.setObjectName("primaryButton")
        login_button.clicked.connect(self.login)
        form_layout.addStretch(1)
        form_layout.addWidget(title)
        form_layout.addWidget(hint)
        form_layout.addSpacing(8)
        form_layout.addWidget(self.email_input)
        form_layout.addWidget(self.password_input)
        form_layout.addWidget(self.remember_check)
        form_layout.addWidget(login_button)
        form_layout.addWidget(self.login_status)
        form_layout.addStretch(1)

        root.addWidget(hero, 0, 0)
        root.addWidget(form_wrap, 0, 1)
        root.setColumnStretch(0, 5)
        root.setColumnStretch(1, 4)
        return page

    def build_home_page(self) -> QWidget:
        page = QWidget()
        page.setObjectName("homeRoot")
        root = QHBoxLayout(page)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)

        sidebar = QFrame()
        sidebar.setObjectName("sidebar")
        sidebar_layout = QVBoxLayout(sidebar)
        sidebar_layout.setContentsMargins(12, 18, 12, 14)
        sidebar_layout.setSpacing(3)

        brand = QHBoxLayout()
        brand.setContentsMargins(8, 4, 8, 18)
        brand.setSpacing(10)
        mark = QLabel()
        mark.setFixedSize(38, 38)
        mark.setObjectName("brandIcon")
        pixmap = QPixmap(str(resource_path("assets", "branding", "imlec-yazilim-logo-mark.png")))
        if pixmap.isNull():
            pixmap = QPixmap(str(resource_path("assets", "branding", "imlec-yazilim-logo2-tight.png")))
        if not pixmap.isNull():
            mark.setPixmap(pixmap.scaled(38, 38, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation))
        brand_text = QVBoxLayout()
        brand_text.setSpacing(1)
        brand_name = QLabel("İmleç Yazılım")
        brand_name.setObjectName("brandName")
        brand_sub = QLabel("Uygulama Merkezi")
        brand_sub.setObjectName("tinyText")
        brand_text.addWidget(brand_name)
        brand_text.addWidget(brand_sub)
        brand.addWidget(mark)
        brand.addLayout(brand_text, 1)
        sidebar_layout.addLayout(brand)

        self.nav_buttons: dict[str, QPushButton] = {}
        for key, label, icon_name in (
            ("start", "Başlangıç", "home"),
            ("apps", "Uygulamalar", "grid"),
            ("updates", "Güncellemeler", "refresh"),
            ("account", "Hesap", "user"),
            ("settings", "Ayarlar", "settings"),
        ):
            button = QPushButton(label)
            button.setObjectName("navButton")
            button.setCheckable(True)
            button.setCursor(Qt.CursorShape.PointingHandCursor)
            button.setIconSize(QSize(16, 16))
            button.clicked.connect(lambda _checked=False, name=key: self.set_home_section(name))
            self.nav_buttons[key] = button
            self.nav_icons[key] = icon_name
            sidebar_layout.addWidget(button)

        sidebar_layout.addStretch(1)
        self.user_card = ClickableFrame()
        self.user_card.setObjectName("userCard")
        self.user_card.setCursor(Qt.CursorShape.PointingHandCursor)
        self.user_card.clicked.connect(lambda: self.set_home_section("account"))
        user_layout = QHBoxLayout(self.user_card)
        user_layout.setContentsMargins(10, 10, 10, 10)
        user_layout.setSpacing(10)
        self.sidebar_avatar = QLabel("İ")
        self.sidebar_avatar.setObjectName("avatar")
        self.sidebar_avatar.setFixedSize(32, 32)
        self.sidebar_avatar.setAlignment(Qt.AlignmentFlag.AlignCenter)
        user_text = QVBoxLayout()
        user_text.setSpacing(1)
        self.sidebar_user_email = QLabel("Oturum açık")
        self.sidebar_user_email.setObjectName("userEmail")
        self.sidebar_user_status = QLabel("Aktif üyelik")
        self.sidebar_user_status.setObjectName("tinyText")
        user_text.addWidget(self.sidebar_user_email)
        user_text.addWidget(self.sidebar_user_status)
        user_layout.addWidget(self.sidebar_avatar)
        user_layout.addLayout(user_text, 1)
        self.user_card_chevron = QLabel()
        self.user_card_chevron.setPixmap(line_icon("chevron-down", "#68758d", 16).pixmap(16, 16))
        user_layout.addWidget(self.user_card_chevron)
        sidebar_layout.addWidget(self.user_card)
        status_row = QHBoxLayout()
        status_row.setContentsMargins(8, 12, 8, 0)
        status_row.setSpacing(7)
        self.status_dot = StatusDot()
        self.connection_label = QLabel(f"Bağlı · Launcher v{LAUNCHER_VERSION}")
        self.connection_label.setObjectName("tinyText")
        status_row.addWidget(self.status_dot)
        status_row.addWidget(self.connection_label, 1)
        sidebar_layout.addLayout(status_row)

        content = QWidget()
        content.setObjectName("mainPanel")
        content_layout = QVBoxLayout(content)
        content_layout.setContentsMargins(24, 18, 24, 24)
        content_layout.setSpacing(14)

        header = QHBoxLayout()
        header.setSpacing(10)
        title_box = QVBoxLayout()
        title_box.setSpacing(2)
        self.page_title = QLabel("Başlangıç")
        self.page_title.setObjectName("appTitle")
        self.page_subtitle = QLabel("Yayınlar ve hızlı erişim")
        self.page_subtitle.setObjectName("mutedText")
        title_box.addWidget(self.page_title)
        title_box.addWidget(self.page_subtitle)
        header.addLayout(title_box)
        header.addItem(QSpacerItem(20, 20, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum))
        self.refresh_button = RefreshToolButton()
        self.refresh_button.clicked.connect(lambda: self.refresh())
        self.settings_button = GearButton()
        self.settings_button.clicked.connect(lambda: self.set_home_section("settings"))
        self.avatar_button = AvatarButton()
        self.avatar_menu = QMenu(self)
        account_action = QAction("Hesabım", self)
        account_action.setIcon(line_icon("user"))
        account_action.triggered.connect(lambda: self.set_home_section("account"))
        settings_action = QAction("Ayarlar", self)
        settings_action.setIcon(line_icon("settings"))
        settings_action.triggered.connect(lambda: self.set_home_section("settings"))
        logout_action = QAction("Hesaptan çık", self)
        logout_action.setIcon(line_icon("log-out", "#ff6b6b"))
        logout_action.triggered.connect(self.logout)
        self.avatar_menu.addAction(account_action)
        self.avatar_menu.addAction(settings_action)
        self.avatar_menu.addSeparator()
        self.avatar_menu.addAction(logout_action)
        self.avatar_button.clicked.connect(lambda: self.avatar_menu.exec(self.avatar_button.mapToGlobal(self.avatar_button.rect().bottomLeft())))
        self.icon_buttons = [self.settings_button]
        header.addWidget(self.refresh_button)
        header.addWidget(self.settings_button)
        header.addWidget(self.avatar_button)
        content_layout.addLayout(header)

        self.home_stack = QStackedWidget()
        self.start_section = self.build_start_section()
        self.apps_section = self.build_apps_section()
        self.updates_section = self.build_updates_section()
        self.account_section = self.build_account_section()
        self.settings_section = self.build_settings_section()
        for section in (self.start_section, self.apps_section, self.updates_section, self.account_section, self.settings_section):
            self.home_stack.addWidget(section)
        content_layout.addWidget(self.home_stack, 1)

        root.addWidget(sidebar)
        root.addWidget(content, 1)
        self.set_home_section("start")
        return page

    def build_start_section(self) -> QWidget:
        section = QWidget()
        layout = QVBoxLayout(section)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(14)
        self.announcement_stage = HeroBanner()
        self.announcement_stage.hoverChanged.connect(self.set_hero_hovered)
        self.announcement_stage.prevRequested.connect(self.previous_announcement)
        self.announcement_stage.nextRequested.connect(self.next_announcement)
        stage_layout = QVBoxLayout(self.announcement_stage)
        stage_layout.setContentsMargins(26, 26, 26, 14)
        stage_layout.setSpacing(0)
        stage_layout.addStretch(1)
        self.announcement_badge = QLabel("LAUNCHER")
        self.announcement_badge.setObjectName("heroBadge")
        self.announcement_title = QLabel("Yayınlar alınıyor.")
        self.announcement_title.setObjectName("heroBannerTitle")
        self.announcement_title.setWordWrap(True)
        self.announcement_body = QLabel("İmleç Yazılım duyuruları ve ürün güncellemeleri burada görünür.")
        self.announcement_body.setObjectName("heroBannerText")
        self.announcement_body.setWordWrap(True)
        self.announcement_body.setMaximumWidth(680)
        self.announcement_detail = QPushButton("Detayları gör")
        self.announcement_detail.setObjectName("heroCta")
        self.announcement_detail.setCursor(Qt.CursorShape.PointingHandCursor)
        self.announcement_detail.setVisible(False)
        self.announcement_detail_url = ""
        self.announcement_detail.clicked.connect(self.open_announcement_detail)
        stage_layout.addWidget(self.announcement_badge, 0, Qt.AlignmentFlag.AlignLeft)
        stage_layout.addSpacing(10)
        stage_layout.addWidget(self.announcement_title)
        stage_layout.addSpacing(6)
        stage_layout.addWidget(self.announcement_body)
        stage_layout.addSpacing(14)
        stage_layout.addWidget(self.announcement_detail, 0, Qt.AlignmentFlag.AlignLeft)
        stage_layout.addSpacing(18)
        controls = QHBoxLayout()
        controls.setSpacing(10)
        self.announcement_dots = DotsIndicator()
        self.announcement_dots.dotClicked.connect(self.show_announcement)
        self.announcement_progress_bar = QProgressBar()
        self.announcement_progress_bar.setObjectName("heroProgress")
        self.announcement_progress_bar.setRange(0, 100)
        self.announcement_progress_bar.setValue(0)
        self.announcement_progress_bar.setTextVisible(False)
        self.announcement_counter = QLabel("0 / 0")
        self.announcement_counter.setObjectName("heroCounter")
        self.announcement_counter.setAlignment(Qt.AlignmentFlag.AlignCenter)
        controls.addWidget(self.announcement_dots)
        controls.addWidget(self.announcement_progress_bar, 1)
        controls.addWidget(self.announcement_counter)
        stage_layout.addLayout(controls)

        quick = QHBoxLayout()
        quick.setSpacing(12)
        self.quick_launch_card = self.quick_card("F", "FİŞ260'ı başlat", "Kuruluysa uygulamayı açar", self.launch_fis260_quick)
        self.quick_updates_title = QLabel("Her şey güncel")
        self.quick_updates_title.setObjectName("quickTitle")
        self.quick_updates_body = QLabel("Son denetim: yenileme sonrası")
        self.quick_updates_body.setObjectName("tinyText")
        self.quick_updates_card = self.quick_card("✓", "", "", lambda: self.set_home_section("updates"), custom_labels=(self.quick_updates_title, self.quick_updates_body))
        quick.addWidget(self.quick_launch_card)
        quick.addWidget(self.quick_updates_card)
        layout.addWidget(self.announcement_stage)
        layout.addLayout(quick)
        layout.addStretch(1)
        return section

    def build_apps_section(self) -> QWidget:
        section = QWidget()
        layout = QVBoxLayout(section)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(12)
        self.products_layout = QVBoxLayout()
        self.products_layout.setSpacing(12)
        self.products_layout.addWidget(self.empty_card("Ürün bilgisi bekleniyor", "Yenile butonuyla ürünleri tekrar kontrol edebilirsiniz."))
        self.products_layout.addStretch(1)
        layout.addLayout(self.products_layout, 1)
        return section

    def build_updates_section(self) -> QWidget:
        section = QWidget()
        layout = QVBoxLayout(section)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(12)
        self.updates_card = QFrame()
        self.updates_card.setObjectName("card")
        self.updates_layout = QVBoxLayout(self.updates_card)
        self.updates_layout.setContentsMargins(20, 8, 20, 8)
        self.updates_layout.setSpacing(0)
        self.updates_layout.addWidget(self.update_row("", "", "Ürün bilgisi bekleniyor", "Yenile butonuyla sürüm geçmişini tekrar kontrol edebilirsiniz.", last=True))
        layout.addWidget(self.updates_card)
        layout.addStretch(1)
        return section

    def update_row(self, version: str, product_name: str, title: str, body: str, last: bool = False) -> QFrame:
        row = QFrame()
        row.setObjectName("updateRowLast" if last else "updateRow")
        row_layout = QHBoxLayout(row)
        row_layout.setContentsMargins(4, 14, 4, 14)
        row_layout.setSpacing(14)
        version_box = QVBoxLayout()
        version_box.setSpacing(5)
        if version:
            version_pill = QLabel(version)
            version_pill.setObjectName("versionPill")
            version_box.addWidget(version_pill, 0, Qt.AlignmentFlag.AlignLeft)
        if product_name:
            product_label = QLabel(product_name)
            product_label.setObjectName("tinyText")
            version_box.addWidget(product_label)
        version_box.addStretch(1)
        version_widget = QWidget()
        version_widget.setObjectName("transparentPanel")
        version_widget.setLayout(version_box)
        version_widget.setFixedWidth(104)
        body_box = QVBoxLayout()
        body_box.setSpacing(3)
        title_label = QLabel(title)
        title_label.setObjectName("updateTitle")
        title_label.setWordWrap(True)
        body_box.addWidget(title_label)
        if body:
            body_label = QLabel(body)
            body_label.setObjectName("newsText")
            body_label.setWordWrap(True)
            body_box.addWidget(body_label)
        body_box.addStretch(1)
        row_layout.addWidget(version_widget)
        row_layout.addLayout(body_box, 1)
        return row

    def build_account_section(self) -> QWidget:
        section = QWidget()
        layout = QVBoxLayout(section)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(12)

        profile_card, profile_layout = self.settings_card("Profil", "")
        self.account_email_value = QLabel("-")
        self.account_email_value.setObjectName("monoValue")
        self.account_membership_chip = QLabel("AKTİF")
        self.account_membership_chip.setObjectName("stateChip")
        self.account_membership_chip.setProperty("tone", "ok")
        self.account_device_value = QLabel(f"{socket.gethostname()} · doğrulandı ✓")
        self.account_device_value.setObjectName("monoValue")
        profile_layout.addWidget(self.krow("E-posta", "Giriş yapılan hesap", self.account_email_value))
        profile_layout.addWidget(self.krow("Üyelik", "FİŞ260 erişimi", self.account_membership_chip))
        profile_layout.addWidget(self.krow("Cihaz", "Bu bilgisayarın kaydı", self.account_device_value, last=True))

        session_card, session_layout = self.settings_card(
            "Oturum",
            "Uygulamayı kapatmak hesabınızı kapatmaz. Pencereyi kapattığınızda oturumunuz açık kalır; bir sonraki açılışta şifre sormaz.",
        )
        logout = QPushButton("Hesaptan çık")
        logout.setObjectName("dangerButton")
        logout.setCursor(Qt.CursorShape.PointingHandCursor)
        logout.clicked.connect(self.logout)
        session_layout.addSpacing(4)
        session_layout.addWidget(logout, 0, Qt.AlignmentFlag.AlignLeft)

        layout.addWidget(profile_card)
        layout.addWidget(session_card)
        layout.addStretch(1)
        return section

    def krow(self, title: str, subtitle: str, widget: QWidget, last: bool = False) -> QFrame:
        row = QFrame()
        row.setObjectName("updateRowLast" if last else "updateRow")
        row_layout = QHBoxLayout(row)
        row_layout.setContentsMargins(0, 12, 0, 12)
        row_layout.setSpacing(14)
        text_box = QVBoxLayout()
        text_box.setSpacing(2)
        title_label = QLabel(title)
        title_label.setObjectName("krowTitle")
        subtitle_label = QLabel(subtitle)
        subtitle_label.setObjectName("tinyText")
        subtitle_label.setWordWrap(True)
        text_box.addWidget(title_label)
        text_box.addWidget(subtitle_label)
        row_layout.addLayout(text_box, 1)
        row_layout.addWidget(widget, 0, Qt.AlignmentFlag.AlignVCenter)
        return row

    def build_settings_section(self) -> QWidget:
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        body = QWidget()
        layout = QVBoxLayout(body)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(12)

        appearance, appearance_layout = self.settings_card("Görünüm", "Tema tercihiniz kaydedilir ve tüm launcher'a uygulanır.")
        appearance_layout.addWidget(self.settings_group("Klasik"))
        classic_grid = QGridLayout()
        classic_grid.setHorizontalSpacing(12)
        classic_grid.setVerticalSpacing(12)
        for column in range(4):
            classic_grid.setColumnStretch(column, 1)
        for index, key in enumerate(THEME_KEYS):
            theme = STATIC_THEMES[key]
            tile = ThemeTile(str(theme["label"]), "varsayılan" if key == DEFAULT_THEME else "", self.static_preview(theme))
            tile.clicked.connect(lambda theme_key=key: self.select_static_theme(theme_key))
            self.theme_tiles[key] = tile
            classic_grid.addWidget(tile, index // 4, index % 4)
        appearance_layout.addLayout(classic_grid)

        appearance_layout.addWidget(self.settings_group("Hareketli — Özel", live=True))
        custom_grid = QGridLayout()
        custom_grid.setHorizontalSpacing(12)
        custom_grid.setVerticalSpacing(12)
        for column in range(3):
            custom_grid.setColumnStretch(column, 1)
        for index, key in enumerate(CUSTOM_LIVE_KEYS):
            data = CUSTOM_PRESETS[key]
            tile = ThemeTile(str(data["label"]), "Canlı", LivePreviewFrame("custom", key))
            tile.clicked.connect(lambda preset=key: self.select_custom_live(preset))
            self.custom_tiles[key] = tile
            custom_grid.addWidget(tile, index // 3, index % 3)
        appearance_layout.addLayout(custom_grid)

        appearance_layout.addWidget(self.settings_group("Hareketli — İmleç Yazılım web sitesi (Rev 9) ile aynı motor", live=True))
        rev9_controls = QWidget()
        rev9_controls.setObjectName("transparentPanel")
        rev9_controls_layout = QVBoxLayout(rev9_controls)
        rev9_controls_layout.setContentsMargins(0, 8, 0, 10)
        rev9_controls_layout.setSpacing(10)
        color_row = QHBoxLayout()
        color_row.setSpacing(8)
        color_row.addWidget(self.inline_label("Renk"))
        for key, label in (("mavi", "Mavi"), ("mor", "Mor"), ("zumrut", "Zümrüt"), ("gunbatimi", "Gün Batımı"), ("altin", "Altın"), ("buz", "Buz")):
            r, g, b = REV9_PALETTES[key][0]
            button = ColorSwatchButton(QColor(r, g, b), label)
            button.clicked.connect(lambda _checked=False, value=key: self.select_rev9_color(value))
            self.rev9_color_buttons[key] = button
            color_row.addWidget(button)
        color_row.addStretch(1)
        rev9_controls_layout.addLayout(color_row)
        intensity_row = QHBoxLayout()
        intensity_row.setSpacing(12)
        intensity_row.addWidget(self.inline_label("Yoğunluk"))
        segment = QFrame()
        segment.setObjectName("segmentedControl")
        segment_layout = QHBoxLayout(segment)
        segment_layout.setContentsMargins(3, 3, 3, 3)
        segment_layout.setSpacing(4)
        for value, label in ((0.6, "Az"), (1.0, "Orta"), (1.5, "Çok")):
            button = QPushButton(label)
            button.setObjectName("segButton")
            button.setCheckable(True)
            button.setCursor(Qt.CursorShape.PointingHandCursor)
            button.clicked.connect(lambda _checked=False, amount=value: self.select_rev9_intensity(amount))
            self.rev9_intensity_buttons[value] = button
            segment_layout.addWidget(button)
        intensity_row.addWidget(segment)
        intensity_row.addStretch(1)
        rev9_controls_layout.addLayout(intensity_row)
        appearance_layout.addWidget(rev9_controls)
        rev9_grid = QGridLayout()
        rev9_grid.setHorizontalSpacing(12)
        rev9_grid.setVerticalSpacing(12)
        for column in range(3):
            rev9_grid.setColumnStretch(column, 1)
        for index, (key, label) in enumerate(REV9_ATMOSPHERES):
            preview = OffPreviewFrame() if key == "off" else LivePreviewFrame("engine", key)
            tile = ThemeTile(label, "Canlı" if key != "off" else "", preview)
            tile.clicked.connect(lambda atmosphere=key: self.select_rev9_atmosphere(atmosphere))
            self.rev9_tiles[key] = tile
            rev9_grid.addWidget(tile, index // 3, index % 3)
        appearance_layout.addLayout(rev9_grid)

        behavior, behavior_layout = self.settings_card("Davranış", "")
        self.startup_check = ToggleSwitch(bool(self.settings.value("behavior/start_with_windows", False, type=bool)))
        self.startup_check.toggled.connect(self.set_start_with_windows)
        self.tray_check = ToggleSwitch(bool(self.settings.value("behavior/minimize_to_tray", False, type=bool)))
        self.tray_check.toggled.connect(lambda checked: self.settings.setValue("behavior/minimize_to_tray", bool(checked)))
        self.auto_update_check = ToggleSwitch(bool(self.settings.value("behavior/auto_download_updates", True, type=bool)))
        self.auto_update_check.toggled.connect(lambda checked: self.settings.setValue("behavior/auto_download_updates", bool(checked)))
        self.reduce_motion_check = ToggleSwitch(self.reduce_motion)
        self.reduce_motion_check.toggled.connect(self.set_reduce_motion)
        self.toggle_switches = [self.startup_check, self.tray_check, self.auto_update_check, self.reduce_motion_check]
        behavior_layout.addWidget(self.krow("Windows ile başlat", "Oturum açılınca launcher arka planda hazır olur", self.startup_check))
        behavior_layout.addWidget(self.krow("Kapatınca tepsiye küçült", "X'e basınca uygulama görev çubuğu tepsisinde çalışmaya devam eder", self.tray_check))
        behavior_layout.addWidget(self.krow("Güncellemeleri otomatik indir", "Yeni sürümler arka planda hazırlanır, siz onaylayınca kurulur", self.auto_update_check))
        behavior_layout.addWidget(self.krow("Hareketli arkaplanı azalt", "Canlı temalarda animasyonları durdurur — düşük güçlü bilgisayarlar ve erişilebilirlik için", self.reduce_motion_check, last=True))

        storage, storage_layout = self.settings_card("Depolama", "")
        open_folder = QPushButton("Klasörü aç")
        open_folder.setObjectName("ghostButton")
        open_folder.setCursor(Qt.CursorShape.PointingHandCursor)
        open_folder.clicked.connect(self.open_data_folder)
        clear_cache = QPushButton("Temizle")
        clear_cache.setObjectName("ghostButton")
        clear_cache.setCursor(Qt.CursorShape.PointingHandCursor)
        clear_cache.clicked.connect(self.clear_download_cache)
        storage_layout.addWidget(self.krow("Kurulum klasörü", str(data_root()), open_folder))
        self.cache_row = self.krow("İndirme önbelleği", f"{self.cache_size_text()} geçici dosya", clear_cache, last=True)
        self.cache_label = self.cache_row.findChildren(QLabel)[1]
        storage_layout.addWidget(self.cache_row)

        about, about_layout = self.settings_card("Hakkında", "")
        check_updates = QPushButton("Güncellemeleri denetle")
        check_updates.setObjectName("ghostButton")
        check_updates.setCursor(Qt.CursorShape.PointingHandCursor)
        check_updates.clicked.connect(self.refresh)
        about_layout.addWidget(self.krow("İmleç Launcher", f"v{LAUNCHER_VERSION} · imza doğrulandı", check_updates, last=True))

        for card in (appearance, behavior, storage, about):
            layout.addWidget(card)
        layout.addStretch(1)
        scroll.setWidget(body)
        self.update_theme_controls()
        return scroll

    def settings_card(self, title: str, body: str) -> tuple[QFrame, QVBoxLayout]:
        card = QFrame()
        card.setObjectName("settingsCard")
        layout = QVBoxLayout(card)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(4)
        heading = QLabel(title)
        heading.setObjectName("cardTitle")
        layout.addWidget(heading)
        if body:
            text = QLabel(body)
            text.setObjectName("cardDescription")
            text.setWordWrap(True)
            layout.addWidget(text)
        layout.addSpacing(4)
        return card, layout

    def settings_group(self, text: str, live: bool = False) -> QWidget:
        wrap = QWidget()
        wrap.setObjectName("transparentPanel")
        row = QHBoxLayout(wrap)
        row.setContentsMargins(0, 10, 0, 2)
        row.setSpacing(6)
        label = QLabel(text.upper())
        label.setObjectName("settingsGroupLabel")
        row.addWidget(label)
        if live:
            pill = QLabel("CANLI")
            pill.setObjectName("livePill")
            pill.setFixedSize(40, 15)
            pill.setAlignment(Qt.AlignmentFlag.AlignCenter)
            row.addWidget(pill)
        row.addStretch(1)
        return wrap

    def inline_label(self, text: str) -> QLabel:
        label = QLabel(text)
        label.setObjectName("inlineLabel")
        label.setFixedWidth(60)
        return label

    def static_preview(self, theme: dict[str, str]) -> QFrame:
        preview = QFrame()
        preview.setObjectName("themePreview")
        preview.setFixedHeight(74)
        preview.setStyleSheet(
            f"""
            QFrame#themePreview {{
                background: {theme["bg0"]};
                border-top-left-radius: 12px;
                border-top-right-radius: 12px;
            }}
            """
        )
        row = QHBoxLayout(preview)
        row.setContentsMargins(0, 0, 0, 0)
        side = QFrame()
        side.setFixedWidth(34)
        side.setStyleSheet(f"background: {theme['bg1']}; border-top-left-radius: 12px;")
        bars = QVBoxLayout()
        bars.setContentsMargins(10, 14, 10, 14)
        bars.setSpacing(6)
        for width, color in ((58, theme["acc"]), (38, theme["bg3"])):
            bar = QFrame()
            bar.setFixedSize(width, 7)
            bar.setStyleSheet(f"background: {color}; border-radius: 4px;")
            bars.addWidget(bar)
        row.addWidget(side)
        row.addLayout(bars, 1)
        return preview

    def quick_card(self, mark: str, title: str, body: str, callback, custom_labels: tuple[QLabel, QLabel] | None = None) -> ClickableFrame:
        card = ClickableFrame()
        card.setObjectName("quickCard")
        card.setCursor(Qt.CursorShape.PointingHandCursor)
        card.clicked.connect(callback)
        layout = QHBoxLayout(card)
        layout.setContentsMargins(14, 14, 14, 14)
        layout.setSpacing(12)
        icon = QLabel(mark)
        icon.setObjectName("quickIcon")
        icon.setFixedSize(40, 40)
        icon.setAlignment(Qt.AlignmentFlag.AlignCenter)
        text = QVBoxLayout()
        text.setSpacing(2)
        if custom_labels:
            title_label, body_label = custom_labels
        else:
            title_label = QLabel(title)
            title_label.setObjectName("quickTitle")
            body_label = QLabel(body)
            body_label.setObjectName("tinyText")
        body_label.setWordWrap(True)
        text.addWidget(title_label)
        text.addWidget(body_label)
        arrow = QLabel()
        arrow.setPixmap(line_icon("chevron-right", "#68758d", 16).pixmap(16, 16))
        layout.addWidget(icon)
        layout.addLayout(text, 1)
        layout.addWidget(arrow)
        return card

    def select_static_theme(self, key: str):
        if key not in STATIC_THEMES:
            return
        self.theme_name = key
        self.live_kind = "none"
        self.rev9_atmosphere = "off"
        self.settings.setValue("appearance/theme", self.theme_name)
        self.settings.setValue("appearance/live_kind", self.live_kind)
        self.settings.setValue("appearance/rev9_atmosphere", self.rev9_atmosphere)
        self.apply_style()

    def select_custom_live(self, preset: str):
        if preset not in CUSTOM_PRESETS:
            return
        self.live_kind = "custom"
        self.custom_live = preset
        self.rev9_atmosphere = "off"
        self.settings.setValue("appearance/live_kind", self.live_kind)
        self.settings.setValue("appearance/custom_live", self.custom_live)
        self.settings.setValue("appearance/rev9_atmosphere", self.rev9_atmosphere)
        self.apply_style()

    def select_rev9_atmosphere(self, atmosphere: str):
        if atmosphere == "off":
            self.live_kind = "none"
            self.rev9_atmosphere = "off"
        else:
            self.live_kind = "engine"
            self.rev9_atmosphere = atmosphere
        self.settings.setValue("appearance/live_kind", self.live_kind)
        self.settings.setValue("appearance/rev9_atmosphere", self.rev9_atmosphere)
        self.apply_style()

    def select_rev9_color(self, color: str):
        if color in REV9_PALETTES:
            self.rev9_color = color
            self.settings.setValue("appearance/rev9_color", color)
            self.configure_live_background()
            self.update_theme_controls()

    def select_rev9_intensity(self, amount: float):
        self.rev9_intensity = amount
        self.settings.setValue("appearance/rev9_intensity", amount)
        self.configure_live_background()
        self.update_theme_controls()

    def set_reduce_motion(self, checked: bool):
        self.reduce_motion = bool(checked)
        self.settings.setValue("appearance/reduce_motion", self.reduce_motion)
        self.configure_live_background()

    def set_start_with_windows(self, checked: bool):
        self.settings.setValue("behavior/start_with_windows", bool(checked))
        if sys.platform != "win32":
            return
        try:
            import winreg

            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_SET_VALUE)
            if checked:
                target = f'"{sys.executable}"'
                winreg.SetValueEx(key, "ImlecLauncher", 0, winreg.REG_SZ, target)
            else:
                try:
                    winreg.DeleteValue(key, "ImlecLauncher")
                except FileNotFoundError:
                    pass
            winreg.CloseKey(key)
        except Exception as exc:
            QMessageBox.warning(self, "Başlangıç ayarı", str(exc))

    def cache_size_text(self) -> str:
        folder = data_root() / "Downloads"
        total = 0
        if folder.exists():
            for item in folder.rglob("*"):
                if item.is_file():
                    try:
                        total += item.stat().st_size
                    except OSError:
                        pass
        if total >= 1024 * 1024:
            return f"{total / (1024 * 1024):.1f} MB"
        if total >= 1024:
            return f"{total / 1024:.1f} KB"
        return f"{total} B"

    def open_data_folder(self):
        target = data_root()
        target.mkdir(parents=True, exist_ok=True)
        QDesktopServices.openUrl(QUrl.fromLocalFile(str(target)))

    def clear_download_cache(self):
        folder = data_root() / "Downloads"
        try:
            if folder.exists():
                shutil.rmtree(folder)
            folder.mkdir(parents=True, exist_ok=True)
            self.cache_label.setText(f"{self.cache_size_text()} geçici dosya")
        except Exception as exc:
            QMessageBox.warning(self, "Önbellek", str(exc))

    def empty_card(self, title: str, body: str) -> QFrame:
        card = QFrame()
        card.setObjectName("card")
        layout = QVBoxLayout(card)
        layout.setContentsMargins(24, 22, 24, 22)
        title_label = QLabel(title)
        title_label.setObjectName("sectionTitle")
        body_label = QLabel(body)
        body_label.setObjectName("newsText")
        body_label.setWordWrap(True)
        layout.addWidget(title_label)
        layout.addWidget(body_label)
        return card

    def set_home_section(self, name: str):
        sections = {
            "start": self.start_section,
            "apps": self.apps_section,
            "updates": self.updates_section,
            "account": self.account_section,
            "settings": self.settings_section,
        }
        titles = {
            "start": ("Başlangıç", "Yayınlar ve hızlı erişim"),
            "apps": ("Uygulamalar", "Kur, güncelle, yönet"),
            "updates": ("Güncellemeler", "Sürüm geçmişi"),
            "account": ("Hesap", "Profil ve oturum"),
            "settings": ("Ayarlar", "Görünüm ve davranış"),
        }
        widget = sections.get(name, self.start_section)
        self.home_stack.setCurrentWidget(widget)
        p = self.current_palette()
        for key, button in self.nav_buttons.items():
            button.setChecked(key == name)
            button.setIcon(line_icon(self.nav_icons.get(key, "grid"), p["acc"] if key == name else p["tx2"], 18))
        title, subtitle = titles.get(name, titles["start"])
        self.page_title.setText(title)
        self.page_subtitle.setText(subtitle)

    def login(self):
        email = self.email_input.text().strip()
        password = self.password_input.text()
        if not email or not password:
            QMessageBox.warning(self, "Eksik bilgi", "E-posta ve şifre zorunludur.")
            return
        self.login_status.setText("Giriş kontrol ediliyor...")
        QApplication.processEvents()
        try:
            payload = self.api.login(email, password)
            self.api.set_token(payload["desktopToken"], email, self.remember_check.isChecked())
            self.show_home(refresh=True)
        except Exception as exc:
            self.login_status.setText("")
            QMessageBox.critical(self, "Giriş başarısız", friendly_error(exc))

    def show_home(self, refresh: bool = False):
        self.stack.setCurrentWidget(self.home_page)
        if refresh:
            self.refresh()

    def logout(self):
        self.api.clear_token()
        self.stack.setCurrentWidget(self.login_page)

    def refresh(self):
        if self.refresh_thread is not None:
            return
        self.connection_label.setText("Bağlantı: Yenileniyor")
        self.refresh_button.start_spin()
        self.refresh_thread = QThread(self)
        self.refresh_worker = RefreshWorker(self.api)
        self.refresh_worker.moveToThread(self.refresh_thread)
        self.refresh_thread.started.connect(self.refresh_worker.run)
        self.refresh_worker.finished.connect(self.on_refresh_finished)
        self.refresh_worker.error.connect(self.on_refresh_error)
        self.refresh_worker.finished.connect(self.refresh_thread.quit)
        self.refresh_worker.error.connect(self.refresh_thread.quit)
        self.refresh_worker.finished.connect(self.refresh_worker.deleteLater)
        self.refresh_worker.error.connect(self.refresh_worker.deleteLater)
        self.refresh_thread.finished.connect(self.cleanup_refresh_worker)
        self.refresh_thread.finished.connect(self.refresh_thread.deleteLater)
        self.refresh_thread.start()

    @Slot(dict, list)
    def on_refresh_finished(self, payload: dict, announcements: list):
        user = payload.get("user") if isinstance(payload.get("user"), dict) else {}
        email = str(user.get("email") or "").strip()
        name = str(user.get("name") or "").strip()
        initial = (name or email or "İ")[0].upper()
        self.avatar_button.set_initial(initial)
        self.sidebar_avatar.setText(initial)
        self.sidebar_user_email.setText(email or "Oturum açık")
        self.account_email_value.setText(email or "-")
        raw_products = payload.get("products") if isinstance(payload.get("products"), list) else []
        self.products = sorted(
            [item for item in raw_products if isinstance(item, dict)],
            key=lambda item: (not bool(item.get("hasAccess")), str(item.get("name") or item.get("slug") or "")),
        )
        has_access = any(bool(item.get("hasAccess")) for item in self.products)
        self.account_membership_chip.setText("AKTİF" if has_access else "ERİŞİM YOK")
        self.account_membership_chip.setProperty("tone", "ok" if has_access else "soon")
        self.account_membership_chip.style().unpolish(self.account_membership_chip)
        self.account_membership_chip.style().polish(self.account_membership_chip)
        self.connection_label.setText(f"Bağlı · Launcher v{LAUNCHER_VERSION}")
        self.render_products()
        self.render_updates()
        self.refresh_announcements(announcements)

    @Slot(str, bool)
    def on_refresh_error(self, message: str, auth_error: bool):
        if auth_error:
            self.api.expire_token()
            remembered_email = str(self.settings.value("auth/email", "") or "").strip()
            self.email_input.setText(remembered_email)
            self.password_input.clear()
            self.remember_check.setChecked(bool(self.settings.value("auth/remember", False, type=bool)))
            self.stack.setCurrentWidget(self.login_page)
            self.login_status.setText(message or "Oturum doğrulanamadı. Lütfen yeniden giriş yapın.")
            self.password_input.setFocus()
            return
        self.connection_label.setText("Bağlantı: Kontrol gerekli")
        self.render_products(error=message)
        self.render_updates(error=message)
        self.refresh_announcements([])
        QMessageBox.warning(self, "Bağlantı", message)

    def cleanup_refresh_worker(self):
        self.refresh_button.stop_spin()
        self.refresh_button.set_idle_icon(line_icon("refresh", self.current_palette()["tx2"]))
        self.refresh_worker = None
        self.refresh_thread = None

    def refresh_announcements(self, announcements: list[dict] | None = None):
        announcements = announcements if announcements is not None else []
        self.announcements = announcements[:8]
        self.announcement_index = 0
        self.render_current_announcement()
        if len(self.announcements) > 1:
            self.reset_announcement_progress()
            self.announcement_timer.start()
            self.announcement_progress_timer.start()
        else:
            self.announcement_timer.stop()
            self.announcement_progress_timer.stop()
            self.reset_announcement_progress()

    def render_current_announcement(self):
        total = len(self.announcements)
        self.announcement_counter.setText(f"{min(self.announcement_index + 1, total)} / {total}" if total else "0 / 0")
        self.announcement_counter.setVisible(total > 0)
        self.announcement_progress_bar.setVisible(total > 1)
        self.announcement_stage.set_arrows_available(total > 1)
        self.announcement_dots.set_state(total if total > 1 else 0, self.announcement_index)
        if not self.announcements:
            self.announcement_badge.setText("LAUNCHER")
            self.announcement_title.setText("Duyuru yok")
            self.announcement_body.setText("Şu anda yayınlanmış duyuru bulunmuyor.")
            self.announcement_stage.set_pixmap(QPixmap())
            return
        announcement = self.announcements[self.announcement_index]
        product_slug = str(announcement.get("productSlug") or "launcher").strip().upper()
        self.announcement_badge.setText(product_slug or "LAUNCHER")
        self.announcement_title.setText(str(announcement.get("title") or "Duyuru"))
        self.announcement_body.setText(str(announcement.get("body") or "").strip())
        detail_url = str(announcement.get("url") or announcement.get("href") or "").strip()
        self.announcement_detail_url = detail_url
        self.announcement_detail.setVisible(bool(detail_url))
        self.update_announcement_image(announcement)
        self.reset_announcement_progress()

    def open_announcement_detail(self):
        if self.announcement_detail_url:
            QDesktopServices.openUrl(QUrl(self.announcement_detail_url))

    def show_announcement(self, index: int):
        if not self.announcements:
            return
        self.announcement_index = index % len(self.announcements)
        self.render_current_announcement()

    def reset_announcement_progress(self):
        self.announcement_progress = 0
        self.announcement_progress_bar.setValue(0)

    def advance_announcement_progress(self):
        if len(self.announcements) <= 1:
            self.announcement_progress_timer.stop()
            return
        self.announcement_progress = min(100, self.announcement_progress + 1)
        self.announcement_progress_bar.setValue(self.announcement_progress)

    def set_hero_hovered(self, hovered: bool):
        self.hero_hovered = hovered
        if len(self.announcements) <= 1:
            return
        if hovered:
            self.announcement_timer.stop()
            self.announcement_progress_timer.stop()
        else:
            self.announcement_timer.start()
            self.announcement_progress_timer.start()

    def update_announcement_image(self, announcement: dict):
        image_url = str(announcement.get("imageUrl") or "").strip()
        if not image_url:
            self.announcement_stage.set_pixmap(QPixmap())
            return
        if image_url in self.announcement_images:
            self.announcement_stage.set_pixmap(self.announcement_images[image_url])
            return
        self.announcement_stage.set_pixmap(QPixmap())
        self.fetch_announcement_image(image_url)

    def fetch_announcement_image(self, image_url: str):
        if image_url in self.image_threads:
            return
        thread = QThread(self)
        worker = ImageFetchWorker(image_url)
        self.image_threads[image_url] = thread
        self.image_workers[image_url] = worker
        worker.moveToThread(thread)
        thread.started.connect(worker.run)
        worker.finished.connect(self.on_announcement_image_fetched)
        worker.finished.connect(thread.quit)
        worker.finished.connect(worker.deleteLater)
        thread.finished.connect(lambda url=image_url: self.cleanup_image_fetch(url))
        thread.finished.connect(thread.deleteLater)
        thread.start()

    @Slot(str, object)
    def on_announcement_image_fetched(self, image_url: str, data: object):
        pixmap = QPixmap()
        if isinstance(data, (bytes, bytearray)) and data:
            pixmap.loadFromData(bytes(data))
        self.announcement_images[image_url] = pixmap
        if self.announcements and str(self.announcements[self.announcement_index].get("imageUrl") or "").strip() == image_url:
            self.announcement_stage.set_pixmap(pixmap)

    def cleanup_image_fetch(self, image_url: str):
        self.image_threads.pop(image_url, None)
        self.image_workers.pop(image_url, None)

    def next_announcement(self):
        if len(self.announcements) <= 1:
            return
        self.announcement_index = (self.announcement_index + 1) % len(self.announcements)
        self.render_current_announcement()

    def previous_announcement(self):
        if len(self.announcements) <= 1:
            return
        self.announcement_index = (self.announcement_index - 1) % len(self.announcements)
        self.render_current_announcement()

    def render_products(self, error: str = ""):
        clear_layout(self.products_layout)
        self.product_widgets.clear()
        self.product_cards.clear()
        if error:
            self.products_layout.addWidget(self.empty_card("Ürün bilgisi alınamadı", error))
            self.products_layout.addStretch(1)
            return
        if not self.products:
            self.products_layout.addWidget(self.empty_card("Ürün bulunamadı", "Bu hesap için listelenecek uygulama yok."))
            self.products_layout.addStretch(1)
            return
        for product in self.products:
            self.products_layout.addWidget(self.product_card(product))
        self.products_layout.addStretch(1)

    def product_card(self, product: dict) -> QFrame:
        slug = safe_slug(str(product.get("slug") or ""))
        name = str(product.get("name") or slug.upper())
        installed = LAUNCHER_VERSION if slug == "launcher" else read_installed_version(slug)
        latest = str(product.get("latestVersion") or "").strip()

        card = QFrame()
        card.setObjectName("productCard")
        layout = QGridLayout(card)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setHorizontalSpacing(16)
        layout.setVerticalSpacing(5)

        icon = QLabel((name[:1] or slug[:1] or "İ").upper())
        icon.setObjectName("productIcon")
        icon.setFixedSize(52, 52)
        icon.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title = QLabel(name)
        title.setObjectName("productTitle")
        state_chip = QLabel("")
        state_chip.setObjectName("stateChip")
        status = QLabel("")
        status.setObjectName("tinyText")
        version = QLabel(f"v{installed or '-'}")
        version.setObjectName("tinyText")
        progress = QProgressBar()
        progress.setRange(0, 100)
        progress.setTextVisible(False)
        progress.setFixedHeight(4)
        progress.setMaximumWidth(420)
        progress.setVisible(False)
        action = QPushButton()
        action.setCursor(Qt.CursorShape.PointingHandCursor)
        action.clicked.connect(lambda _checked=False, item=product: self.handle_product_action(item))
        more = QToolButton()
        more.setObjectName("dotsButton")
        more.setIcon(line_icon("more", "#68758d", 18))
        more.setIconSize(QSize(18, 18))
        menu = QMenu(more)
        repair = QAction("Onar", more)
        repair.setIcon(line_icon("wrench"))
        repair.triggered.connect(lambda _checked=False, item=product: self.install_or_update(item))
        shortcut = QAction("Kısayol oluştur", more)
        shortcut.triggered.connect(lambda _checked=False, item=product: create_product_shortcuts(item))
        folder = QAction("Klasörü aç", more)
        folder.setIcon(line_icon("folder"))
        folder.triggered.connect(lambda _checked=False, item=product: self.open_product_folder(item))
        remove = QAction("Kaldır", more)
        remove.setIcon(line_icon("trash", "#ff6b6b"))
        remove.triggered.connect(lambda _checked=False, item=product: self.uninstall_product(item))
        for action_item in (repair, shortcut, folder, remove):
            menu.addAction(action_item)
        more.setMenu(menu)
        more.setPopupMode(QToolButton.ToolButtonPopupMode.InstantPopup)

        title_row = QHBoxLayout()
        title_row.setSpacing(9)
        title_row.addWidget(title)
        title_row.addWidget(state_chip, 0, Qt.AlignmentFlag.AlignVCenter)
        title_row.addStretch(1)
        info_row = QHBoxLayout()
        info_row.setSpacing(12)
        info_row.addWidget(version)
        info_row.addWidget(status)
        info_row.addStretch(1)
        meta = QVBoxLayout()
        meta.setSpacing(4)
        meta.addLayout(title_row)
        meta.addLayout(info_row)
        meta.addWidget(progress)

        layout.addWidget(icon, 0, 0, Qt.AlignmentFlag.AlignVCenter)
        layout.addLayout(meta, 0, 1)
        layout.addWidget(action, 0, 2, Qt.AlignmentFlag.AlignVCenter)
        layout.addWidget(more, 0, 3, Qt.AlignmentFlag.AlignVCenter)
        layout.setColumnStretch(1, 1)

        self.product_widgets[slug] = {
            "status": status,
            "version": version,
            "progress": progress,
            "action": action,
            "stateChip": state_chip,
        }
        self.product_cards[slug] = card
        self.update_product_state(product)
        return card

    def update_product_state(self, product: dict):
        slug = safe_slug(str(product.get("slug") or ""))
        widgets = self.product_widgets.get(slug)
        if not widgets:
            return
        status = widgets["status"]
        action = widgets["action"]
        state_chip = widgets.get("stateChip")
        installed = LAUNCHER_VERSION if slug == "launcher" else read_installed_version(slug)
        latest = str(product.get("latestVersion") or "").strip()
        has_access = bool(product.get("hasAccess"))
        exe = product_exe_path(product)
        version_label = widgets.get("version")
        if version_label:
            if installed and latest and is_newer_version(latest, installed):
                version_label.setText(f"v{installed} → v{latest}")
            elif installed:
                version_label.setText(f"v{installed}")
            elif latest:
                version_label.setText(f"v{latest}")
            else:
                version_label.setText("—")

        if not has_access:
            status.setText("Bu hesapta erişim yok.")
            if state_chip:
                state_chip.setText("ERİŞİM YOK")
                state_chip.setProperty("tone", "soon")
            action.setText("Erişim Yok")
            action.setEnabled(False)
            action.setObjectName("disabledAction")
            action.setProperty("actionMode", "disabled")
        elif slug == "launcher" and latest and is_newer_version(latest, LAUNCHER_VERSION):
            status.setText("Launcher için yeni sürüm hazır.")
            if state_chip:
                state_chip.setText("GÜNCELLEME HAZIR")
                state_chip.setProperty("tone", "warn")
            action.setText("Launcher'ı Güncelle")
            action.setEnabled(True)
            action.setObjectName("warningButton")
            action.setProperty("actionMode", "launcher_update")
        elif slug == "launcher":
            status.setText("Launcher güncel.")
            if state_chip:
                state_chip.setText("GÜNCEL")
                state_chip.setProperty("tone", "ok")
            action.setText("Güncel")
            action.setEnabled(False)
            action.setObjectName("disabledAction")
            action.setProperty("actionMode", "disabled")
        elif not exe.is_file():
            status.setText("Bu bilgisayarda kurulu değil.")
            if state_chip:
                state_chip.setText("KURULUM GEREKLİ")
                state_chip.setProperty("tone", "warn")
            action.setText("Kur")
            action.setEnabled(True)
            action.setObjectName("primaryButton")
            action.setProperty("actionMode", "install")
        elif latest and installed and is_newer_version(latest, installed):
            status.setText("Yeni sürüm hazır.")
            if state_chip:
                state_chip.setText("GÜNCELLEME HAZIR")
                state_chip.setProperty("tone", "warn")
            action.setText("Güncelle")
            action.setEnabled(True)
            action.setObjectName("warningButton")
            action.setProperty("actionMode", "update")
        else:
            status.setText("Kullanıma hazır.")
            if state_chip:
                state_chip.setText("KURULU · GÜNCEL")
                state_chip.setProperty("tone", "ok")
            action.setText("Aç")
            action.setEnabled(True)
            action.setObjectName("primaryButton")
            action.setProperty("actionMode", "launch")
        action.style().unpolish(action)
        action.style().polish(action)
        if state_chip:
            state_chip.style().unpolish(state_chip)
            state_chip.style().polish(state_chip)

    def render_updates(self, error: str = ""):
        clear_layout(self.updates_layout)
        if error:
            self.updates_layout.addWidget(self.update_row("", "", "Sürüm geçmişi alınamadı", error, last=True))
            return
        pending = 0
        rows: list[tuple[str, str, str, str]] = []
        for product in self.products:
            slug = safe_slug(str(product.get("slug") or ""))
            if not bool(product.get("hasAccess")):
                continue
            name = str(product.get("name") or slug.upper())
            installed = LAUNCHER_VERSION if slug == "launcher" else read_installed_version(slug)
            latest = str(product.get("latestVersion") or "").strip()
            notes = str(product.get("releaseNotes") or "").strip()
            has_update = bool(installed and latest and is_newer_version(latest, installed))
            if has_update:
                pending += 1
            if not latest:
                continue
            note_lines = [line.strip() for line in notes.splitlines() if line.strip()]
            if note_lines:
                title = note_lines[0]
                body = " ".join(note_lines[1:])
            else:
                title = "Yeni sürüm hazır" if has_update else "Güncel sürüm"
                body = f"{name} v{latest} yayında." + (f" Kurulu sürüm: v{installed}." if installed else "")
            rows.append((f"v{latest}", name, title, body))
        if not rows:
            self.updates_layout.addWidget(self.update_row("", "", "Sürüm geçmişi boş", "Erişiminiz olan ürünler için sürüm notları burada listelenir.", last=True))
        else:
            for index, (version, name, title, body) in enumerate(rows):
                self.updates_layout.addWidget(self.update_row(version, name, title, body, last=index == len(rows) - 1))
        if pending:
            self.nav_buttons["updates"].setText(f"Güncellemeler ({pending})")
            if hasattr(self, "quick_updates_title"):
                self.quick_updates_title.setText(f"{pending} güncelleme hazır")
                self.quick_updates_body.setText("Güncelleme ayrıntılarını inceleyin")
        else:
            self.nav_buttons["updates"].setText("Güncellemeler")
            if hasattr(self, "quick_updates_title"):
                self.quick_updates_title.setText("Her şey güncel")
                self.quick_updates_body.setText("Kurulu uygulamalar güncel görünüyor")

    def handle_product_action(self, product: dict):
        slug = safe_slug(str(product.get("slug") or ""))
        widgets = self.product_widgets.get(slug)
        if not widgets:
            return
        mode = str(widgets["action"].property("actionMode") or "")
        log_debug(f"product_action slug={slug} mode={mode} enabled={widgets['action'].isEnabled()}")
        if mode == "launcher_update":
            self.install_launcher_update(product)
            return
        if mode == "launch":
            self.launch_product(product)
        elif mode in {"install", "update"}:
            self.install_or_update(product)
        elif widgets["action"].isEnabled():
            QMessageBox.warning(
                self,
                str(product.get("name") or "Uygulama"),
                "Bu işlem başlatılamadı. Lütfen Yenile'ye basıp tekrar deneyin.",
            )

    def launch_product(self, product: dict):
        exe = product_exe_path(product)
        if not exe.is_file():
            QMessageBox.warning(self, str(product.get("name") or "Uygulama"), "Uygulama bu bilgisayarda kurulu değil.")
            self.update_product_state(product)
            return
        subprocess.Popen([str(exe)], cwd=str(exe.parent), close_fds=True)

    def launch_fis260_quick(self):
        for product in self.products:
            if safe_slug(str(product.get("slug") or "")) == "fis260":
                self.launch_product(product)
                return
        self.set_home_section("apps")

    def open_product_folder(self, product: dict):
        folder = product_install_dir(str(product.get("slug") or ""))
        folder.mkdir(parents=True, exist_ok=True)
        QDesktopServices.openUrl(QUrl.fromLocalFile(str(folder)))

    def uninstall_product(self, product: dict):
        slug = safe_slug(str(product.get("slug") or ""))
        if slug == "launcher":
            QMessageBox.information(self, "Launcher", "Launcher bu menüden kaldırılamaz.")
            return
        name = str(product.get("name") or slug.upper())
        if QMessageBox.question(self, name, "Bu uygulamanın yerel kurulumunu kaldırmak istiyor musunuz?") != QMessageBox.StandardButton.Yes:
            return
        try:
            shutil.rmtree(product_install_dir(slug), ignore_errors=True)
            self.update_product_state(product)
            self.render_updates()
        except Exception as exc:
            QMessageBox.warning(self, name, str(exc))

    def install_launcher_update(self, product: dict):
        if self.launcher_update_thread and self.launcher_update_thread.isRunning():
            QMessageBox.information(self, "Launcher güncellemesi", "Launcher güncellemesi zaten devam ediyor.")
            return
        slug = safe_slug(str(product.get("slug") or ""))
        widgets = self.product_widgets.get(slug)
        if widgets:
            widgets["action"].setEnabled(False)
            widgets["progress"].setVisible(True)
            widgets["progress"].setValue(0)
            widgets["status"].setText("Launcher güncellemesi hazırlanıyor")
        self.launcher_update_thread = QThread(self)
        self.launcher_update_worker = LauncherSelfUpdateWorker(product)
        self.launcher_update_worker.moveToThread(self.launcher_update_thread)
        self.launcher_update_thread.started.connect(self.launcher_update_worker.run)
        self.launcher_update_worker.progress.connect(self.on_launcher_update_progress)
        self.launcher_update_worker.finished.connect(self.on_launcher_update_ready)
        self.launcher_update_worker.error.connect(self.on_launcher_update_error)
        self.launcher_update_worker.finished.connect(self.launcher_update_thread.quit)
        self.launcher_update_worker.error.connect(self.launcher_update_thread.quit)
        self.launcher_update_thread.finished.connect(self.launcher_update_worker.deleteLater)
        self.launcher_update_thread.finished.connect(self.launcher_update_thread.deleteLater)
        self.launcher_update_thread.start()

    def install_or_update(self, product: dict):
        if self.worker_thread and self.worker_thread.isRunning():
            QMessageBox.information(self, "Kurulum", "Devam eden bir indirme/kurulum var.")
            return
        slug = safe_slug(str(product.get("slug") or ""))
        widgets = self.product_widgets.get(slug)
        if widgets:
            widgets["action"].setEnabled(False)
            widgets["action"].setText("İndiriliyor")
            widgets["progress"].setVisible(True)
            widgets["progress"].setValue(0)
            widgets["status"].setText("İndirme hazırlanıyor")
        self.worker_thread = QThread(self)
        self.worker = ProductInstallWorker(product)
        self.worker.moveToThread(self.worker_thread)
        self.worker_thread.started.connect(self.worker.run)
        self.worker.progress.connect(self.on_install_progress)
        self.worker.finished.connect(self.on_install_finished)
        self.worker.error.connect(self.on_install_error)
        self.worker.finished.connect(self.worker_thread.quit)
        self.worker.error.connect(self.worker_thread.quit)
        self.worker_thread.finished.connect(self.worker.deleteLater)
        self.worker_thread.finished.connect(self.worker_thread.deleteLater)
        self.worker_thread.start()

    @Slot(int, str)
    def on_launcher_update_progress(self, percent: int, message: str):
        widgets = self.product_widgets.get("launcher")
        if widgets:
            widgets["progress"].setValue(percent)
            widgets["status"].setText(message)

    @Slot()
    def on_launcher_update_ready(self):
        self.launcher_update_worker = None
        self.launcher_update_thread = None
        QMessageBox.information(
            self,
            "Launcher güncellemesi",
            "Launcher güncellemesi başlatıldı. Uygulama kapanıp yeni sürümle tekrar açılacak.",
        )
        QApplication.quit()

    @Slot(str)
    def on_launcher_update_error(self, message: str):
        widgets = self.product_widgets.get("launcher")
        if widgets:
            widgets["progress"].setVisible(False)
            widgets["action"].setEnabled(True)
        self.launcher_update_worker = None
        self.launcher_update_thread = None
        QMessageBox.critical(self, "Launcher güncelleme hatası", message)

    @Slot(str, int, str)
    def on_install_progress(self, slug: str, percent: int, message: str):
        widgets = self.product_widgets.get(slug)
        if widgets:
            widgets["progress"].setValue(percent)
            widgets["progress"].setFormat(f"{percent}%")
            widgets["status"].setText(message)

    @Slot(str, dict)
    def on_install_finished(self, slug: str, _payload: dict):
        widgets = self.product_widgets.get(slug)
        if widgets:
            widgets["progress"].setVisible(False)
            widgets["progress"].setFormat("%p%")
        self.worker = None
        self.worker_thread = None
        for product in self.products:
            if safe_slug(str(product.get("slug") or "")) == slug:
                self.update_product_state(product)
                QMessageBox.information(self, str(product.get("name") or slug.upper()), "Uygulama hazır.")
                break
        self.render_updates()

    @Slot(str, str)
    def on_install_error(self, slug: str, message: str):
        widgets = self.product_widgets.get(slug)
        if widgets:
            widgets["progress"].setVisible(False)
            widgets["progress"].setFormat("%p%")
            widgets["action"].setEnabled(True)
        self.worker = None
        self.worker_thread = None
        QMessageBox.critical(
            self,
            "Kurulum hatası",
            f"{message}\n\nAyrıntılı kayıt: {launcher_log_path()}",
        )
        for product in self.products:
            if safe_slug(str(product.get("slug") or "")) == slug:
                self.update_product_state(product)
                break

    def current_palette(self) -> dict[str, str]:
        if self.live_kind == "custom" and self.custom_live in CUSTOM_PRESETS:
            return preset_theme(self.custom_live)
        return STATIC_THEMES.get(self.theme_name, STATIC_THEMES[DEFAULT_THEME])

    def configure_live_background(self):
        if not hasattr(self, "custom_background"):
            return
        self.custom_background.set_reduce_motion(self.reduce_motion)
        self.rev9_background.set_reduce_motion(self.reduce_motion)
        if self.live_kind == "custom":
            self.rev9_background.stop()
            self.custom_background.set_preset(self.custom_live)
        elif self.live_kind == "engine" and self.rev9_atmosphere != "off":
            self.custom_background.stop()
            self.rev9_background.set_base_color(qcolor(self.current_palette()["bg0"]))
            self.rev9_background.configure(
                atmosphere=self.rev9_atmosphere,
                color_name=self.rev9_color,
                intensity=self.rev9_intensity,
            )
        else:
            self.custom_background.stop()
            self.rev9_background.stop()
        self.position_backgrounds()
        self.update_theme_controls()

    def update_theme_controls(self):
        if not hasattr(self, "theme_tiles"):
            return
        for key, tile in self.theme_tiles.items():
            tile.set_selected(self.live_kind == "none" and key == self.theme_name)
        for key, tile in self.custom_tiles.items():
            tile.set_selected(self.live_kind == "custom" and key == self.custom_live)
        for key, tile in self.rev9_tiles.items():
            if self.live_kind == "engine":
                tile.set_selected(key == self.rev9_atmosphere)
            else:
                tile.set_selected(key == "off")
        for key, button in self.rev9_color_buttons.items():
            button.setChecked(key == self.rev9_color)
        for value, button in self.rev9_intensity_buttons.items():
            button.setChecked(abs(value - self.rev9_intensity) < 0.01)
        for tile in list(self.custom_tiles.values()) + list(self.rev9_tiles.values()):
            preview = tile.findChild(LivePreviewFrame)
            if preview:
                preview.set_engine_theme(self.rev9_color, self.rev9_intensity)
                preview.set_reduce_motion(self.reduce_motion)

    def apply_style(self):
        p = self.current_palette()
        live_active = self.live_kind in {"custom", "engine"} and not (self.live_kind == "engine" and self.rev9_atmosphere == "off")
        bg0 = "transparent" if live_active else p["bg0"]
        main_bg = "transparent" if live_active else p["bg0"]
        panel_bg = str(p.get("panel") or rgba_from_hex(p["bg1"], 0.55 if self.live_kind == "engine" else 0.68))
        card_bg = rgba_from_hex(p["bg2"], 0.86 if self.live_kind == "engine" else 0.93) if live_active else p["bg2"]
        control_bg = rgba_from_hex(p["bg1"], 0.64 if live_active else 1.0)
        if not live_active:
            panel_bg = p["bg1"]
            control_bg = p["bg1"]
        title_bar_bg = panel_bg if live_active else p["bg1"]
        qss = """
            QMainWindow, QWidget {
                background: @@bg0@@;
                color: @@tx1@@;
                font-family: "Segoe UI";
                font-size: 13px;
            }
            QLabel {
                background: transparent;
            }
            QWidget#loginRoot {
                background: @@main_bg@@;
            }
            QFrame#loginHero {
                background: @@panel_bg@@;
                border: 1px solid @@line@@;
                border-radius: 18px;
            }
            QFrame#loginPanel, QFrame#card, QFrame#productCard, QFrame#settingsCard {
                background: @@card_bg@@;
                border: 1px solid @@line@@;
                border-radius: 14px;
            }
            QFrame#rev9ControlPanel {
                background: @@control_bg@@;
                border: 1px solid @@line@@;
                border-radius: 12px;
            }
            QStackedWidget, QWidget#homeRoot {
                background: transparent;
            }
            QWidget#launcherShell {
                background: @@bg0@@;
                border: 1px solid @@line2@@;
                border-radius: 14px;
            }
            QFrame#titleBar {
                background: @@title_bar_bg@@;
                border-bottom: 1px solid @@line@@;
            }
            QLabel#titleText {
                color: @@tx2@@;
                font-size: 12px;
            }
            QFrame#sidebar {
                background: @@panel_bg@@;
                border-right: 1px solid @@line@@;
                min-width: 236px;
                max-width: 236px;
            }
            QWidget#mainPanel {
                background: @@main_bg@@;
            }
            QWidget#transparentPanel {
                background: transparent;
            }
            QLabel#brandName {
                font-size: 15px;
                font-weight: 650;
                color: @@tx1@@;
            }
            QLabel#heroTitle {
                font-size: 36px;
                font-weight: 650;
                color: @@tx1@@;
            }
            QLabel#heroSubtitle {
                font-size: 17px;
                color: @@tx2@@;
            }
            QLabel#appTitle {
                font-size: 21px;
                font-weight: 650;
                color: @@tx1@@;
            }
            QLabel#sectionTitle {
                font-size: 18px;
                font-weight: 650;
            }
            QLabel#productTitle, QLabel#quickTitle {
                font-size: 15px;
                font-weight: 650;
            }
            QLabel#mutedText, QLabel#newsText {
                color: @@tx2@@;
            }
            QLabel#tinyText {
                color: @@tx3@@;
                font-size: 12px;
            }
            QLabel#heroBannerTitle {
                color: #f4f7ff;
                font-size: 24px;
                font-weight: 700;
            }
            QLabel#heroBannerText {
                color: rgba(230,238,252,0.86);
                font-size: 13px;
            }
            QLabel#heroCounter {
                color: rgba(255,255,255,0.62);
                font-family: Consolas;
                font-size: 11px;
            }
            QLabel#heroBadge {
                background: rgba(77,145,255,0.22);
                border: 1px solid rgba(120,170,255,0.45);
                border-radius: 11px;
                padding: 4px 10px;
                color: #cfe2ff;
                font-weight: 700;
                font-size: 10px;
            }
            QToolButton#heroArrow {
                background: rgba(8,12,20,0.55);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 19px;
            }
            QToolButton#heroArrow:hover {
                background: rgba(8,12,20,0.8);
            }
            QLabel#cardTitle {
                font-size: 15px;
                font-weight: 650;
                color: @@tx1@@;
            }
            QLabel#cardDescription {
                font-size: 12px;
                color: @@tx3@@;
            }
            QLabel#krowTitle {
                font-size: 13px;
                font-weight: 650;
                color: @@tx1@@;
            }
            QFrame#updateRow {
                background: transparent;
                border: 0;
                border-bottom: 1px solid @@line@@;
            }
            QFrame#updateRowLast {
                background: transparent;
                border: 0;
            }
            QLabel#versionPill {
                background: @@accSoft@@;
                color: @@acc@@;
                border-radius: 7px;
                padding: 3px 9px;
                font-family: Consolas;
                font-size: 11px;
                font-weight: 700;
            }
            QLabel#updateTitle {
                font-size: 13px;
                font-weight: 650;
                color: @@tx1@@;
            }
            QLabel#monoValue {
                font-family: Consolas;
                font-size: 12px;
                color: @@tx2@@;
            }
            QPushButton#ghostButton {
                background: transparent;
                border: 1px solid @@line2@@;
                color: @@tx1@@;
                font-size: 12px;
            }
            QPushButton#ghostButton:hover {
                background: @@bg3@@;
            }
            QPushButton#swatchButton {
                min-width: 26px;
                max-width: 26px;
                min-height: 26px;
                max-height: 26px;
                padding: 0;
                border: 0;
                background: transparent;
            }
            QLabel#chip, QLabel#badge, QLabel#stateChip {
                background: @@accSoft@@;
                border: 1px solid @@line2@@;
                border-radius: 11px;
                padding: 4px 10px;
                color: @@acc@@;
                font-weight: 700;
                font-size: 11px;
            }
            QLabel#stateChip[tone="ok"] {
                background: rgba(61,220,151,0.12);
                border-color: rgba(61,220,151,0.35);
                color: @@ok@@;
            }
            QLabel#stateChip[tone="warn"] {
                background: rgba(255,200,87,0.10);
                border-color: rgba(255,200,87,0.35);
                color: @@warn@@;
            }
            QLabel#stateChip[tone="soon"] {
                background: @@bg3@@;
                border-color: @@line@@;
                color: @@tx3@@;
            }
            QLabel#avatar, QLabel#productIcon, QLabel#quickIcon {
                background: @@accSoft@@;
                border: 1px solid @@line2@@;
                border-radius: 11px;
                color: @@acc@@;
                font-weight: 800;
                font-size: 16px;
            }
            QLabel#userEmail {
                color: @@tx1@@;
                font-weight: 650;
                font-size: 12px;
            }
            QLineEdit {
                height: 44px;
                background: @@bg0@@;
                border: 1px solid @@line2@@;
                border-radius: 10px;
                padding: 0 13px;
                color: @@tx1@@;
            }
            QLineEdit:focus {
                border-color: @@acc@@;
            }
            QCheckBox {
                color: @@tx2@@;
                spacing: 8px;
            }
            QPushButton {
                min-height: 36px;
                background: @@bg3@@;
                border: 1px solid @@line2@@;
                border-radius: 9px;
                padding: 7px 14px;
                color: @@tx1@@;
                font-weight: 650;
            }
            QPushButton:hover {
                border-color: @@line2@@;
            }
            QToolButton#iconButton, QToolButton#dotsButton {
                min-width: 38px;
                max-width: 38px;
                min-height: 38px;
                max-height: 38px;
                background: @@bg2@@;
                border: 1px solid @@line@@;
                border-radius: 10px;
                color: @@tx2@@;
            }
            QToolButton#iconButton:hover, QToolButton#dotsButton:hover {
                border-color: @@line2@@;
                color: @@tx1@@;
            }
            QToolButton#dotsButton {
                min-width: 36px;
                max-width: 36px;
                min-height: 36px;
                max-height: 36px;
                border-radius: 9px;
                background: transparent;
            }
            QToolButton#dotsButton::menu-indicator {
                image: none;
            }
            QToolButton#windowButton {
                min-width: 44px;
                max-width: 44px;
                min-height: 38px;
                max-height: 38px;
                background: transparent;
                border: 0;
                border-radius: 0;
            }
            QToolButton#windowButton:hover {
                background: @@bg3@@;
            }
            QToolButton#windowButton[danger="true"]:hover {
                background: #d64545;
            }
            QPushButton#navButton {
                min-height: 38px;
                text-align: left;
                padding-left: 9px;
                border: 0;
                border-left: 3px solid transparent;
                background: transparent;
                color: @@tx2@@;
                border-radius: 9px;
                font-size: 13px;
                font-weight: 500;
            }
            QPushButton#navButton:hover {
                background: @@bg2@@;
                color: @@tx1@@;
            }
            QPushButton#navButton:checked {
                background: @@accSoft@@;
                border-left: 3px solid @@acc@@;
                color: @@tx1@@;
            }
            QPushButton#primaryButton {
                background: @@acc@@;
                border-color: @@acc@@;
                color: @@accTx@@;
            }
            QPushButton#heroCta {
                background: @@acc@@;
                border: 0;
                color: @@accTx@@;
                min-height: 32px;
                padding: 0 15px;
                border-radius: 9px;
                font-size: 12px;
                font-weight: 700;
            }
            QPushButton#warningButton {
                background: @@warn@@;
                border-color: @@warn@@;
                color: #17120a;
            }
            QPushButton#disabledAction {
                background: @@bg3@@;
                border-color: @@line@@;
                color: @@tx3@@;
            }
            QPushButton#dangerButton {
                background: transparent;
                border-color: rgba(214,69,69,0.45);
                color: @@danger@@;
            }
            QPushButton#dangerButton:hover {
                background: rgba(214,69,69,0.10);
            }
            QProgressBar {
                height: 4px;
                background: @@bg3@@;
                border: 0;
                border-radius: 3px;
                text-align: center;
                color: transparent;
            }
            QProgressBar::chunk {
                background: @@acc@@;
                border-radius: 3px;
            }
            QProgressBar#heroProgress {
                min-height: 3px;
                max-height: 3px;
                background: rgba(255,255,255,0.18);
                border-radius: 1px;
            }
            QProgressBar#heroProgress::chunk {
                border-radius: 1px;
            }
            QFrame#quickCard, QFrame#userCard, QFrame#themeTile {
                background: @@card_bg@@;
                border: 1px solid @@line@@;
                border-radius: 13px;
            }
            QFrame#quickCard:hover, QFrame#userCard:hover, QFrame#themeTile:hover {
                border-color: @@line2@@;
            }
            QFrame#themeTile[selected="true"] {
                border-color: @@acc@@;
            }
            QFrame#themeTileLabel {
                background: @@card_bg@@;
                border-bottom-left-radius: 13px;
                border-bottom-right-radius: 13px;
            }
            QLabel#themeTileTitle {
                color: @@tx1@@;
                font-size: 12px;
                font-weight: 600;
            }
            QLabel#themeTileSubtitle {
                color: @@tx3@@;
                font-size: 10px;
            }
            QLabel#livePill {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 #39e6b0, stop:1 #4fd1ff);
                color: #04140f;
                border-radius: 9px;
                padding: 2px 6px;
                font-size: 9px;
                font-weight: 800;
            }
            QFrame#segmentedControl {
                background: @@bg3@@;
                border: 0;
                border-radius: 9px;
            }
            QPushButton#segButton {
                min-height: 24px;
                padding: 4px 12px;
                border-radius: 6px;
                border: 0;
                background: transparent;
                color: @@tx2@@;
                font-size: 12px;
                font-weight: 600;
            }
            QPushButton#segButton:checked {
                background: @@acc@@;
                color: @@accTx@@;
            }
            QLabel#settingsGroupLabel {
                color: @@tx3@@;
                font-size: 11px;
                font-weight: 700;
            }
            QLabel#inlineLabel {
                color: @@tx3@@;
                font-size: 11px;
                font-weight: 700;
            }
            QScrollArea {
                border: 0;
                background: transparent;
            }
            QScrollBar:vertical {
                background: transparent;
                width: 10px;
                margin: 0;
            }
            QScrollBar::handle:vertical {
                background: @@bg3@@;
                border-radius: 5px;
            }
            QMenu {
                background: @@bg2@@;
                border: 1px solid @@line2@@;
                border-radius: 10px;
                padding: 6px;
                color: @@tx2@@;
                min-width: 190px;
            }
            QMenu::item {
                padding: 9px 12px;
                border-radius: 8px;
            }
            QMenu::item:selected {
                background: @@bg3@@;
                color: @@tx1@@;
            }
            QMenu::separator {
                height: 1px;
                background: @@line@@;
                margin: 5px 8px;
            }
            """
        for token, value in {
            "bg0": bg0,
            "main_bg": main_bg,
            "panel_bg": panel_bg,
            "title_bar_bg": title_bar_bg,
            "acc": p["acc"],
            "accSoft": p["accSoft"],
            "accTx": p["accTx"],
            "bg2": p["bg2"],
            "bg3": p["bg3"],
            "card_bg": card_bg,
            "control_bg": control_bg,
            "danger": p["danger"],
            "line": p["line"],
            "line2": p["line2"],
            "ok": p["ok"],
            "tx1": p["tx1"],
            "tx2": p["tx2"],
            "tx3": p["tx3"],
            "warn": p["warn"],
        }.items():
            qss = qss.replace(f"@@{token}@@", str(value))
        self.setStyleSheet(qss)
        self.announcement_stage.set_theme(p) if hasattr(self, "announcement_stage") else None
        self.title_bar.apply_icon_color(p["tx3"]) if hasattr(self, "title_bar") else None
        if hasattr(self, "refresh_button"):
            self.refresh_button.set_accent(p["acc"])
            self.refresh_button.set_idle_icon(line_icon("refresh", p["tx2"], 20))
        for button in getattr(self, "icon_buttons", []):
            button.apply_icon_color(p["tx2"])
        for key, button in getattr(self, "nav_buttons", {}).items():
            active = button.isChecked()
            button.setIcon(line_icon(self.nav_icons.get(key, "grid"), p["acc"] if active else p["tx2"], 18))
        if hasattr(self, "avatar_button"):
            self.avatar_button.set_colors(p)
        if hasattr(self, "status_dot"):
            self.status_dot.set_color(p["ok"])
        if hasattr(self, "user_card_chevron"):
            self.user_card_chevron.setPixmap(line_icon("chevron-down", p["tx3"], 16).pixmap(16, 16))
        for switch in getattr(self, "toggle_switches", []):
            switch.set_colors(p)
        self.configure_live_background()


def main() -> int:
    app = QApplication(sys.argv)
    app.setApplicationName("İmleç Yazılım Launcher")
    window = LauncherWindow()
    window.show()
    return app.exec()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception:
        traceback.print_exc()
        raise
