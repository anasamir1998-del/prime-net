@echo off
echo Starting FTP Upload Script...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0ftp_upload.ps1"
pause
