@echo off
setlocal
title Legal Arch AI - Sharing Mode

echo ===================================================
echo     LEGAL ARCH AI - LOCAL SHARING LAUNCHER
echo ===================================================
echo.

:: 1. Build Frontend Assets
echo [1/4] Building Frontend Assets...
call npm run build
if %errorlevel% neq 0 (
    echo Error building frontend assets.
    pause
    exit /b %errorlevel%
)
echo Frontend built successfully.
echo.

:: 2. Start Embedding Service
echo [2/4] Starting Embedding Service (Port 5001)...
start "Embedding Service" cmd /k "python aiservice/run_embedding_service.py"

:: 3. Start Text Extraction Service
echo [3/4] Starting Text Extraction Service (Port 5002)...
start "Text Extraction Service" cmd /k "python aiservice/run_text_extraction.py"

:: 4. Get Local IP and Start Laravel Server
echo [4/4] Starting Web Server...
echo.
echo ===================================================
echo YOUR APPLICATION WILL BE AVAILABLE AT:
echo.
for /f "tokens=2,3 delims={,}" %%a in ('"wmic nicconfig where IpEnabled=True get IpAddress /value | find "192.168""') do echo      http://%%~a:8000
echo.
echo (Share this link with other staff on the same network)
echo ===================================================
echo.

:: 5. Open Browser for Host and Start Server
echo.
echo ===================================================
echo ACCESS INSTRUCTIONS:
echo 1. FOR YOU (HOST):
echo    Opening http://localhost:8000 ...
echo.
echo 2. FOR OTHERS (NETWORK):
echo    Share the IP address shown below (e.g., http://192.168.x.x:8000)
echo ===================================================
echo.

:: Auto-open localhost for the host user
start "" "http://localhost:8000"

php artisan serve --host 0.0.0.0 --port 8000

pause
