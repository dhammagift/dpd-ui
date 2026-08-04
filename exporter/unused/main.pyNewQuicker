from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import re
import httpx
from urllib.parse import urlencode
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

# --- ОБЪЕДИНЕННЫЙ MIDDLEWARE ---

@app.middleware("http")
async def process_query_params_middleware(request: Request, call_next):
    """
    Чистит URL, спецсимволы и нормализует пробелы.
    Исправлено: корректная обработка строк с пробелами.
    """
    if not request.query_params:
        return await call_next(request)

    query_params = dict(request.query_params)
    changed = False
    target_params = ["q", "search", "q1", "q2"]
    
    for param in target_params:
        if param in query_params and query_params[param]:
            original = query_params[param]
            
            # Удаляем ссылки
            cleaned = re.sub(r'https?://[^\s]+', '', original)
            # Удаляем скобки и кавычки
            cleaned = re.sub(r'["\'()[\]]', '', cleaned)
            # Заменяем множественные пробелы на одинарные
            cleaned = re.sub(r'\s+', ' ', cleaned)
            # Убираем пробелы в начале и конце
            cleaned = cleaned.strip()
            # В нижний регистр
            cleaned = cleaned.lower()
            
            if original != cleaned:
                query_params[param] = cleaned
                changed = True
    
    if changed:
        # Важно: кодируем обратно для передачи в scope
        new_query = urlencode(query_params, doseq=True)
        request.scope["query_string"] = new_query.encode("utf-8")
    
    return await call_next(request)

# Middleware для кэширования статики
class StaticCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.url.path.startswith(("/static/", "/ru/static/")):
            response.headers["Cache-Control"] = "public, max-age=84000"
        return response

app.add_middleware(StaticCacheMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=500)

# --- STATIC & TEMPLATES ---

app.mount("/static", StaticFiles(directory="exporter/webapp/static"), name="static")
app.mount("/ru/static", StaticFiles(directory="exporter/webapp/static"), name="ru_static")
app.mount("/.well-known", StaticFiles(directory="exporter/webapp/static/.well-known", html=False), name="well_known")

templates = Jinja2Templates(directory="exporter/webapp/templates")
templates_ru = Jinja2Templates(directory="exporter/webapp/ru_templates")

# Загрузка ресурсов
def load_static(path):
    try:
        with open(path, "r", encoding="utf-8") as f: return f.read()
    except: return ""

dpd_css = load_static("exporter/webapp/static/dpd.css")
dpd_js = load_static("exporter/webapp/static/dpd.js")
home_simple_css = load_static("exporter/webapp/static/home_simple.css")

ENDPOINTS = {
    "en": {"base_url": "https://dpdict.net", "search_path": "/search_json"},
    "ru": {"base_url": "https://ru.dpdict.net", "search_path": "/search_json"}
}
TIMEOUT = 30.0
bd_count = "360k+"

# --- HELPERS ---

async def fetch_from_backend(lang: str, params: dict):
    config = ENDPOINTS.get(lang)
    url = f"{config['base_url']}{config['search_path']}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        print(f"Backend Error: {e}")
        raise HTTPException(status_code=502, detail="Backend unavailable")

# --- ROUTES ---

@app.get("/", response_class=HTMLResponse)
async def home_page(request: Request, q: str = None):
    # Если q передано (через веб-интерфейс или шеринг), сразу ищем
    if q:
        data = await fetch_from_backend("en", {"q": q})
        return templates.TemplateResponse("home.html", {
            "request": request, "q": q, "dpd_results": data.get("dpd_html", "")
        })
    return templates.TemplateResponse("home.html", {"request": request, "dpd_results": ""})

@app.get("/ru", response_class=HTMLResponse)
async def home_page_ru(request: Request, q: str = None):
    if q:
        data = await fetch_from_backend("ru", {"q": q})
        return templates_ru.TemplateResponse("home.html", {
            "request": request, "q": q, "dpd_results": data.get("dpd_html", "")
        })
    return templates_ru.TemplateResponse("home.html", {"request": request, "dpd_results": ""})

@app.get("/search_html", response_class=HTMLResponse)
async def db_search_html(request: Request, q: str = ""):
    data = await fetch_from_backend("en", {"q": q})
    return templates.TemplateResponse("home.html", {
        "request": request, "q": q, "dpd_results": data.get("dpd_html", "")
    })

@app.get("/ru/search_html", response_class=HTMLResponse)
async def db_search_html_ru(request: Request, q: str = ""):
    data = await fetch_from_backend("ru", {"q": q})
    return templates_ru.TemplateResponse("home.html", {
        "request": request, "q": q, "dpd_results": data.get("dpd_html", "")
    })

@app.get("/gd", response_class=HTMLResponse)
async def db_search_gd(request: Request, search: str = ""):
    data = await fetch_from_backend("en", {"q": search})
    return templates.TemplateResponse("home_simple.html", {
        "request": request, "search": search, "dpd_results": data.get("dpd_html", ""),
        "summary": data.get("summary_html", ""), "dpd_css": dpd_css, "dpd_js": dpd_js, "home_simple_css": home_simple_css
    })

@app.get("/ru/gd", response_class=HTMLResponse)
async def db_search_gd_ru(request: Request, search: str = ""):
    data = await fetch_from_backend("ru", {"q": search})
    return templates.TemplateResponse("home_simple.html", {
        "request": request, "search": search, "dpd_results": data.get("dpd_html", ""),
        "summary": data.get("summary_html", ""), "dpd_css": dpd_css, "dpd_js": dpd_js, "home_simple_css": home_simple_css
    })

# Оставил старые API для совместимости, если фронтенд их дергает напрямую
@app.get("/search_json", response_class=JSONResponse)
async def db_search_json(q: str):
    return await fetch_from_backend("en", {"q": q})

@app.get("/ru/search_json", response_class=JSONResponse)
async def db_search_json_ru(q: str):
    return await fetch_from_backend("ru", {"q": q})

@app.get("/bd", response_class=HTMLResponse)
def bold_definitions_page(request: Request):
    return templates.TemplateResponse("home.html", {"request": request, "dpd_results": "", "bd_count": bd_count})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.1.1.1", port=8080, reload=True)
