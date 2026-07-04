from __future__ import annotations

import importlib.util
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "imlec_launcher_updater.py"
SPEC = importlib.util.spec_from_file_location("imlec_launcher_updater", MODULE_PATH)
assert SPEC and SPEC.loader
updater = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(updater)


def test_program_files_install_requires_elevation(monkeypatch) -> None:
    monkeypatch.setenv("ProgramFiles", r"C:\Program Files")
    monkeypatch.setenv("ProgramFiles(x86)", r"C:\Program Files (x86)")

    assert updater.requires_elevation(Path(r"C:\Program Files\Imlec Yazilim Launcher"))
    assert not updater.requires_elevation(Path(r"C:\Users\Public\Imlec Yazilim Launcher"))
