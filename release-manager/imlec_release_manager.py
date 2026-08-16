from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PySide6.QtCore import Qt, QThread, Signal, Slot
from PySide6.QtWidgets import (
    QApplication,
    QComboBox,
    QFrame,
    QGridLayout,
    QGroupBox,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)


APP_DIR = Path(__file__).resolve().parent
PROFILE_PATH = APP_DIR / "profiles.json"


@dataclass
class CommandResult:
    code: int
    output: str


def run_command(command: str | list[str], cwd: str | Path | None = None) -> CommandResult:
    shell = isinstance(command, str)
    proc = subprocess.run(
        command,
        cwd=str(cwd) if cwd else None,
        shell=shell,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        encoding="utf-8",
        errors="replace",
    )
    return CommandResult(proc.returncode, proc.stdout or "")


def load_profiles() -> dict[str, Any]:
    return json.loads(PROFILE_PATH.read_text(encoding="utf-8"))


def resolve_path(root: str | Path, value: str) -> Path:
    path = Path(value)
    if path.is_absolute():
        return path
    return Path(root) / path


def find_signtool() -> str | None:
    command = run_command(
        "powershell -NoProfile -Command \"(Get-Command signtool.exe -ErrorAction SilentlyContinue).Source\""
    )
    candidate = command.output.strip()
    if candidate and Path(candidate).is_file():
        return candidate

    kits_root = Path(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")) / "Windows Kits" / "10" / "bin"
    if kits_root.exists():
        matches = sorted(kits_root.rglob("signtool.exe"), reverse=True)
        for match in matches:
            if "\\x64\\" in str(match).lower():
                return str(match)
    return None


def read_version(product: dict[str, Any]) -> str:
    version_config = product.get("version") or {}
    root = product["root"]
    path = resolve_path(root, str(version_config.get("file") or ""))
    pattern = str(version_config.get("regex") or "")
    if not path.is_file() or not pattern:
        return ""
    text = path.read_text(encoding="utf-8", errors="ignore")
    match = re.search(pattern, text, flags=re.MULTILINE)
    return match.group(1) if match else ""


def artifact_paths(product: dict[str, Any]) -> list[Path]:
    root = product["root"]
    return [resolve_path(root, item) for item in product.get("artifacts") or []]


class CommandWorker(QThread):
    finished_with_result = Signal(str, int, str)

    def __init__(self, title: str, command: str | list[str], cwd: str | Path | None = None):
        super().__init__()
        self.title = title
        self.command = command
        self.cwd = cwd

    def run(self) -> None:
        try:
            result = run_command(self.command, self.cwd)
            self.finished_with_result.emit(self.title, result.code, result.output)
        except Exception as exc:
            self.finished_with_result.emit(self.title, 1, str(exc))


class ReleaseManagerWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.config = load_profiles()
        self.products = self.config.get("products") or []
        self.cert = self.config.get("certificate") or {}
        self.signtool_path: str | None = None
        self.worker: CommandWorker | None = None

        self.setWindowTitle("İmleç Release Manager")
        self.resize(1120, 760)

        root = QWidget()
        layout = QVBoxLayout(root)
        layout.setContentsMargins(18, 18, 18, 18)
        layout.setSpacing(14)

        title = QLabel("İmleç Release Manager")
        title.setObjectName("title")
        layout.addWidget(title)

        subtitle = QLabel(
            "Build, imza doğrulama, paketleme ve yayın öncesi güvenlik kapısı. "
            "Bu araç hesap girişi, OTP veya Authenticator kodu istemez."
        )
        subtitle.setWordWrap(True)
        subtitle.setObjectName("subtitle")
        layout.addWidget(subtitle)

        layout.addWidget(self.build_product_box())
        layout.addWidget(self.build_status_box())
        layout.addWidget(self.build_actions_box())

        self.log = QTextEdit()
        self.log.setReadOnly(True)
        self.log.setPlaceholderText("İşlem kayıtları burada görünecek.")
        layout.addWidget(self.log, 1)

        self.setCentralWidget(root)
        self.apply_style()
        self.refresh_product()
        self.run_startup_checks()

    def build_product_box(self) -> QGroupBox:
        box = QGroupBox("Ürün")
        grid = QGridLayout(box)
        grid.setColumnStretch(1, 1)

        self.product_combo = QComboBox()
        for product in self.products:
            self.product_combo.addItem(str(product.get("name") or product.get("slug")), product.get("slug"))
        self.product_combo.currentIndexChanged.connect(self.refresh_product)

        self.version_input = QLineEdit()
        self.version_input.setPlaceholderText("Sürüm")
        self.root_label = QLabel("-")
        self.root_label.setTextInteractionFlags(Qt.TextInteractionFlag.TextSelectableByMouse)

        grid.addWidget(QLabel("Ürün"), 0, 0)
        grid.addWidget(self.product_combo, 0, 1)
        grid.addWidget(QLabel("Sürüm"), 1, 0)
        grid.addWidget(self.version_input, 1, 1)
        grid.addWidget(QLabel("Kök klasör"), 2, 0)
        grid.addWidget(self.root_label, 2, 1)
        return box

    def build_status_box(self) -> QGroupBox:
        box = QGroupBox("Kontroller")
        grid = QGridLayout(box)
        grid.setColumnStretch(1, 1)

        self.signtool_status = QLabel("Kontrol edilmedi")
        self.cert_status = QLabel("Kontrol edilmedi")
        self.artifact_status = QLabel("Kontrol edilmedi")

        grid.addWidget(QLabel("SignTool"), 0, 0)
        grid.addWidget(self.signtool_status, 0, 1)
        grid.addWidget(QLabel("Sertifika"), 1, 0)
        grid.addWidget(self.cert_status, 1, 1)
        grid.addWidget(QLabel("Dosyalar"), 2, 0)
        grid.addWidget(self.artifact_status, 2, 1)
        return box

    def build_actions_box(self) -> QFrame:
        frame = QFrame()
        layout = QHBoxLayout(frame)
        layout.setContentsMargins(0, 0, 0, 0)

        self.check_button = QPushButton("Kontrolleri Yenile")
        self.build_button = QPushButton("Build Al")
        self.sign_button = QPushButton("İmzala")
        self.verify_button = QPushButton("İmzayı Doğrula")
        self.package_button = QPushButton("Paketle")

        self.check_button.clicked.connect(self.run_startup_checks)
        self.build_button.clicked.connect(self.build_product)
        self.sign_button.clicked.connect(self.sign_artifacts)
        self.verify_button.clicked.connect(self.verify_artifacts)
        self.package_button.clicked.connect(self.package_product)

        for button in (
            self.check_button,
            self.build_button,
            self.sign_button,
            self.verify_button,
            self.package_button,
        ):
            layout.addWidget(button)
        layout.addStretch(1)
        return frame

    def apply_style(self) -> None:
        self.setStyleSheet(
            """
            QMainWindow, QWidget { background: #090d14; color: #eef4ff; font-family: Segoe UI; font-size: 13px; }
            QLabel#title { font-size: 28px; font-weight: 800; }
            QLabel#subtitle { color: #a9b7cf; }
            QGroupBox { border: 1px solid #24324a; border-radius: 8px; margin-top: 12px; padding: 14px; }
            QGroupBox::title { subcontrol-origin: margin; left: 12px; padding: 0 6px; color: #d8e6ff; font-weight: 700; }
            QLineEdit, QComboBox, QTextEdit { background: #0f1520; color: #eef4ff; border: 1px solid #27364f; border-radius: 7px; padding: 8px; }
            QPushButton { background: #1f6feb; color: white; border: 0; border-radius: 7px; padding: 10px 14px; font-weight: 700; }
            QPushButton:disabled { background: #263044; color: #7b879b; }
            """
        )

    def selected_product(self) -> dict[str, Any] | None:
        slug = self.product_combo.currentData()
        for product in self.products:
            if product.get("slug") == slug:
                return product
        return None

    @Slot()
    def refresh_product(self) -> None:
        product = self.selected_product()
        if not product:
            return
        version = read_version(product)
        self.version_input.setText(version)
        self.root_label.setText(str(product.get("root") or "-"))
        paths = artifact_paths(product)
        missing = [str(path) for path in paths if not path.exists()]
        if missing:
            self.artifact_status.setText("Eksik: " + "; ".join(missing))
        else:
            self.artifact_status.setText("Hazır: " + ", ".join(path.name for path in paths))

    @Slot()
    def run_startup_checks(self) -> None:
        self.log_message("Kontroller başlatıldı.")
        self.signtool_path = find_signtool()
        if self.signtool_path:
            self.signtool_status.setText(self.signtool_path)
            self.log_message(f"SignTool bulundu: {self.signtool_path}")
        else:
            self.signtool_status.setText("Bulunamadı. Windows SDK / SignTool gerekli.")
            self.log_message("HATA: SignTool bulunamadı.")

        thumbprint = str(self.cert.get("thumbprint") or "").replace(" ", "")
        if thumbprint:
            command = (
                "powershell -NoProfile -Command "
                f"\"$c=Get-ChildItem Cert:\\CurrentUser\\My | Where-Object {{$_.Thumbprint -eq '{thumbprint}'}}; "
                "if($c){$c | Select-Object Subject,Thumbprint,HasPrivateKey,NotAfter | Format-List | Out-String}else{'NOT_FOUND'}\""
            )
            result = run_command(command)
            text = result.output.strip()
            if "NOT_FOUND" in text or not text:
                self.cert_status.setText("Sertifika bulunamadı")
            elif "HasPrivateKey : True" in text or "HasPrivateKey: True" in text:
                self.cert_status.setText("Sertifika hazır ve özel anahtar görünüyor")
            else:
                self.cert_status.setText("Sertifika var ama özel anahtar doğrulanamadı")
            self.log_message(text)
        self.refresh_product()

    def start_worker(self, title: str, command: str | list[str], cwd: str | Path | None = None) -> None:
        if self.worker and self.worker.isRunning():
            QMessageBox.information(self, "İşlem sürüyor", "Devam eden işlem bitmeden yeni işlem başlatılamaz.")
            return
        self.set_actions_enabled(False)
        self.log_message(f"\n=== {title} ===")
        self.log_message(command if isinstance(command, str) else " ".join(command))
        self.worker = CommandWorker(title, command, cwd)
        self.worker.finished_with_result.connect(self.on_worker_finished)
        self.worker.start()

    @Slot(str, int, str)
    def on_worker_finished(self, title: str, code: int, output: str) -> None:
        self.log_message(output.strip() or "(çıktı yok)")
        self.log_message(f"{title} çıkış kodu: {code}")
        self.set_actions_enabled(True)
        self.refresh_product()
        if code != 0:
            QMessageBox.warning(self, title, "İşlem başarısız. Detay kayıt alanında.")

    def set_actions_enabled(self, enabled: bool) -> None:
        for button in (
            self.check_button,
            self.build_button,
            self.sign_button,
            self.verify_button,
            self.package_button,
        ):
            button.setEnabled(enabled)

    @Slot()
    def build_product(self) -> None:
        product = self.selected_product()
        if not product:
            return
        build = product.get("build") or {}
        command = str(build.get("command") or "")
        if not command:
            QMessageBox.information(self, "Build", "Bu ürün için build komutu tanımlı değil.")
            return
        self.start_worker("Build", command, build.get("cwd") or product.get("root"))

    @Slot()
    def sign_artifacts(self) -> None:
        product = self.selected_product()
        if not product:
            return
        if not self.signtool_path:
            QMessageBox.warning(self, "İmzalama", "SignTool bulunamadı. Kontrolleri yenileyin.")
            return
        paths = artifact_paths(product)
        missing = [path for path in paths if not path.exists()]
        if missing:
            QMessageBox.warning(self, "İmzalama", "Eksik dosya var:\n" + "\n".join(map(str, missing)))
            return
        thumbprint = str(self.cert.get("thumbprint") or "").replace(" ", "")
        timestamp_url = str(self.cert.get("timestamp_url") or "http://ts.ssl.com")
        quoted_paths = " ".join(f'"{path}"' for path in paths)
        command = (
            f'"{self.signtool_path}" sign /fd SHA256 /tr {timestamp_url} /td SHA256 '
            f'/sha1 {thumbprint} /v {quoted_paths}'
        )
        self.start_worker("İmzalama", command)

    @Slot()
    def verify_artifacts(self) -> None:
        product = self.selected_product()
        if not product:
            return
        paths = artifact_paths(product)
        paths_arg = " ".join(f'"{path}"' for path in paths)
        command = (
            "powershell -NoProfile -ExecutionPolicy Bypass -File "
            f'"C:/imlec-site/desktop-launcher/signing/verify-signed-artifacts.ps1" '
            f'-Root "{product.get("root")}" -ReleaseVersion "{self.version_input.text().strip()}" '
            f"-Paths {paths_arg}"
        )
        self.start_worker("İmza doğrulama", command)

    @Slot()
    def package_product(self) -> None:
        product = self.selected_product()
        if not product:
            return
        package = product.get("package") or {}
        command = str(package.get("command") or "").format(version=self.version_input.text().strip())
        if not command:
            QMessageBox.information(self, "Paketleme", "Bu ürün için paketleme komutu tanımlı değil.")
            return
        self.start_worker("Paketleme", command, package.get("cwd") or product.get("root"))

    def log_message(self, message: str) -> None:
        self.log.append(str(message))


def main() -> int:
    app = QApplication(sys.argv)
    window = ReleaseManagerWindow()
    window.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
