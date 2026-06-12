# ============================================================
# 頁面編譯測試 - 檢查所有前端頁面是否正常載入
# ============================================================
param([string]$BaseUrl = "http://localhost:3001")

$ErrorActionPreference = "Continue"
$total = 0; $passed = 0; $failed = 0

$pages = @(
    @{Path="/login"; Label="登入頁"},
    @{Path="/bi"; Label="BI儀表板"},
    @{Path="/system"; Label="系統設置"},
    @{Path="/products"; Label="產品管理"},
    @{Path="/customers"; Label="客戶管理"},
    @{Path="/orders"; Label="銷售訂單"},
    @{Path="/inventory"; Label="庫存管理"},
    @{Path="/suppliers"; Label="供應商管理"},
    @{Path="/consignment"; Label="寄庫管理"},
    @{Path="/samples"; Label="樣品/打板"},
    @{Path="/visits"; Label="業務拜訪"},
    @{Path="/recall"; Label="召回管理"},
    @{Path="/purchase"; Label="採購管理"},
    @{Path="/finance"; Label="財務管理"},
    @{Path="/notifications"; Label="通知中心"},
    @{Path="/profile"; Label="個人中心"},
    @{Path="/import"; Label="資料匯入"},
    @{Path="/organization"; Label="組織架構"},
    @{Path="/mobile"; Label="移動端"},
    @{Path="/sos"; Label="SOS"},
    @{Path="/print"; Label="列印"},
    @{Path="/customers/1b902f94-72ed-4be2-82f8-a149cb74b5ec"; Label="客戶詳情頁"}
)

Write-Host "`n========== 頁面編譯測試 ==========" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl`n"

foreach ($page in $pages) {
    $total++
    try {
        $r = Invoke-WebRequest -Uri "$BaseUrl$($page.Path)" -TimeoutSec 15 -UseBasicParsing
        $code = $r.StatusCode
        
        if ($code -eq 200) {
            $passed++
            Write-Host "  [PASS] $($page.Label) ($($page.Path))" -ForegroundColor Green
        } elseif ($code -eq 307 -or $code -eq 308) {
            # Redirect (to login) is OK
            $passed++
            Write-Host "  [PASS] $($page.Label) ($($page.Path)) - redirect" -ForegroundColor Yellow
        } else {
            $failed++
            Write-Host "  [FAIL] $($page.Label) ($($page.Path)) - HTTP $code" -ForegroundColor Red
        }
    } catch {
        $errMsg = $_.Exception.Message
        if ($errMsg -match "500") {
            $failed++
            Write-Host "  [FAIL] $($page.Label) ($($page.Path)) - 500 編譯錯誤" -ForegroundColor Red
        } elseif ($errMsg -match "404") {
            $failed++
            Write-Host "  [FAIL] $($page.Label) ($($page.Path)) - 404" -ForegroundColor Red
        } else {
            $failed++
            Write-Host "  [FAIL] $($page.Label) ($($page.Path)) - $errMsg" -ForegroundColor Red
        }
    }
}

Write-Host "`n========== 結果: $passed / $total 通過 ==========" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

exit $(if ($failed -gt 0) { 1 } else { 0 })
