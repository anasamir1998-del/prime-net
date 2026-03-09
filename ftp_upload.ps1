$ftpHost = "ftp://82.29.191.103"
$ftpUser = "u127645123"
$ftpPass = "Prime@2026Net"
$localPath = "c:\Users\anasa\OneDrive\Desktop\Prime-Net"
$remotePath = "/domains/prime-net.sa/public_html"

function Upload-FtpFile($localFile, $remoteFile) {
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            $uri = "$ftpHost$remoteFile"
            $ftpRequest = [System.Net.FtpWebRequest]::Create($uri)
            $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
            $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
            $ftpRequest.UseBinary = $true
            $ftpRequest.UsePassive = $true
            $ftpRequest.KeepAlive = $false
            $ftpRequest.Timeout = 60000
            
            $fileContent = [System.IO.File]::ReadAllBytes($localFile)
            $ftpRequest.ContentLength = $fileContent.Length
            
            $requestStream = $ftpRequest.GetRequestStream()
            $requestStream.Write($fileContent, 0, $fileContent.Length)
            $requestStream.Close()
            
            $response = $ftpRequest.GetResponse()
            $sizeKB = [math]::Round($fileContent.Length / 1024, 1)
            Write-Host "[OK] $remoteFile ($sizeKB KB)" -ForegroundColor Green
            $response.Close()
            return $true
        } catch {
            Write-Host "[RETRY $attempt/3] $remoteFile - $($_.Exception.Message)" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
    Write-Host "[FAIL] $remoteFile" -ForegroundColor Red
    return $false
}

function Create-FtpDirectory($remoteDirPath) {
    try {
        $uri = "$ftpHost$remoteDirPath"
        $ftpRequest = [System.Net.FtpWebRequest]::Create($uri)
        $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
        $ftpRequest.UsePassive = $true
        $ftpRequest.KeepAlive = $false
        $response = $ftpRequest.GetResponse()
        Write-Host "[DIR+] Created: $remoteDirPath" -ForegroundColor Cyan
        $response.Close()
    } catch {
        Write-Host "[DIR ] Exists: $remoteDirPath" -ForegroundColor Yellow
    }
}

$successCount = 0
$failCount = 0

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Re-uploading Prime-Net to Hostinger" -ForegroundColor Cyan
Write-Host "  Target: $remotePath" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Create directories
Write-Host "--- Creating directories ---" -ForegroundColor Cyan
Create-FtpDirectory "$remotePath/css"
Create-FtpDirectory "$remotePath/js"
Create-FtpDirectory "$remotePath/img"
Create-FtpDirectory "$remotePath/pages"

$imgSubDirs = Get-ChildItem -Path "$localPath\img" -Directory -ErrorAction SilentlyContinue
foreach ($subDir in $imgSubDirs) {
    Create-FtpDirectory "$remotePath/img/$($subDir.Name)"
}

Write-Host ""
Write-Host "--- Uploading files ---" -ForegroundColor Cyan

# Upload index.html
if (Upload-FtpFile "$localPath\index.html" "$remotePath/index.html") { $successCount++ } else { $failCount++ }

# Upload CSS
Get-ChildItem -Path "$localPath\css" -File -ErrorAction SilentlyContinue | ForEach-Object {
    if (Upload-FtpFile $_.FullName "$remotePath/css/$($_.Name)") { $successCount++ } else { $failCount++ }
}

# Upload JS
Get-ChildItem -Path "$localPath\js" -File -ErrorAction SilentlyContinue | ForEach-Object {
    if (Upload-FtpFile $_.FullName "$remotePath/js/$($_.Name)") { $successCount++ } else { $failCount++ }
}

# Upload pages
Get-ChildItem -Path "$localPath\pages" -File -ErrorAction SilentlyContinue | ForEach-Object {
    if (Upload-FtpFile $_.FullName "$remotePath/pages/$($_.Name)") { $successCount++ } else { $failCount++ }
}

# Upload images recursively
Get-ChildItem -Path "$localPath\img" -File -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    $relativePath = $_.FullName.Substring("$localPath\img".Length).Replace("\", "/")
    if (Upload-FtpFile $_.FullName "$remotePath/img$relativePath") { $successCount++ } else { $failCount++ }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Upload Complete!" -ForegroundColor Green
Write-Host "  Success: $successCount | Failed: $failCount" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
