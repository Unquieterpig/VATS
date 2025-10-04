#!/bin/bash

echo "Starting VATS Web Application..."
echo

echo "Installing dependencies..."
npm run install-all

echo
echo "Starting development servers..."
echo "Backend will be available at: http://localhost:3001"
echo "Frontend will be available at: http://localhost:3000"
echo

npm run dev
