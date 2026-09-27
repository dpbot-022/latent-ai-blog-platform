import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from backend.app.routers.system import REQUEST_METRICS
from backend.app.core.config import settings

# In-memory sliding rate limiter per IP address (Day 4: Rate Limiting)
ip_request_timestamps = defaultdict(list)

class ObservabilityAndRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Rate Limiting Check (Only on write or auth endpoints)
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()

        # Clean old timestamps (> 60 seconds)
        ip_request_timestamps[client_ip] = [
            t for t in ip_request_timestamps[client_ip] if now - t < 60
        ]

        # Check rate limit on API mutation requests
        is_mutation = request.method in ["POST", "PUT", "DELETE"] and request.url.path.startswith("/api/")
        if is_mutation:
            if len(ip_request_timestamps[client_ip]) >= settings.RATE_LIMIT_PER_MINUTE:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Rate limit exceeded. Please wait before submitting more requests.",
                        "error_code": "RATE_LIMIT_EXCEEDED"
                    }
                )
            ip_request_timestamps[client_ip].append(now)

        # 2. Observability & Latency Tracking
        start_time = time.perf_counter()
        
        try:
            response: Response = await call_next(request)
        except Exception as exc:
            # Standardized exception handling
            REQUEST_METRICS["total_requests"] += 1
            raise exc

        process_time_ms = (time.perf_counter() - start_time) * 1000
        
        # Update metrics
        REQUEST_METRICS["total_requests"] += 1
        REQUEST_METRICS["total_time_ms"] += process_time_ms

        # Add custom observability headers
        response.headers["X-Process-Time-Ms"] = f"{process_time_ms:.2f}"
        response.headers["X-Platform-Engine"] = "NexusAI-Production-v1"
        return response
