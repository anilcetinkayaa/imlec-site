import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import traceback
import zipfile
from pathlib import Path

import requests
from PySide6.QtCore import QObject, QSettings, QThread, Qt, Signal, Slot
from PySide6.QtGui import QIcon, QPixmap
from PySide6.QtWidgets import (
    QApplication,
    QCheckBox,
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMessageBox,
    QProgressBar,
    QPushButton,
    QScrollArea,
    QSizePolicy,
    QSpacerItem,
    QStackedWidget,
    QVBoxLayout,
    QWidget,
)


AUTH_BASE_URL = os.environ.get("IMLEC_AUTH_BASE_URL", "https://imlecyazilim.com").rstrip("/")
LAUNCHER_VERSION = "0.1.0"
PRODUCT_EXE_NAMES = {
    "fis260": "FIS260.exe",
    "cozver": "Cozver.exe",
    "çözver": "Cozver.exe",
}


def app_root() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def data_root() -> Path:
    return Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "ImlecYazilim"


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


def resource_path(*parts: str) -> Path:
    base = Path(getattr(sys, "_MEIPASS", app_root()))
    return base.joinpath(*parts)


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
        if status == 404 and "/api/desktop/products" in url:
            return (
                "Canlı site henüz launcher ürün endpoint'ini içermiyor.\n\n"
                "Çözüm: imlec-site değişikliklerini Vercel'e deploy edip veritabanı migration'ını çalıştırın."
            )
        return f"Sunucu {status} yanıtı verdi.\n{url}"
    return str(exc)


class ApiClient:
    def __init__(self, settings: QSettings):
        self.settings = settings

    def token(self) -> str:
        return str(self.settings.value("auth/token", "") or "").strip()

    def set_token(self, token: str, email: str, remember: bool) -> None:
        if remember:
            self.settings.setValue("auth/token", token)
            self.settings.setValue("auth/email", email)
            self.settings.setValue("auth/remember", True)
        else:
            self.settings.remove("auth/token")
            self.settings.remove("auth/email")
            self.settings.setValue("auth/remember", False)
        self.settings.sync()

    def clear_token(self) -> None:
        self.settings.remove("auth/token")
        self.settings.remove("auth/email")
        self.settings.remove("auth/remember")
        self.settings.sync()

    def login(self, email: str, password: str) -> dict:
        response = requests.post(
            f"{AUTH_BASE_URL}/api/desktop-auth/login",
            json={"email": email, "password": password},
            timeout=20,
        )
        response.raise_for_status()
        payload = response.json()
        token = payload.get("desktopToken") or payload.get("token") or payload.get("accessToken")
        if not token:
            raise RuntimeError("Sunucu oturum anahtarı döndürmedi.")
        payload["desktopToken"] = token
        return payload

    def products(self) -> dict:
        token = self.token()
        if not token:
            raise RuntimeError("Oturum bulunamadı.")
        response = requests.get(
            f"{AUTH_BASE_URL}/api/desktop/products",
            headers={"Authorization": f"Bearer {token}"},
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
        except Exception:
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
            if not download_url or not sha256 or not version:
                raise RuntimeError("İndirme paketi bilgisi eksik.")

            work_dir = data_root() / "Downloads"
            work_dir.mkdir(parents=True, exist_ok=True)
            package_path = work_dir / f"{self.slug}-{version}.zip"
            temp_path = package_path.with_suffix(".zip.part")
            digest = hashlib.sha256()

            self.progress.emit(self.slug, 3, "Paket indiriliyor")
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
                        percent = 3 + int(done * 62 / total)
                        self.progress.emit(self.slug, min(percent, 65), "Paket indiriliyor")

            actual = digest.hexdigest().lower()
            if actual != sha256:
                temp_path.unlink(missing_ok=True)
                raise RuntimeError("İndirilen paket doğrulanamadı.")
            if package_path.exists():
                package_path.unlink()
            temp_path.replace(package_path)

            install_dir = product_install_dir(self.slug)
            backup_dir = install_dir.with_name(f"{install_dir.name}_backup")
            extract_dir = Path(tempfile.mkdtemp(prefix=f"imlec_{self.slug}_"))
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
                    install_dir.rename(backup_dir)
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
                shutil.rmtree(backup_dir, ignore_errors=True)
            except Exception:
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
            self.error.emit(self.slug, str(exc))


class LauncherWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.settings = QSettings("ImlecYazilim", "Launcher")
        self.api = ApiClient(self.settings)
        self.products: list[dict] = []
        self.product_widgets: dict[str, dict[str, QWidget]] = {}
        self.worker_thread: QThread | None = None
        self.worker: ProductInstallWorker | None = None

        self.setWindowTitle("İmleç Yazılım")
        self.resize(1180, 760)
        self.setMinimumSize(1080, 680)
        icon = resource_path("assets", "branding", "imlec-yazilim.ico")
        if icon.is_file():
            self.setWindowIcon(QIcon(str(icon)))

        self.stack = QStackedWidget()
        self.setCentralWidget(self.stack)
        self.login_page = self.build_login_page()
        self.home_page = self.build_home_page()
        self.stack.addWidget(self.login_page)
        self.stack.addWidget(self.home_page)
        self.apply_style()

        if self.api.token():
            self.show_home(refresh=True)
        else:
            self.stack.setCurrentWidget(self.login_page)

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
        root = QHBoxLayout(page)
        root.setContentsMargins(0, 0, 0, 0)

        sidebar = QFrame()
        sidebar.setObjectName("sidebar")
        sidebar_layout = QVBoxLayout(sidebar)
        sidebar_layout.setContentsMargins(18, 22, 18, 18)
        sidebar_layout.setSpacing(10)

        logo = QLabel()
        logo.setObjectName("sidebarLogo")
        pixmap = QPixmap(str(resource_path("assets", "branding", "imlec-yazilim-logo2-tight.png")))
        if pixmap.isNull():
            pixmap = QPixmap(str(resource_path("assets", "branding", "imlec-yazilim-logo2.png")))
        if not pixmap.isNull():
            logo.setPixmap(pixmap.scaled(190, 72, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation))
        else:
            logo.setText("İmleç Yazılım")
        logo.setFixedHeight(72)
        sidebar_layout.addWidget(logo)
        sidebar_layout.addSpacing(18)

        self.nav_buttons: dict[str, QPushButton] = {}
        for key, label in (
            ("start", "Başlangıç"),
            ("apps", "Uygulamalar"),
            ("updates", "Güncellemeler"),
            ("account", "Hesap"),
        ):
            button = QPushButton(label)
            button.setObjectName("navButton")
            button.setCheckable(True)
            button.clicked.connect(lambda _checked=False, name=key: self.set_home_section(name))
            self.nav_buttons[key] = button
            sidebar_layout.addWidget(button)

        sidebar_layout.addStretch(1)
        self.connection_label = QLabel("Hazır")
        self.connection_label.setObjectName("tinyText")
        self.connection_label.setWordWrap(True)
        sidebar_layout.addWidget(self.connection_label)

        content = QWidget()
        content_layout = QVBoxLayout(content)
        content_layout.setContentsMargins(28, 24, 28, 24)
        content_layout.setSpacing(20)

        header = QHBoxLayout()
        title_box = QVBoxLayout()
        title = QLabel("İmleç Yazılım Merkezi")
        title.setObjectName("appTitle")
        self.user_label = QLabel("")
        self.user_label.setObjectName("mutedText")
        title_box.addWidget(title)
        title_box.addWidget(self.user_label)
        header.addLayout(title_box)
        header.addItem(QSpacerItem(20, 20, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum))
        refresh_button = QPushButton("Yenile")
        refresh_button.clicked.connect(lambda: self.refresh())
        logout_button = QPushButton("Çıkış")
        logout_button.clicked.connect(self.logout)
        header.addWidget(refresh_button)
        header.addWidget(logout_button)
        content_layout.addLayout(header)

        self.home_stack = QStackedWidget()
        self.start_section = self.build_start_section()
        self.apps_section = self.build_apps_section()
        self.updates_section = self.build_updates_section()
        self.account_section = self.build_account_section()
        for section in (self.start_section, self.apps_section, self.updates_section, self.account_section):
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
        layout.setSpacing(16)
        self.announcement_layout = QVBoxLayout()
        self.announcement_layout.setSpacing(14)
        self.announcement_layout.addWidget(self.empty_card("Yükleniyor", "Yayınlar alınıyor..."))
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setObjectName("scrollArea")
        holder = QWidget()
        holder.setLayout(self.announcement_layout)
        scroll.setWidget(holder)
        layout.addWidget(scroll)
        return section

    def build_apps_section(self) -> QWidget:
        section = QWidget()
        layout = QVBoxLayout(section)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(14)
        header = QLabel("Uygulamalar")
        header.setObjectName("pageTitle")
        layout.addWidget(header)
        self.products_layout = QVBoxLayout()
        self.products_layout.setSpacing(14)
        self.products_layout.addWidget(self.empty_card("Ürün bilgisi bekleniyor", "Yenile butonuyla ürünleri tekrar kontrol edebilirsiniz."))
        self.products_layout.addStretch(1)
        layout.addLayout(self.products_layout, 1)
        return section

    def build_updates_section(self) -> QWidget:
        section = QWidget()
        layout = QVBoxLayout(section)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(14)
        header = QLabel("Güncellemeler")
        header.setObjectName("pageTitle")
        self.updates_body = QLabel("Ürün bilgisi bekleniyor.")
        self.updates_body.setObjectName("newsText")
        self.updates_body.setWordWrap(True)
        layout.addWidget(header)
        layout.addWidget(self.updates_body)
        layout.addStretch(1)
        return section

    def build_account_section(self) -> QWidget:
        section = QWidget()
        layout = QVBoxLayout(section)
        layout.setContentsMargins(0, 0, 0, 0)
        account_card = QFrame()
        account_card.setObjectName("card")
        account_layout = QVBoxLayout(account_card)
        account_layout.setContentsMargins(24, 24, 24, 24)
        account_title = QLabel("Hesap")
        account_title.setObjectName("sectionTitle")
        self.account_body = QLabel("Giriş yapılmadı")
        self.account_body.setObjectName("newsText")
        self.account_body.setWordWrap(True)
        account_layout.addWidget(account_title)
        account_layout.addWidget(self.account_body, 1)
        layout.addWidget(account_card)
        layout.addStretch(1)
        return section

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
        }
        widget = sections.get(name, self.start_section)
        self.home_stack.setCurrentWidget(widget)
        for key, button in self.nav_buttons.items():
            button.setChecked(key == name)

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
        try:
            payload = self.api.products()
            user = payload.get("user") if isinstance(payload.get("user"), dict) else {}
            self.user_label.setText(str(user.get("email") or ""))
            self.account_body.setText(
                f"Hesap: {user.get('email') or '-'}\nLauncher sürümü: {LAUNCHER_VERSION}\nSunucu: {AUTH_BASE_URL}"
            )
            raw_products = payload.get("products") if isinstance(payload.get("products"), list) else []
            self.products = sorted(
                [item for item in raw_products if isinstance(item, dict)],
                key=lambda item: (not bool(item.get("hasAccess")), str(item.get("name") or item.get("slug") or "")),
            )
            self.connection_label.setText("Bağlantı: Online")
            self.render_products()
            self.render_updates()
            self.refresh_announcements()
        except Exception as exc:
            message = friendly_error(exc)
            self.connection_label.setText("Bağlantı: Kontrol gerekli")
            self.render_products(error=message)
            self.render_updates(error=message)
            self.refresh_announcements()
            QMessageBox.warning(self, "Bağlantı", message)

    def refresh_announcements(self):
        announcements = self.api.announcements()
        clear_layout(self.announcement_layout)
        if not announcements:
            self.announcement_layout.addWidget(self.empty_card("Duyuru yok", "Şu anda yayınlanmış duyuru bulunmuyor."))
            self.announcement_layout.addStretch(1)
            return
        for announcement in announcements[:8]:
            self.announcement_layout.addWidget(self.announcement_card(announcement))
        self.announcement_layout.addStretch(1)

    def announcement_card(self, announcement: dict) -> QFrame:
        card = QFrame()
        card.setObjectName("card")
        layout = QVBoxLayout(card)
        layout.setContentsMargins(22, 20, 22, 20)
        layout.setSpacing(10)
        image_url = str(announcement.get("imageUrl") or "").strip()
        if image_url:
            image = QLabel()
            image.setObjectName("newsImage")
            image.setFixedHeight(428)
            image.setMinimumWidth(520)
            image.setAlignment(Qt.AlignmentFlag.AlignCenter)
            pixmap = self.fetch_pixmap(image_url)
            if not pixmap.isNull():
                image.setPixmap(self.fit_announcement_image(pixmap))
                layout.addWidget(image)
        title = QLabel(str(announcement.get("title") or "Duyuru"))
        title.setObjectName("sectionTitle")
        body = QLabel(str(announcement.get("body") or "").strip())
        body.setObjectName("newsText")
        body.setWordWrap(True)
        product_slug = str(announcement.get("productSlug") or "").strip()
        if product_slug:
            badge = QLabel(product_slug.upper())
            badge.setObjectName("badge")
            layout.addWidget(badge, 0, Qt.AlignmentFlag.AlignLeft)
        layout.addWidget(title)
        layout.addWidget(body)
        return card

    def fetch_pixmap(self, image_url: str) -> QPixmap:
        try:
            response = requests.get(image_url, timeout=8)
            response.raise_for_status()
            pixmap = QPixmap()
            pixmap.loadFromData(response.content)
            return pixmap
        except Exception:
            return QPixmap()

    def fit_announcement_image(self, pixmap: QPixmap) -> QPixmap:
        target_width = 760
        target_height = 428
        scaled = pixmap.scaled(
            target_width,
            target_height,
            Qt.AspectRatioMode.KeepAspectRatioByExpanding,
            Qt.TransformationMode.SmoothTransformation,
        )
        x = max((scaled.width() - target_width) // 2, 0)
        y = max((scaled.height() - target_height) // 2, 0)
        return scaled.copy(x, y, target_width, target_height)

    def render_products(self, error: str = ""):
        clear_layout(self.products_layout)
        self.product_widgets.clear()
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
        installed = read_installed_version(slug)
        latest = str(product.get("latestVersion") or "").strip()
        has_access = bool(product.get("hasAccess"))
        exe_exists = product_exe_path(product).is_file()
        update_ready = bool(has_access and latest and installed and exe_exists and is_newer_version(latest, installed))

        card = QFrame()
        card.setObjectName("productCard")
        layout = QGridLayout(card)
        layout.setContentsMargins(22, 20, 22, 20)
        layout.setHorizontalSpacing(16)
        layout.setVerticalSpacing(8)

        title = QLabel(name)
        title.setObjectName("productTitle")
        status = QLabel("")
        status.setObjectName("mutedText")
        version = QLabel(f"Yüklü: {installed or '-'}   Son sürüm: {latest or '-'}")
        version.setObjectName("tinyText")
        release = QLabel(str(product.get("releaseNotes") or "").strip() or "Sürüm notu yok.")
        release.setObjectName("newsText")
        release.setWordWrap(True)
        progress = QProgressBar()
        progress.setRange(0, 100)
        progress.setVisible(False)
        action = QPushButton()
        action.clicked.connect(lambda _checked=False, item=product: self.handle_product_action(item))

        badge = QLabel("")
        badge.setObjectName("updateBadge")
        badge.setVisible(update_ready)
        if update_ready:
            badge.setText("Güncelleme var")

        layout.addWidget(title, 0, 0)
        layout.addWidget(badge, 0, 1, Qt.AlignmentFlag.AlignRight)
        layout.addWidget(status, 1, 0, 1, 2)
        layout.addWidget(version, 2, 0, 1, 2)
        layout.addWidget(release, 3, 0, 1, 2)
        layout.addWidget(progress, 4, 0)
        layout.addWidget(action, 4, 1)
        layout.setColumnStretch(0, 1)

        self.product_widgets[slug] = {
            "status": status,
            "version": version,
            "progress": progress,
            "action": action,
        }
        self.update_product_state(product)
        return card

    def update_product_state(self, product: dict):
        slug = safe_slug(str(product.get("slug") or ""))
        widgets = self.product_widgets.get(slug)
        if not widgets:
            return
        status = widgets["status"]
        action = widgets["action"]
        installed = read_installed_version(slug)
        latest = str(product.get("latestVersion") or "").strip()
        has_access = bool(product.get("hasAccess"))
        exe = product_exe_path(product)

        if not has_access:
            status.setText("Bu hesapta erişim yok.")
            action.setText("Erişim Yok")
            action.setEnabled(False)
            action.setObjectName("disabledAction")
        elif not exe.is_file():
            status.setText("Bu bilgisayarda kurulu değil.")
            action.setText("İndir")
            action.setEnabled(True)
            action.setObjectName("primaryButton")
        elif latest and installed and is_newer_version(latest, installed):
            status.setText("Yeni sürüm hazır.")
            action.setText("Güncelle")
            action.setEnabled(True)
            action.setObjectName("warningButton")
        else:
            status.setText("Kullanıma hazır.")
            action.setText("Başlat")
            action.setEnabled(True)
            action.setObjectName("primaryButton")
        action.style().unpolish(action)
        action.style().polish(action)

    def render_updates(self, error: str = ""):
        if error:
            self.updates_body.setText(error)
            return
        updates = []
        for product in self.products:
            slug = safe_slug(str(product.get("slug") or ""))
            installed = read_installed_version(slug)
            latest = str(product.get("latestVersion") or "").strip()
            if bool(product.get("hasAccess")) and installed and latest and is_newer_version(latest, installed):
                updates.append(f"• {product.get('name') or slug.upper()}: {installed} → {latest}")
        if updates:
            self.updates_body.setText("Hazır güncellemeler:\n\n" + "\n".join(updates))
            self.nav_buttons["updates"].setText(f"Güncellemeler ({len(updates)})")
        else:
            self.updates_body.setText("Tüm kurulu uygulamalar güncel görünüyor.")
            self.nav_buttons["updates"].setText("Güncellemeler")

    def handle_product_action(self, product: dict):
        slug = safe_slug(str(product.get("slug") or ""))
        widgets = self.product_widgets.get(slug)
        if not widgets:
            return
        text = widgets["action"].text().lower()
        if "başlat" in text:
            self.launch_product(product)
        elif "indir" in text or "güncelle" in text:
            self.install_or_update(product)

    def launch_product(self, product: dict):
        exe = product_exe_path(product)
        if not exe.is_file():
            QMessageBox.warning(self, str(product.get("name") or "Uygulama"), "Uygulama bu bilgisayarda kurulu değil.")
            self.update_product_state(product)
            return
        subprocess.Popen([str(exe)], cwd=str(exe.parent), close_fds=True)

    def install_or_update(self, product: dict):
        if self.worker_thread and self.worker_thread.isRunning():
            QMessageBox.information(self, "Kurulum", "Devam eden bir indirme/kurulum var.")
            return
        slug = safe_slug(str(product.get("slug") or ""))
        widgets = self.product_widgets.get(slug)
        if widgets:
            widgets["action"].setEnabled(False)
            widgets["progress"].setVisible(True)
            widgets["progress"].setValue(0)
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

    @Slot(str, int, str)
    def on_install_progress(self, slug: str, percent: int, message: str):
        widgets = self.product_widgets.get(slug)
        if widgets:
            widgets["progress"].setValue(percent)
            widgets["status"].setText(message)

    @Slot(str, dict)
    def on_install_finished(self, slug: str, _payload: dict):
        widgets = self.product_widgets.get(slug)
        if widgets:
            widgets["progress"].setVisible(False)
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
            widgets["action"].setEnabled(True)
        self.worker = None
        self.worker_thread = None
        QMessageBox.critical(self, "Kurulum hatası", message)
        for product in self.products:
            if safe_slug(str(product.get("slug") or "")) == slug:
                self.update_product_state(product)
                break

    def apply_style(self):
        self.setStyleSheet(
            """
            QMainWindow, QWidget {
                background: #07090d;
                color: #f6f8ff;
                font-family: Segoe UI;
                font-size: 13px;
            }
            QWidget#loginRoot {
                background: #07090d;
            }
            QFrame#loginHero {
                background: #0b1524;
                border: 1px solid #1f3859;
                border-radius: 18px;
            }
            QFrame#loginPanel, QFrame#card, QFrame#productCard {
                background: #10141d;
                border: 1px solid #26344d;
                border-radius: 14px;
            }
            QFrame#sidebar {
                background: #0b0f17;
                border-right: 1px solid #1d2a3d;
                min-width: 220px;
                max-width: 220px;
            }
            QLabel#heroTitle {
                font-size: 36px;
                font-weight: 900;
                color: white;
            }
            QLabel#heroSubtitle {
                font-size: 17px;
                color: #b5c2d6;
            }
            QLabel#appTitle {
                font-size: 28px;
                font-weight: 900;
            }
            QLabel#pageTitle {
                font-size: 24px;
                font-weight: 900;
            }
            QLabel#sectionTitle {
                font-size: 19px;
                font-weight: 800;
            }
            QLabel#productTitle {
                font-size: 27px;
                font-weight: 900;
            }
            QLabel#mutedText, QLabel#newsText {
                color: #adbbd0;
            }
            QLabel#tinyText {
                color: #7f8da3;
                font-size: 12px;
            }
            QLabel#chip, QLabel#badge, QLabel#updateBadge {
                background: #12223a;
                border: 1px solid #2c578a;
                border-radius: 12px;
                padding: 5px 10px;
                color: #cfe7ff;
                font-weight: 700;
            }
            QLabel#updateBadge {
                background: #3a2b0f;
                border-color: #d79b2b;
                color: #ffd891;
            }
            QLineEdit {
                height: 44px;
                background: #0b0f17;
                border: 1px solid #334461;
                border-radius: 10px;
                padding: 0 13px;
                color: white;
            }
            QLineEdit:focus {
                border-color: #4d91ff;
            }
            QCheckBox {
                color: #dce7f8;
                spacing: 8px;
            }
            QPushButton {
                min-height: 38px;
                background: #151d2b;
                border: 1px solid #334461;
                border-radius: 10px;
                padding: 8px 16px;
                color: white;
                font-weight: 800;
            }
            QPushButton:hover {
                background: #1d2a3d;
            }
            QPushButton#navButton {
                text-align: left;
                padding-left: 15px;
                border-color: transparent;
                background: transparent;
                color: #bac8db;
            }
            QPushButton#navButton:checked {
                background: #12305a;
                border-color: #3d82e8;
                color: white;
            }
            QPushButton#primaryButton {
                background: #2f7df6;
                border-color: #5a9aff;
            }
            QPushButton#primaryButton:hover {
                background: #4d91ff;
            }
            QPushButton#warningButton {
                background: #d58b1f;
                border-color: #ffbb4d;
                color: #0a0d12;
            }
            QPushButton#disabledAction {
                background: #1b202a;
                border-color: #303744;
                color: #788295;
            }
            QProgressBar {
                height: 12px;
                background: #0b0f17;
                border: 1px solid #334461;
                border-radius: 6px;
                text-align: center;
            }
            QProgressBar::chunk {
                background: #2f7df6;
                border-radius: 6px;
            }
            QLabel#newsImage {
                background: #0b0f17;
                border: 1px solid #26344d;
                border-radius: 12px;
            }
            QScrollArea {
                border: 0;
                background: transparent;
            }
            QScrollBar:vertical {
                background: #0b0f17;
                width: 10px;
                margin: 0;
            }
            QScrollBar::handle:vertical {
                background: #2a3952;
                border-radius: 5px;
            }
            """
        )


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
