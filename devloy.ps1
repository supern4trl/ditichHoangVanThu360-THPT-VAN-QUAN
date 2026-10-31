# =====================================================================
#  deploy.ps1 - Day code moi sua len GitHub va bao khi deploy xong
#  Cach dung: double-click deploy.bat (hoac: .\deploy.ps1 "noi dung commit")
#  Neu repo private: dat bien moi truong GITHUB_TOKEN (quyen repo / actions:read)
# =====================================================================
param([string]$Message = "")

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot
Add-Type -AssemblyName System.Windows.Forms

function Notify($title, $text, $icon) {
    [System.Media.SystemSounds]::Asterisk.Play()
    [System.Windows.Forms.MessageBox]::Show($text, $title, "OK", $icon) | Out-Null
}

function Fail($text) {
    Write-Host "`n[LOI] $text" -ForegroundColor Red
    Notify "Deploy THAT BAI" $text "Error"
    exit 1
}

# ---- 1. Kiem tra git ----
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail "Chua cai Git. Tai tai https://git-scm.com" }
git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) { Fail "Thu muc nay chua phai repo git. Chay 'git init' va 'git remote add origin <link repo>' truoc." }

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
$remote = (git config --get remote.origin.url)
if (-not $remote) { Fail "Chua co remote 'origin'. Chay: git remote add origin <link repo>" }

# ---- 2. Commit ----
git add -A
$changes = git status --porcelain
if (-not $changes) {
    Write-Host "Khong co thay doi nao de day len." -ForegroundColor Yellow
    Notify "Deploy" "Khong co file nao thay doi." "Information"
    exit 0
}
if (-not $Message) { $Message = "Update " + (Get-Date -Format "yyyy-MM-dd HH:mm") }
Write-Host "Commit: $Message" -ForegroundColor Cyan
git commit -m $Message | Out-Null

# ---- 3. Push ----
Write-Host "Dang day len GitHub (nhanh '$branch')..." -ForegroundColor Cyan
git push origin $branch
if ($LASTEXITCODE -ne 0) { Fail "git push that bai. Kiem tra mang / dang nhap GitHub / file qua lon (>100MB)." }
$sha = (git rev-parse HEAD).Trim()
Write-Host "Da day len thanh cong: $($sha.Substring(0,7))" -ForegroundColor Green

# ---- 4. Lay owner/repo tu link remote ----
if ($remote -notmatch "github\.com[:/]([^/]+)/([^/]+?)(\.git)?$") {
    Notify "Da day len GitHub" "Push xong nhung khong doc duoc ten repo de theo doi deploy." "Information"
    exit 0
}
$owner = $Matches[1]; $repo = $Matches[2]

$headers = @{ "User-Agent" = "deploy-script"; "Accept" = "application/vnd.github+json" }
if ($env:GITHUB_TOKEN) { $headers["Authorization"] = "Bearer $($env:GITHUB_TOKEN)" }

function Get-Runs {
    $url = "https://api.github.com/repos/$owner/$repo/actions/runs?head_sha=$sha"
    try { return (Invoke-RestMethod -Uri $url -Headers $headers).workflow_runs }
    catch { return $null }
}

# ---- 5. Cho workflow (GitHub Pages / Actions) chay xong ----
Write-Host "Dang cho GitHub deploy... (toi da 10 phut)" -ForegroundColor Cyan
$start = Get-Date
$timeout = 600
$sawRuns = $false

while (((Get-Date) - $start).TotalSeconds -lt $timeout) {
    Start-Sleep -Seconds 5
    $runs = Get-Runs
    if ($null -eq $runs) { Write-Host "  (chua doc duoc trang thai, thu lai...)"; continue }

    if ($runs.Count -eq 0) {
        # Sau 90s van chua co workflow nao -> repo khong dung Actions
        if (((Get-Date) - $start).TotalSeconds -gt 90) {
            Notify "Da day len GitHub" "Code da len GitHub.`nKhong thay workflow deploy nao cho commit nay (co the repo khong dung Actions/Pages)." "Information"
            exit 0
        }
        continue
    }

    $sawRuns = $true
    $pending = @($runs | Where-Object { $_.status -ne "completed" })
    $summary = ($runs | ForEach-Object { "$($_.name): $($_.status)" }) -join " | "
    Write-Host "  $summary"

    if ($pending.Count -eq 0) {
        $failed = @($runs | Where-Object { $_.conclusion -notin @("success", "skipped", "neutral") })
        if ($failed.Count -eq 0) {
            Write-Host "`nDEPLOY THANH CONG!" -ForegroundColor Green
            Notify "Deploy THANH CONG" "Da deploy xong.`n`nWeb: https://$owner.github.io/$repo/" "Information"
            exit 0
        } else {
            $names = ($failed | ForEach-Object { "$($_.name) ($($_.conclusion))" }) -join ", "
            Fail "Deploy that bai: $names`nXem chi tiet: $($failed[0].html_url)"
        }
    }
}

Fail "Het thoi gian cho (10 phut) ma deploy chua xong. Vao tab Actions tren GitHub de xem."