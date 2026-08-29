# Nixpacks' runtime image had neither `python` nor `uv` on PATH, so the app
# crash-looped on startup while the deploy still reported success. A Dockerfile
# removes the guesswork: we control exactly what is installed and on PATH.
FROM python:3.14-slim

WORKDIR /app

# uv installs straight from uv.lock, so deploys match local versions exactly.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Dependencies first: this layer is cached unless the lockfile changes.
# src/ is needed here because uv installs the project itself, not just its deps.
COPY pyproject.toml uv.lock README.md ./
COPY src ./src
RUN uv sync --frozen --no-dev

# Application code, and the JSON fixtures seeding reads at startup.
COPY backend ./backend

# Put the project venv first so plain `python` and `uvicorn` resolve to it.
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

# Seeding is idempotent (it skips tables that already have rows), so running it
# on every boot is safe and means a fresh database needs no manual step.
CMD ["sh", "-c", "python -m backend.init_db && uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
