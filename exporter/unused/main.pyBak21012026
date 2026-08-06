from fastapi import FastAPI, Request, HTTPException

from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import re
import httpx
from httpx import ConnectTimeout, RequestError
from urllib.parse import parse_qs, urlencode
from fastapi.staticfiles import StaticFiles
from fastapi.middleware import Middleware
from starlette.middleware import Middleware as StarletteMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

async def clean_query_params(request: Request, call_next):
    # Получаем текущие query-параметры
    query_params = dict(request.query_params)
    
    # Очищаем нужные параметры (q, search, q1, q2 и т.д.)
    for param in ["q", "search", "q1", "q2"]:
        if param in query_params:
            original = query_params[param]
            
            # Применяем очистку
            cleaned = re.sub(r'https?://\S+', '', original)  # Удаляем URL
            cleaned = re.sub(r'["\'()[\]]', '', cleaned)      # Удаляем кавычки и скобки
            cleaned = cleaned.strip()  # Удаляем лишние пробелы
            cleaned = cleaned.lower()  # Приводим к lowercase
            
            if original != cleaned:
                query_params[param] = cleaned
    
    # Если параметры изменились - обновляем URL
    if query_params != request.query_params:
        new_query = urlencode(query_params, doseq=True)
        request.scope["query_string"] = new_query.encode("utf-8")
    
    return await call_next(request)

# Добавляем middleware в приложение (в начало, перед другими middleware)
app.middleware("http")(clean_query_params)


@app.middleware("http")
async def lowercase_query_params_middleware(request: Request, call_next):
    # Получаем query-параметры
    query_params = dict(request.query_params)
    
    # Приводим нужные параметры к lowercase
    for param in ["q", "search", "q1", "q2"]:
        if param in query_params:
            query_params[param] = query_params[param].lower()
    
    # Обновляем URL (если параметры изменились)
    if query_params != request.query_params:
        new_query = urlencode(query_params, doseq=True)
        request.scope["query_string"] = new_query.encode("utf-8")
    
    return await call_next(request)

app.add_middleware(GZipMiddleware, minimum_size=500)
# Middleware для добавления заголовков к статике
class StaticCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if request.url.path.startswith(("/static/", "/ru/static/")):
            response.headers["Cache-Control"] = "public, max-age=84000"  # 1 день
        return response

# Добавляем middleware перед монтированием статики
app.add_middleware(StaticCacheMiddleware)

# Монтируем статические файлы (БЕЗ параметра headers)
# Корректное монтирование статических файлов
app.mount("/static", StaticFiles(directory="exporter/webapp/static"), name="static")
app.mount("/ru/static", StaticFiles(directory="exporter/webapp/static"), name="ru_static")
app.mount("/.well-known", StaticFiles(directory="exporter/webapp/static/.well-known", html=False), name="well_known")
# Set up templates
templates = Jinja2Templates(directory="exporter/webapp/templates")
templates_ru = Jinja2Templates(directory="exporter/webapp/ru_templates")

# Global CSS and JS
with open("exporter/webapp/static/dpd.css") as f:
    dpd_css = f.read()

with open("exporter/webapp/static/dpd.js") as f:
    dpd_js = f.read()

with open("exporter/webapp/static/home_simple.css") as f:
    home_simple_css = f.read()

# API endpoints configuration       "base_url": "http://dhamma.gift:8080",         "base_url": "http://dhamma.gift:8080",
ENDPOINTS = {
    "en": {
        "base_url": "https://dpdict.net",
        "search_path": "/search_json"
    },
    "ru": {
        "base_url": "https://ru.dpdict.net",
        #"base_url": "https://dpdict.net",
        "search_path": "/search_json"
    }
}

TIMEOUT = 30.0  # seconds

bd_count = "360k+"

@app.get("/bd")
def bold_definitions_page(request: Request, response_class=HTMLResponse):
    """Bold definitions landing page"""
    return templates.TemplateResponse(
        "home.html", {"request": request, "dpd_results": "", "bd_count": bd_count}
    )

async def fetch_from_backend(lang: str, params: dict):
    config = ENDPOINTS.get(lang)
    if not config:
        raise HTTPException(status_code=400, detail="Invalid language")
    
    url = f"{config['base_url']}{config['search_path']}"
    
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
    except ConnectTimeout:
        raise HTTPException(
            status_code=504,
            detail="Backend server timeout. Please try again later."
        )
    except RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not connect to backend server: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Backend request failed: {str(e)}"
        )

@app.get("/")
def home_page(request: Request, response_class=HTMLResponse):
    """Home page."""
    return templates.TemplateResponse(
        "home.html", {"request": request, "dpd_results": ""}
    )

@app.get("/ru")
def home_page_ru(request: Request, response_class=HTMLResponse):
    """Russian home page"""
    return templates_ru.TemplateResponse(
        "home.html", {"request": request, "dpd_results": ""}
    )

@app.get("/search_html", response_class=HTMLResponse)
async def db_search_html(request: Request, q: str):
    """Returns HTML from English backend."""
    data = await fetch_from_backend("en", {"q": q})
    return templates.TemplateResponse(
        "home.html",
        {
            "request": request,
            "q": q,
            "dpd_results": data["dpd_html"],
        },
    )

@app.get("/ru/search_html", response_class=HTMLResponse)
async def db_search_html_ru(request: Request, q: str):
    """Returns HTML from Russian backend."""
    data = await fetch_from_backend("ru", {"q": q})
    return templates_ru.TemplateResponse(
        "home.html",
        {
            "request": request,
            "q": q,
            "dpd_results": data["dpd_html"],
        },
    )

@app.get("/search_json", response_class=JSONResponse)
async def db_search_json(request: Request, q: str):
    """Proxies search to English backend."""
    data = await fetch_from_backend("en", {"q": q})
    return JSONResponse(content=data)

@app.get("/ru/search_json", response_class=JSONResponse)
async def db_search_json_ru(request: Request, q: str):
    """Proxies search to Russian backend."""
    data = await fetch_from_backend("ru", {"q": q})
    return JSONResponse(content=data)

@app.get("/gd", response_class=HTMLResponse)
async def db_search_gd(request: Request, search: str):
    """Returns pure HTML from English backend for GoldenDict and MDict."""
    data = await fetch_from_backend("en", {"q": search})
    return templates.TemplateResponse(
        "home_simple.html",
        {
            "request": request,
            "search": search,
            "dpd_results": data["dpd_html"],
            "summary": data["summary_html"],
            "dpd_css": dpd_css,
            "dpd_js": dpd_js,
            "home_simple_css": home_simple_css,
        },
    )

@app.get("/ru/gd", response_class=HTMLResponse)
async def db_search_gd_ru(request: Request, search: str):
    """Returns pure HTML from Russian backend for GoldenDict and MDict."""
    data = await fetch_from_backend("ru", {"q": search})
    return templates.TemplateResponse(
        "home_simple.html",
        {
            "request": request,
            "search": search,
            "dpd_results": data["dpd_html"],
            "summary": data["summary_html"],
            "dpd_css": dpd_css,
            "dpd_js": dpd_js,
            "home_simple_css": home_simple_css,
        },
    )

@app.get("/bd_search", response_class=HTMLResponse)
async def db_search_bd(
    request: Request,
    q1: str = "",
    q2: str = "",
    option: str = "starts_with"
):
    """Search route for bold definitions (proxied to backend)"""
    try:
        backend_url = f"{ENDPOINTS['en']['base_url']}/bd_search"
        params = {"q1": q1, "q2": q2, "option": option}

        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(backend_url, params=params)
            response.raise_for_status()
            
            if "text/html" in response.headers.get("content-type", ""):
                return HTMLResponse(content=response.text)
            
            data = response.json()
            return templates.TemplateResponse(
                "bold_definitions.html",
                {
                    "request": request,
                    "results": data.get("results", []),
                    "search_1": q1,
                    "search_2": q2,
                    "search_option": option,
                    "message": data.get("message", ""),
                    "too_many_results": data.get("too_many_results", False),
                    "history": data.get("history", [])
                }
            )

    except ConnectTimeout:
        raise HTTPException(status_code=504, detail="Backend server timeout")
    except RequestError as e:
        raise HTTPException(status_code=502, detail=f"Connection error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.1.1.1", port=8080, reload=True)
    

# .venv/bin/uvicorn exporter.webapp.main:app --host 0.0.0.0 --port 8880 --reload --reload-dir exporter/webapp
# .venv/bin/uvicorn exporter.webapp.main:app --host 0.0.0.0 --port 8880
