from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from memora.config import get_settings
from memora.routes import auth, collections, connections, knowledge, system


@asynccontextmanager
async def lifespan(_: FastAPI):
    get_settings()
    yield


app = FastAPI(title="Memora Backend", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=get_settings().frontend_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(system.router)
app.include_router(auth.router)
app.include_router(knowledge.router)
app.include_router(collections.router)
app.include_router(connections.router)


@app.exception_handler(Exception)
async def unexpected_error(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"success": False, "message": "Unexpected server error", "error": str(exc)})


@app.get("/")
async def root() -> dict[str, object]:
    return {"success": True, "message": "Welcome to Memora Backend 🚀"}
