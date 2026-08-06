from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import httpx
from httpx import ConnectTimeout, RequestError

app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=500)
app.mount("/static", StaticFiles(directory="exporter/webapp/static"), name="static")
app.mount("/ru/static", StaticFiles(directory="exporter/webapp/static"), name="ru_static")

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

# API endpoints configuration
ENDPOINTS = {
    "en": {
        "base_url": "https://dpdict.net",
        "search_path": "/search_json"
    },
    "ru": {
        "base_url": "https://dpdict.net",
       #"base_url": "http://localhost:8080",
      #  "base_url": "https://dict.dhamma.gift",
        "search_path": "/ru/search_json"
    }
}
TIMEOUT = 30.0  # seconds

# Добавлено: переменная bd_count (можно заменить на актуальное значение)
bd_count = "360k+"  # Или получить из бэкенда, если нужно

def replace_domain_in_content(content):
    """Replace thebuddhaswords.net and www.thebuddhaswords.net with dhamma.gift/bw"""
    def replace_domains(text):
        return (text
                .replace("www.thebuddhaswords.net", "dhamma.gift/bw")
                .replace("thebuddhaswords.net", "dhamma.gift/bw"))

    if isinstance(content, str):
        return replace_domains(content)
    elif isinstance(content, dict):
        return {k: replace_domain_in_content(v) for k, v in content.items()}
    elif isinstance(content, list):
        return [replace_domain_in_content(item) for item in content]
    return content
    
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
            data = response.json()
            return replace_domain_in_content(data)
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
        # Определяем URL бэкенда на основе языка
        backend_url = f"{ENDPOINTS['en']['base_url']}/bd_search"
        
        # Параметры запроса
        params = {
            "q1": q1,
            "q2": q2,
            "option": option
        }

        # Делаем запрос к бэкенду
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(backend_url, params=params)
            response.raise_for_status()
            
            # Если бэкенд возвращает HTML (как в оригинале)
            if "text/html" in response.headers.get("content-type", ""):
                html_content = response.text
                html_content = html_content.replace("thebuddhaswords.net", "dhamma.gift/bw")
                return HTMLResponse(content=html_content)
            
            # Если бэкенд возвращает JSON (альтернативный вариант)
            data = response.json()
            data = replace_domain_in_content(data)
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.1.1.1",
        port=8080,
        reload=True,
        reload_dirs="exporter/webapp/",
    )
    

#.venv/bin/uvicorn exporter.webapp.main:app --host 0.0.0.0 --port 8880 --reload --reload-dir exporter/webapp
#.venv/bin/uvicorn exporter.webapp.main:app --host 0.0.0.0 --port 8880
