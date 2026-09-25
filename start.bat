@echo off
cd /d "%~dp0"
start "" "http://localhost:5500/index.html"
python -m http.server 5500
