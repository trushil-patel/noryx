import logging
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from memora.config import get_settings
from memora.routes import auth, collections, connections, knowledge, system

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    get_settings()
    yield


app = FastAPI(title="Memora Backend", version="2.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(system.router)
app.include_router(auth.router)
app.include_router(knowledge.router)
app.include_router(collections.router)
app.include_router(connections.router)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(Exception)
async def unexpected_error(_: Request, exc: Exception) -> JSONResponse:
    request_id = str(uuid4())
    logger.error(
        "Unhandled request error (request_id=%s)",
        request_id,
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Unexpected server error",
            "request_id": request_id,
        },
        headers={"X-Request-ID": request_id},
    )


@app.get("/")
async def root() -> dict[str, object]:
    return {"success": True, "message": "Welcome to Memora Backend 🚀"}
