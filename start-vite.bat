@echo off
echo Starting VATS Web Application (Vite Version)...
echo.

echo Installing dependencies...
echo Installing root dependencies...
call npm install

echo Installing server dependencies...
cd server
call npm install
cd ..

echo Installing client dependencies (Vite)...
cd client-vite
call npm install
cd ..

echo.
echo Starting development servers...
echo Backend will be available at: http://localhost:3001
echo Frontend will be available at: http://localhost:3000
echo.

call npm run dev-vite
