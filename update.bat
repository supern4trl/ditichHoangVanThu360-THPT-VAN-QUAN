
@echo off
title Cap nhat GitHub
cd /d "%~dp0"

echo =================================
echo     CAP NHAT DU AN LEN GITHUB
echo =================================
echo.

git status
echo.
git add -A

git diff --cached --quiet
if %errorlevel%==0 (
    echo Khong co thay doi moi de commit.
    git push
    pause
    exit /b
)

git commit -m "Update project"
if errorlevel 1 (
    echo Commit that bai!
    pause
    exit /b 1
)

git push
echo.
echo Da ket thuc. Hay kiem tra thong bao phia tren.
pause
