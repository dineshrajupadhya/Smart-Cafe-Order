@echo off
echo ========================================
echo   Smart Cafeteria Management System
echo ========================================
echo.
echo Starting Backend Server...
start "SmartCafe-Backend" /min cmd /c "cd /d "%~dp0backend" && node server.js"
timeout /t 3 /nobreak >nul
echo Backend started on http://localhost:5000
echo.
echo Starting Frontend...
start "SmartCafe-Frontend" cmd /c "cd /d "%~dp0frontend" && npm start"
echo Frontend starting on http://localhost:3000
echo.
echo ========================================
echo   Login Credentials:
echo   Admin: admin@smartcafe.com / admin123
echo   User:  john@example.com / user123
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
