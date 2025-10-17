FROM --platform=linux/amd64 python:3.12-slim

# Set environment variables to avoid Python buffering and ensure UTF-8 encoding
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONIOENCODING=utf-8 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install Python dependencies
RUN pip install --no-cache-dir -e .

# Copy source code
COPY src/ ./src/

# Create volume for database persistence
VOLUME ["/app/data"]

# Expose port
EXPOSE 8000

# Health check (uses environment variables)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import requests, os; api_key=os.getenv('API_KEY', 'test'); exit(0 if requests.get('http://localhost:8000/health', headers={'X-API-Key': api_key}).status_code == 200 else 1)" || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8000"]