#!/bin/bash
echo "🔍 Detecting project environment..."
echo "📦 Checking for package.json..." && [ -f package.json ] && echo "✅ Node.js project detected!"
echo "📄 Checking for requirements.txt..." && [ -f requirements.txt ] && echo "✅ Python project detected!"
echo "🐳 Checking for Dockerfile..." && [ -f Dockerfile ] && echo "✅ Docker detected!"
echo "✅ Detection complete!"
