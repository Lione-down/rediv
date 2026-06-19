param(
    [string]$ProjectRoot = "."
)

$ErrorActionPreference = "Stop"

Set-Location $ProjectRoot

$DoingDir = "ai/tasks/doing"
$ReportsDir = "ai/reports"
$ReviewsDir = "ai/reviews"

New-Item -ItemType Directory -Force -Path $ReviewsDir | Out-Null

$task = Get-ChildItem $DoingDir -Filter "TASK-*.md" | Sort-Object Name | Select-Object -First 1

if (-not $task) {
    Write-Host "没有找到正在执行的任务：$DoingDir/TASK-*.md"
    exit 0
}

$taskId = [System.IO.Path]::GetFileNameWithoutExtension($task.Name)
$num = $taskId -replace "^TASK-", ""
$reportPath = Join-Path $ReportsDir "REPORT-$num.md"
$reviewPath = Join-Path $ReviewsDir "REVIEW-$num.md"

if (-not (Test-Path $reportPath)) {
    Write-Host "没有找到 Codex 报告：$reportPath"
    exit 1
}

$diffPath = "ai/logs/git-diff-$taskId.patch"
New-Item -ItemType Directory -Force -Path "ai/logs" | Out-Null
git diff | Out-File -Encoding utf8 $diffPath

Write-Host "请把下面这段提示词发给 Hermes："
Write-Host ""
Write-Host "----------------------------------------"
Write-Host "请审查当前 Codex 任务执行结果。"
Write-Host ""
Write-Host "请读取："
Write-Host "- ai/state/CURRENT.md"
Write-Host "- $($task.FullName)"
Write-Host "- $reportPath"
Write-Host "- $diffPath"
Write-Host ""
Write-Host "只做审查，不修改源码。"
Write-Host ""
Write-Host "如果通过，请创建："
Write-Host "$reviewPath"
Write-Host "并写入 PASS。"
Write-Host ""
Write-Host "如果不通过，请创建："
Write-Host "$reviewPath"
Write-Host "并写入 REWORK、问题原因、修复建议、返工 Codex Prompt。"
Write-Host "----------------------------------------"
