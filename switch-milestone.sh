#!/bin/bash

# ClipMind AI — Easy Milestone Switcher Script for Gagana

echo "=================================================="
echo "        ClipMind AI — Milestone Switcher          "
echo "=================================================="
echo ""
echo "Select the milestone branch you want to switch to:"
echo "1) Milestone 1 — Core Setup, Auth & Video Upload"
echo "2) Milestone 2 — Whisper Transcription & AI Summarization"
echo "3) Milestone 3 — Key Moments, Search Engine & Analytics"
echo "4) Milestone 4 — Docker Deployment, Testing & CI/CD"
echo ""

read -p "Enter number (1-4): " choice

case $choice in
    1)
        BRANCH="milestone-1"
        ;;
    2)
        BRANCH="milestone-2"
        ;;
    3)
        BRANCH="milestone-3"
        ;;
    4)
        BRANCH="milestone-4"
        ;;
    *)
        echo "Invalid choice! Exiting."
        exit 1
        ;;
esac

echo ""
echo "Switching to $BRANCH..."

git clean -fd backend/app/__pycache__ backend/app/api/__pycache__ backend/app/core/__pycache__ backend/app/services/__pycache__ 2>/dev/null
git checkout -f $BRANCH

echo ""
echo "=================================================="
echo "✅ Successfully switched to $BRANCH!"
echo "Read README.md in this folder for running instructions."
echo "=================================================="
