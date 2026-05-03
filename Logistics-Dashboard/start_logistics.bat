@echo off
title Logistics Intelligence Launcher
echo 1/2: Sincronizando datos de Almacenes Externos...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\xpall\Source\Main\Logistics-Dashboard\scripts\sync_external_warehouses.ps1"

echo.
echo 2/2: Iniciando Logistics Intelligence Dashboard...
cd /d "C:\Users\xpall\Source\Main\Logistics-Dashboard"

start "" "http://localhost:3000"
npm run dev

pause
