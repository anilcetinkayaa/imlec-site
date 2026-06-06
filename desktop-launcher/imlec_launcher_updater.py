import argparse
import json
import os
import shutil
import subprocess
import sys
import time
import zipfile
from pathlib import Path


def wait_for_parent(parent_pid: int, timeout: float = 45.0) -> None:
    if parent_pid <= 0:
        return
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            os.kill(parent_pid, 0)
        except OSError:
            return
        time.sleep(0.5)


def find_payload_root(extract_dir: Path, exe_name: str) -> Path:
    direct = extract_dir / exe_name
    if direct.is_file():
        return extract_dir
    named = extract_dir / "ImlecLauncher" / exe_name
    if named.is_file():
        return named.parent
    matches = list(extract_dir.rglob(exe_name))
    if not matches:
        raise RuntimeError(f"Paket içinde {exe_name} bulunamadı.")
    return matches[0].parent


def copy_payload(source: Path, install_dir: Path) -> None:
    backup_dir = install_dir.with_name(f"{install_dir.name}_backup")
    staging_dir = install_dir.with_name(f"{install_dir.name}_new")
    shutil.rmtree(backup_dir, ignore_errors=True)
    shutil.rmtree(staging_dir, ignore_errors=True)
    shutil.copytree(source, staging_dir)
    if install_dir.exists():
        install_dir.rename(backup_dir)
    staging_dir.rename(install_dir)
    shutil.rmtree(backup_dir, ignore_errors=True)


def install_update(package_path: Path, install_dir: Path, exe_name: str) -> None:
    if not package_path.is_file():
        raise RuntimeError(f"Güncelleme paketi bulunamadı: {package_path}")
    if not install_dir.exists():
        raise RuntimeError(f"Launcher kurulum klasörü bulunamadı: {install_dir}")

    work_root = install_dir.parent
    extract_dir = work_root / f"_ImlecLauncher_extract_{int(time.time())}"
    shutil.rmtree(extract_dir, ignore_errors=True)
    extract_dir.mkdir(parents=True, exist_ok=True)
    try:
        with zipfile.ZipFile(package_path, "r") as archive:
            archive.extractall(extract_dir)
        source = find_payload_root(extract_dir, exe_name)
        copy_payload(source, install_dir)
    finally:
        shutil.rmtree(extract_dir, ignore_errors=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Imlec Launcher güvenli güncelleme yardımcısı.")
    parser.add_argument("--package", required=True)
    parser.add_argument("--install-dir", required=True)
    parser.add_argument("--exe-name", default="ImlecLauncher.exe")
    parser.add_argument("--parent-pid", type=int, default=0)
    args = parser.parse_args()

    install_dir = Path(args.install_dir).resolve()
    log_path = Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "ImlecYazilim" / "launcher_update.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        wait_for_parent(args.parent_pid)
        install_update(Path(args.package).resolve(), install_dir, args.exe_name)
        manifest = {
            "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "installDir": str(install_dir),
        }
        (install_dir / "imlec_launcher_update.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        exe = install_dir / args.exe_name
        subprocess.Popen([str(exe)], cwd=str(install_dir), close_fds=True)
        return 0
    except Exception as exc:
        log_path.write_text(str(exc), encoding="utf-8")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
