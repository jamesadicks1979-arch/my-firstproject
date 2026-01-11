from __future__ import annotations

from my_firstproject import __version__
from my_firstproject.cli import main


def test_version_prints_version(capsys) -> None:
    code = main(["--version"])
    out = capsys.readouterr().out.strip()

    assert code == 0
    assert out == __version__


def test_default_prints_greeting(capsys) -> None:
    code = main([])
    out = capsys.readouterr().out.strip()

    assert code == 0
    assert "Hello from my-firstproject!" in out

