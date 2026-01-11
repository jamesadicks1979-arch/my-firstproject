# my-firstproject

A small starter Python project scaffold (package + CLI + tests).

## Quickstart

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -U pip
python3 -m pip install -e ".[dev]"
```

Run the CLI:

```bash
my-firstproject
my-firstproject --version
```

Or run as a module:

```bash
python3 -m my_firstproject --version
```

## Dev

Run tests:

```bash
python3 -m pytest
```

Run lint:

```bash
python3 -m ruff check .
```