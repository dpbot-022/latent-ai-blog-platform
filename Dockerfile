# ==============================================================================
# Production Dockerfile for NexusAI Platform
# Implements multi-stage best practices, non-root user, and health check probes
# ==============================================================================
FROM python:3.12-slim AS runtime

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install system dependencies (curl for health check)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Create non-root application user for container security (Least Privilege)
RUN useradd -u 1001 appuser && \
    mkdir -p frontend/uploads && \
    chown -R appuser:appuser /app

USER appuser

# Health check probe (Day 5 Observability)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["python", "run.py"]
