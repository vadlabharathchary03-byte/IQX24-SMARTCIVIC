@echo off
echo ========================================================
echo   Launching JanSeva - Civic Grievance Platform
echo ========================================================

echo Starting Backend Server on port 5000...
start cmd /k "cd backend && npm start"

timeout /t 2 /nobreak >nul

echo Starting Frontend Web App on port 5173...
start cmd /k "cd frontend && npm run dev"

echo ========================================================
echo   JanSeva is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo ========================================================
