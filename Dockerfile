FROM  python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY pyproject.toml /app/
COPY uv.lock /app/

# Install Python dependencies
RUN pip install --no-cache-dir uv && \
    uv sync --locked --no-dev

# Copy application code
COPY app /app/app
COPY alembic /app/alembic
COPY alembic.ini /app/

# Run migrations by default when the container starts
CMD ["/bin/bash", "-c", "source .venv/bin/activate && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"] 