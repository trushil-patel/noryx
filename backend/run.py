import uvicorn
from memora.config import get_settings

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run("memora.main:app", host="0.0.0.0", port=settings.port, reload=True)
