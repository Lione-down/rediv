param(
    [string]$ProjectRoot = ".",
    [string]$CodexCommand = "codex"
)

$ErrorActionPreference = "Stop"

Set-Location $ProjectRoot

$TodoDir = "ai/tasks/todo"
$DoingDir = "ai/tasks/doing"
$ReportsDir = "ai/reports"
$LogsDir = "ai/logs"

New-Item -ItemType Directory -Force -Path $TodoDir, $DoingDir, $ReportsDir, $LogsDir | Out-Null

$task = Get-ChildItem $TodoDir -Filter "TASK-*.md" | Sort-Object Name | Select-Object -First 1

if (-not $task) {
    Write-Host "没有找到待执行任务：$TodoDir/TASK-*.md"
    exit 0
}

$taskName = $task.Name
$taskId = [System.IO.Path]::GetFileNameWithoutExtension($taskName)
$doingPath = Join-Path $DoingDir $taskName
$reportPath = Join-Path $ReportsDir ("REPORT-" + ($taskId -replace "^TASK-", "") + ".md")
$logPath = Join-Path $LogsDir ("codex-" + $taskId + ".log")

Write-Host "开始执行任务：$taskName"

Move-Item $task.FullName $doingPath -Force

$prompt = @"
请严格遵守项目根目录 AGENTS.md。

当前任务文件：
$doingPath

执行要求：
1. 先阅读 AGENTS.md
2. 再阅读 ai/state/CURRENT.md
3. 再阅读当前任务文件
4. 只执行当前任务
5. 不生成下一个任务
6. 完成后必须创建报告文件：
$reportPath

报告格式必须包含：
# REPORT $taskId

## Status
DONE / BLOCKED

## Task ID
$taskId

## Summary

## Files Changed

## Tests Run

## Test Result

## Risks

## Need Hermes Review
YES
"@

Write-Host "调用 Codex 执行中..."

& $CodexCommand exec --cd . $prompt 2>&1 | Tee-Object -FilePath $logPath

Write-Host ""
Write-Host "Codex 执行结束。"
Write-Host "任务位置：$doingPath"
Write-Host "报告位置：$reportPath"
Write-Host "日志位置：$logPath"
Write-Host ""
Write-Host "下一步：让 Hermes 审查 $reportPath 和 git diff。"
