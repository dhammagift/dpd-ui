import re
from urllib.parse import urlencode

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI()

# --- Middleware ---

@app.middleware("http")
async def clean_query_params(request: Request, call_next):
    """
    Очищает query-параметры.
    Основные изменения:
    1. Удаляет URL.
    2. Убирает кавычки и скобки.
    3. Заменяет любые пробельные символы (включая переносы строк из соцсетей) на один пробел.
    4. Приводит к нижнему регистру.
    """
    query_params = dict(request.query_params)
    changed = False
    
    # Параметры, которые нужно обрабатывать
    target_params = ["q", "search", "q1", "q2"]

    for param in target_params:
        if param in query_params:
            original = query_params[param]
            
            # 1. Удаляем URL (начинающиеся с http/https)
            cleaned = re.sub(r'https?://\S+', '', original)
            
            # 2. Удаляем спецсимволы (кавычки, скобки)
            cleaned = re.sub(r'["\'()[\]]', '', cleaned)
            
            # 3. ВАЖНО: Заменяем любые пробельные символы (\n, \t, множество пробелов) на один пробел
            # Это решает проблему "обрезания", если текст был вставлен с переносами строк
            cleaned = re.sub(r'\s+', ' ', cleaned)
            
            # 4. Финальная зачистка краев и нижний регистр
            cleaned = cleaned.strip().lower()
            
            if original != cleaned:
                query_params[param] = cleaned
                changed = True
    
    if changed:
        # doseq=True важно, если есть списки, но здесь мы работаем со строками
        new_query = urlencode(query_params, doseq=True)
        request.scope["query_string"] = new_query.encode("utf-8")
    
    return await call_next(request)

# GZip сжатие
app.add_middleware(GZipMiddleware, minimum_size=500)

class StaticCacheMiddleware(BaseHTTPMiddleware):
    """Добавляет Cache-Control для статики"""
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        # Кэшируем только запросы к статике
        if request.url.path.startswith(("/static/", "/ru/static/")):
            response.headers["Cache-Control"] = "public, max-age=84000"
        return response

app.add_middleware(StaticCacheMiddleware)


# --- Static Files & Templates ---

app.mount("/static", StaticFiles(directory="exporter/webapp/static"), name="static")
app.mount("/ru/static", StaticFiles(directory="exporter/webapp/static"), name="ru_static")
app.mount("/.well-known", StaticFiles(directory="exporter/webapp/static/.well-known", html=False), name="well_known")

templates = Jinja2Templates(directory="exporter/webapp/templates")
templates_ru = Jinja2Templates(directory="exporter/webapp/ru_templates")


# --- Global Resources ---

# Пытаемся загрузить статику в память (опционально)
try:
    with open("exporter/webapp/static/dpd.css") as f:
        dpd_css = f.read()
    with open("exporter/webapp/static/dpd.js") as f:
        dpd_js = f.read()
    with open("exporter/webapp/static/home_simple.css") as f:
        home_simple_css = f.read()
except FileNotFoundError:
    print("Warning: Static files not found. Ensure paths are correct.")
    dpd_css, dpd_js, home_simple_css = "", "", ""


# --- Configuration ---

ENDPOINTS = {
    "en": {
        "base_url": "https://dpdict.net",
        "search_path": "/search_json"
    },
    "ru": {
        "base_url": "https://ru.dpdict.net",
        "search_path": "/search_json"
    }
}

TIMEOUT = 30.0
BD_COUNT = "360k+"


# --- Helpers ---
async def fetch_from_backend(lang: str, params: dict, try_fallback: bool = True):
    """
    Делает запрос к бэкенду dpdict.net.
    Принимает уже очищенные параметры (целую фразу).
    Если есть кириллица — сразу ищет в русском.
    Если ничего не найдено на текущем языке — делает один резервный запрос на другой.
    """
    q = params.get("q", "")
    
    # Если в запросе есть кириллица, принудительно устанавливаем русский язык
    if try_fallback and re.search(r'[а-яА-ЯёЁ]', q):
        lang = "ru"
        try_fallback = False  # Фоллбэк на английский для кириллицы не имеет смысла
        
    config = ENDPOINTS.get(lang)
    if not config:
        raise HTTPException(status_code=400, detail="Invalid language")
    
    url = f"{config['base_url']}{config['search_path']}"
    
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            # Фоллбэк: если это первая попытка, результатов нет и текст латиницей
            if try_fallback and not data.get("dpd_html"):
                fallback_lang = "ru" if lang == "en" else "en"
                fallback_data = await fetch_from_backend(
                    fallback_lang, 
                    params, 
                    try_fallback=False
                )
                
                # Если во втором запросе есть результат, отдаем его
                if fallback_data.get("dpd_html"):
                    return fallback_data

            return data

    except httpx.ConnectTimeout:
        raise HTTPException(
            status_code=504,
            detail="Backend server timeout. Please try again later."
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not connect to backend server: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Backend request failed: {str(e)}"
        )


# --- Routes ---

@app.get("/bd")
def bold_definitions_page(request: Request):
    return templates.TemplateResponse(
        "home.html", {"request": request, "dpd_results": "", "bd_count": BD_COUNT}
    )

@app.get("/")
def home_page(request: Request):
    return templates.TemplateResponse(
        "home.html", {"request": request, "dpd_results": ""}
    )

@app.get("/ru")
def home_page_ru(request: Request):
    return templates_ru.TemplateResponse(
        "home.html", {"request": request, "dpd_results": ""}
    )

@app.get("/search_html", response_class=HTMLResponse)
async def db_search_html(request: Request, q: str):
    data = await fetch_from_backend("en", {"q": q})
    return templates.TemplateResponse(
        "home.html",
        {
            "request": request,
            "q": q,  # Возвращаем в шаблон полный запрос
            "dpd_results": data["dpd_html"],
        },
    )

@app.get("/ru/search_html", response_class=HTMLResponse)
async def db_search_html_ru(request: Request, q: str):
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
    data = await fetch_from_backend("en", {"q": q})
    return JSONResponse(content=data)

@app.get("/ru/search_json", response_class=JSONResponse)
async def db_search_json_ru(request: Request, q: str):
    data = await fetch_from_backend("ru", {"q": q})
    return JSONResponse(content=data)

@app.get("/gd", response_class=HTMLResponse)
async def db_search_gd(request: Request, search: str):
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

    except httpx.ConnectTimeout:
        raise HTTPException(status_code=504, detail="Backend server timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Connection error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8080, reload=True)
