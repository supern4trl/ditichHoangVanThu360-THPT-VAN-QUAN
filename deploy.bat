
@echo off
title HOANG VAN THU 360 - GitHub Deploy
cd /d "%~dp0"

if not exist "%~dp0deploy.ps1" (
    echo [LOI] Khong tim thay file deploy.ps1!
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" %*
if errorlevel 1 (
    echo.
    echo Deploy that bai. Hay kiem tra loi o tren.
    pause
    exit /b 1
)

pause
