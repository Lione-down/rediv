$ErrorActionPreference = "Stop"

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    Write-Host "==> $Name"
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
}

Invoke-Step "Convergence verifier" { python ai/runtime/verify-project-convergence.py }
Invoke-Step "Runtime tests" { python -m pytest ai/runtime/tests -q }
Invoke-Step "Hermes role contracts" { python ai/runtime/verify-hermes-role-contracts.py }
Invoke-Step "Frontend build" { npm --prefix frontend run build }

Write-Host "PROJECT_VERIFICATION_OK"
