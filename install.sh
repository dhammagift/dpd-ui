.venv/bin/pip3 install uvicorn httpx fastapi jinja2


#stsrt local db
.venv/bin/uvicorn exporter.webapp.main:app --host 0.0.0.0 --port 8880


