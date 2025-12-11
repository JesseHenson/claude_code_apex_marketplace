"""Smithery configuration middleware for extracting API keys from query parameters."""

import base64
import json
from typing import Callable
from urllib.parse import parse_qs, urlparse

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class SmitheryConfigMiddleware(BaseHTTPMiddleware):
    """Middleware that extracts Smithery config from base64-encoded query parameter."""

    def __init__(self, app, set_api_key: Callable[[str], None]):
        super().__init__(app)
        self.set_api_key = set_api_key

    async def dispatch(self, request: Request, call_next):
        # Only process /mcp endpoints
        if request.url.path.startswith("/mcp"):
            try:
                # Get config from query params
                config_b64 = request.query_params.get("config")
                if config_b64:
                    # Decode base64 and parse JSON
                    config_json = base64.b64decode(config_b64).decode("utf-8")
                    config = json.loads(config_json)

                    # Extract API key
                    api_key = config.get("ANTHROPIC_API_KEY")
                    if api_key:
                        self.set_api_key(api_key)
            except Exception:
                # Silently fail - let the request continue
                pass

        return await call_next(request)


class MCPPathRedirectMiddleware(BaseHTTPMiddleware):
    """Middleware that normalizes /mcp to /mcp/ for consistent routing."""

    async def dispatch(self, request: Request, call_next):
        # Redirect /mcp to /mcp/
        if request.url.path == "/mcp":
            scope = request.scope
            scope["path"] = "/mcp/"
            scope["raw_path"] = b"/mcp/"

        return await call_next(request)
