# Use uv with Python 3.12 on Alpine
FROM ghcr.io/astral-sh/uv:python3.12-alpine

# Enable bytecode compilation for faster startup
ENV UV_COMPILE_BYTECODE=1

# Use copy mode for efficient layer caching
ENV UV_LINK_MODE=copy

# Set working directory
WORKDIR /app

# Install dependencies first (for layer caching)
COPY pyproject.toml ./
RUN uv sync --no-dev --no-install-project

# Copy application code
COPY main.py prompts.py models.py ./

# Install the project
RUN uv sync --no-dev

# Add virtual environment to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Expose port (Smithery uses 8081)
EXPOSE 8081

# Run the server
CMD ["python", "main.py"]
