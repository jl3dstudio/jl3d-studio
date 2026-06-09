#!/bin/bash
set -e
cd frontend
npm install --include=dev
npm run build
