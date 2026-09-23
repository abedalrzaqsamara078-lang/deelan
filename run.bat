@echo off
title Forever With You - Deelan
cd /d "%~dp0"
echo Starting Romantic Beating Heart for Deelan...
python main.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Pygame encountered an issue, launching Tkinter version...
    python heart_tkinter.py
)
pause
