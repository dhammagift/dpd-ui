
python3 -m venv .venv

.venv/bin/pip3 install -r requirements.txt

bash start.sh 

exit 0
#stsrt local db
.venv/bin/uvicorn exporter.webapp.main:app --host 0.0.0.0 --port 8880


