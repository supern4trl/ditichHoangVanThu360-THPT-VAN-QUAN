
@echo off
setlocal EnableExtensions
title UPDATE DU AN HOANG VAN THU 360

:: Di chuyen den thu muc chua file BAT
cd /d "%~dp0"

:: Cau hinh
set "BRANCH=main"
set "COMMIT_MSG=Update project"

echo.
echo ==========================================
echo       UPDATE DU AN LEN GITHUB
echo ==========================================
echo.
echo Thu muc: %CD%
echo.

:: 1. Kiem tra Git da cai dat
where git >nul 2>&1
if errorlevel 1 (
    echo [LOI] Khong tim thay Git.
    echo Hay cai dat Git hoac kiem tra PATH.
    goto :ERROR
)

:: 2. Kiem tra day co phai thu muc Git
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo [LOI] Thu muc nay khong phai Git repository.
    echo Hay dat file update.bat vao thu muc du an.
    goto :ERROR
)

:: 3. Kiem tra nhanh hien tai
for /f "delims=" %%B in ('git branch --show-current') do set "CURRENT_BRANCH=%%B"

if not "%CURRENT_BRANCH%"=="%BRANCH%" (
    echo [LOI] Nhanh hien tai: %CURRENT_BRANCH%
    echo Script yeu cau nhanh: %BRANCH%
    goto :ERROR
)

:: 4. Hien thi cac file thay doi
echo [1/5] Kiem tra thay doi...
git status --short
echo.

:: 5. Them cac file thay doi
echo [2/5] Them file...
git add -A
if errorlevel 1 (
    echo [LOI] Khong the git add.
    goto :ERROR
)

:: 6. Kiem tra co thay doi de commit khong
git diff --cached --quiet
if not errorlevel 1 (
    echo Khong co thay doi moi de commit.
    goto :PUSH
)

:: 7. Tao commit
echo.
echo [3/5] Tao commit...
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo [LOI] Commit that bai.
    goto :ERROR
)

:: 8. Day len GitHub
:PUSH
echo.
echo [4/5] Day code len GitHub...
git push -u origin %BRANCH%
if errorlevel 1 (
    echo.
    echo [LOI] Push that bai.
    echo Kiem tra mang, dang nhap va remote GitHub.
    goto :ERROR
)

:: 9. Xac nhan
echo.
echo [5/5] Kiem tra trang thai...
git status

echo.
echo ==========================================
echo       CAP NHAT HOAN TAT!
echo ==========================================
echo.
pause
exit /b 0

:ERROR
echo.
echo ==========================================
echo       CAP NHAT THAT BAI!
echo ==========================================
echo Hay doc loi phia tren de xu ly.
echo.
pause
exit /b 1
