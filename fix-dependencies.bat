@echo off
echo Fixing VATS Web Application Dependencies...
echo.

echo Cleaning existing node_modules and package-lock files...
if exist node_modules rmdir /s /q node_modules
if exist server\node_modules rmdir /s /q server\node_modules
if exist client\node_modules rmdir /s /q client\node_modules
if exist package-lock.json del package-lock.json
if exist server\package-lock.json del server\package-lock.json
if exist client\package-lock.json del client\package-lock.json

echo.
echo Installing dependencies with legacy peer deps...
echo Installing root dependencies...
call npm install

echo Installing server dependencies...
cd server
call npm install
cd ..

echo Installing client dependencies with forced resolution...
cd client
call npm install --legacy-peer-deps --force
cd ..

echo.
echo Dependencies fixed! You can now run start.bat
echo.
pause
