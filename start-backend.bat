@echo off
echo Starting RAG Backend Server...
cd /d "%~dp0backend"
python main.py
pause