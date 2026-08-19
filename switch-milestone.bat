@echo off
cls
echo ==================================================
echo         ClipMind AI -- Milestone Switcher          
echo ==================================================
echo.
echo Select the milestone branch you want to switch to:
echo 1) Milestone 1 -- Core Setup, Auth ^& Video Upload
echo 2) Milestone 2 -- Whisper Transcription ^& AI Summarization
echo 3) Milestone 3 -- Key Moments, Search Engine ^& Analytics
echo 4) Milestone 4 -- Docker Deployment, Testing ^& CI/CD
echo.

set /p choice="Enter number (1-4): "

if "%choice%"=="1" set BRANCH=milestone-1
if "%choice%"=="2" set BRANCH=milestone-2
if "%choice%"=="3" set BRANCH=milestone-3
if "%choice%"=="4" set BRANCH=milestone-4

if "%BRANCH%"=="" (
    echo.
    echo Invalid choice! Exiting.
    pause
    exit /b 1
)

echo.
echo Switching to %BRANCH%...

git checkout -f %BRANCH%

echo.
echo ==================================================
echo [OK] Successfully switched to %BRANCH%!
echo Read README.md in this folder for running instructions.
echo ==================================================
echo.
pause
