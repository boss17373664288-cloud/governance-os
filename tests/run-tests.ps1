# ============================================================
# 完整測試套件 - 一鍵執行所有測試
# ============================================================
param(
    [switch]$ApiOnly,
    [switch]$PagesOnly
)

$ErrorActionPreference = "Continue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  自動化測試套件 v1.0" -ForegroundColor Cyan
Write-Host "  項目: Governance ERP" -ForegroundColor Cyan
Write-Host "  時間: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 檢查服務狀態
Write-Host ""
Write-Host "[檢查] 服務狀態..." -ForegroundColor Yellow
$backendUp = $false
$frontendUp = $false

try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/system/enums" -TimeoutSec 3 -UseBasicParsing
    $backendUp = $true
    Write-Host "  後端 (3000): 運行中" -ForegroundColor Green
} catch {
    $msg = $_.Exception.Message
    if ($msg -match "401|403|Unauthorized") {
        $backendUp = $true
        Write-Host "  後端 (3000): 運行中" -ForegroundColor Green
    } else {
        Write-Host "  後端 (3000): 未運行" -ForegroundColor Red
    }
}

try {
    $null = Invoke-WebRequest -Uri "http://localhost:3001/login" -TimeoutSec 3 -UseBasicParsing
    $frontendUp = $true
    Write-Host "  前端 (3001): 運行中" -ForegroundColor Green
} catch {
    Write-Host "  前端 (3001): 未運行" -ForegroundColor Red
}

if (-not $backendUp -or -not $frontendUp) {
    Write-Host ""
    Write-Host "[錯誤] 請先啟動前後端服務!" -ForegroundColor Red
    Write-Host "  cd backend && npm run start:dev"
    Write-Host "  cd web-admin && npm run dev -- -p 3001"
    exit 1
}

$totalPassed = 0
$totalFailed = 0

# API 測試
if (-not $PagesOnly) {
    Write-Host ""
    Write-Host ">>> 執行 API 測試..." -ForegroundColor Cyan
    $apiResult = & "$scriptDir\test-api.ps1"
    if ($LASTEXITCODE -eq 0) { $totalPassed++ } else { $totalFailed++ }
}

# 頁面測試
if (-not $ApiOnly) {
    Write-Host ""
    Write-Host ">>> 執行頁面測試..." -ForegroundColor Cyan
    $pageResult = & "$scriptDir\test-pages.ps1"
    if ($LASTEXITCODE -eq 0) { $totalPassed++ } else { $totalFailed++ }
}

# 總結
$color = if ($totalFailed -eq 0) { "Green" } else { "Red" }
Write-Host ""
Write-Host "=============================================" -ForegroundColor $color
Write-Host "  測試完成" -ForegroundColor $color
Write-Host "  通過: $totalPassed  失敗: $totalFailed" -ForegroundColor $color
Write-Host "=============================================" -ForegroundColor $color

exit $totalFailed
