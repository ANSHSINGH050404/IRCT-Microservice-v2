@echo off
cd /d "%~dp0"

echo Starting IRCT services...

start "user-service" cmd /c "cd /d "%~dp0user-service" && bun dev"
timeout /t 3 /nobreak >nul

start "search-service" cmd /c "cd /d "%~dp0search-service" && bun run index.ts"
timeout /t 3 /nobreak >nul

start "admin-service" cmd /c "cd /d "%~dp0admin-service" && bun dev"
timeout /t 3 /nobreak >nul

start "notification-service" cmd /c "cd /d "%~dp0notification-service" && bun dev"
timeout /t 3 /nobreak >nul

start "api-gateway" cmd /c "cd /d "%~dp0api-gateway" && bun dev"
timeout /t 3 /nobreak >nul

echo All services launched. Waiting for them to be ready...
timeout /t 6 /nobreak >nul

echo.
echo Checking ports:
netstat -ano | findstr "LISTENING" | findstr ":4000 :4001 :4002 :4003"
echo.
echo If you see the ports above, services are running.
pause
