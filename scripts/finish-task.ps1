param(
    [string]$ProjectRoot = ".",
    [string]$TaskId
)

$ErrorActionPreference = "Stop"

Set-Location $ProjectRoot

if (-not $TaskId) {
    $task = Get-ChildItem "ai/tasks/doing" -Filter "TASK-*.md" | Sort-Object Name | Select-Object -First 1
    if (-not $task) {
        Write-Host "没有找到 doing 中的任务。"
        exit 0
    }
    $TaskId = [System.IO.Path]::GetFileNameWithoutExtension($task.Name)
} else {
    $task = Get-Item "ai/tasks/doing/$TaskId.md"
}

$num = $TaskId -replace "^TASK-", ""
$reviewPath = "ai/reviews/REVIEW-$num.md"

if (-not (Test-Path $reviewPath)) {
    Write-Host "没有找到审查文件：$reviewPath"
    exit 1
}

$review = Get-Content $reviewPath -Raw

if ($review -match "PASS") {
    Move-Item "ai/tasks/doing/$TaskId.md" "ai/tasks/done/$TaskId.md" -Force
    Write-Host "$TaskId 已通过审查，已移动到 ai/tasks/done/"
} elseif ($review -match "REWORK") {
    Write-Host "$TaskId 需要返工，请让 Hermes 生成返工任务或修复 Prompt。"
} else {
    Write-Host "审查文件中没有明确 PASS 或 REWORK。"
    exit 1
}
