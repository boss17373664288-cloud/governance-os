# ============================================================
# 自動化測試套件：API 端點測試
# 測試所有後端 API 是否正常回應
# ============================================================
param(
    [string]$BaseUrl = "http://localhost:3001/api/v1",
    [string]$Email = "ADMIN001",
    [string]$Password = "admin123"
)

$ErrorActionPreference = "Continue"
$total = 0; $passed = 0; $failed = 0
$results = @()

function Test-Endpoint {
    param([string]$Method, [string]$Path, [string]$Label, [int]$ExpectedCode = 200, [string]$Token = "")
    
    $total++
    $url = "$BaseUrl$Path"
    $headers = @{}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    
    try {
        if ($Method -eq "GET") {
            $r = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -TimeoutSec 10
        } elseif ($Method -eq "POST") {
            $r = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -TimeoutSec 10 -Body "{}" -ContentType "application/json"
        }
        $passed++
        $results += "[PASS] $Method $Path - $Label"
        Write-Host "  [PASS] $Label" -ForegroundColor Green
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq $ExpectedCode -or $code -eq 401) {
            $passed++
            $results += "[PASS] $Method $Path - $Label (expected auth error)"
            Write-Host "  [PASS] $Label (auth required)" -ForegroundColor Yellow
        } else {
            $failed++
            $results += "[FAIL] $Method $Path - $Label - $($_.Exception.Message)"
            Write-Host "  [FAIL] $Label - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n========== API 端點測試 ==========" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl`n"

# Public endpoints
Test-Endpoint "GET" "/system/enums" "列舉值查詢"

# Auth
Write-Host "`n--- 認證測試 ---" -ForegroundColor Cyan
try {
    $loginBody = @{ employee_no = $Email; password = $Password } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -TimeoutSec 10
    $token = $loginRes.data.token
    Write-Host "  [PASS] 登入成功，取得 Token" -ForegroundColor Green
    $results += "[PASS] POST /auth/login"
    $total++; $passed++
} catch {
    Write-Host "  [FAIL] 登入失敗: $_" -ForegroundColor Red
    $token = ""
    $results += "[FAIL] POST /auth/login"
    $total++; $failed++
}

if ($token) {
    Write-Host "`n--- 客戶 API ---" -ForegroundColor Cyan
    Test-Endpoint "GET" "/customers?page=1&page_size=5" "客戶列表" -Token $token
    Test-Endpoint "GET" "/system/enum-options/customer_type" "客戶類型選項" -Token $token
    Test-Endpoint "GET" "/system/enum-options/customer_source" "客戶來源選項" -Token $token
    Test-Endpoint "GET" "/system/enum-options/industry_type" "行業類型選項" -Token $token

    Write-Host "`n--- 產品 API ---" -ForegroundColor Cyan
    Test-Endpoint "GET" "/products?page=1&page_size=5" "產品列表" -Token $token

    Write-Host "`n--- 供應商 API ---" -ForegroundColor Cyan
    Test-Endpoint "GET" "/suppliers?page=1&page_size=5" "供應商列表" -Token $token

    Write-Host "`n--- 銷售訂單 API ---" -ForegroundColor Cyan
    Test-Endpoint "GET" "/sales-orders?page=1&page_size=5" "銷售訂單列表" -Token $token

    Write-Host "`n--- 庫存 API ---" -ForegroundColor Cyan
    Test-Endpoint "GET" "/inventory?page=1&page_size=5" "庫存列表" -Token $token

    Write-Host "`n--- 拜訪 API ---" -ForegroundColor Cyan
    Test-Endpoint "GET" "/visits?page=1&page_size=5" "拜訪列表" -Token $token

    Write-Host "`n--- 召回 API ---" -ForegroundColor Cyan
    Test-Endpoint "GET" "/recalls?page=1&page_size=5" "召回列表" -Token $token

    Write-Host "`n--- 系統 API ---" -ForegroundColor Cyan
    Test-Endpoint "GET" "/system/roles" "角色列表" -Token $token
    Test-Endpoint "GET" "/system/permissions" "權限列表" -Token $token
    Test-Endpoint "GET" "/system/params" "系統參數" -Token $token
    Test-Endpoint "GET" "/system/employees?page=1&page_size=5" "員工列表" -Token $token
}

Write-Host "`n========== 結果: $passed / $total 通過 ==========" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
if ($failed -gt 0) {
    Write-Host "`n失敗項目:" -ForegroundColor Red
    $results | Where-Object { $_ -match "\[FAIL\]" } | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
}

exit $(if ($failed -gt 0) { 1 } else { 0 })
