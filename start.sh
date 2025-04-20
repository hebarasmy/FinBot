#!/bin/bash

# Start the Flask backend in background
cd backend
gunicorn app:app --bind 0.0.0.0:5000 &
cd ..

# Start the Next.js frontend
cd frontend
npm install
npm run build
npm start
