$ErrorActionPreference = "Stop"
$Gh = "C:\Program Files\GitHub CLI\gh.exe"
$RepoName = "aurelis-landing"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

Set-Location $Root

if (-not (Test-Path $Gh)) {
  Write-Host "GitHub CLI가 없습니다. winget install GitHub.cli 로 설치해 주세요." -ForegroundColor Red
  pause
  exit 1
}

& $Gh auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "`n=== GitHub 로그인 (브라우저에서 코드 입력) ===" -ForegroundColor Cyan
  & $Gh auth login --hostname github.com --git-protocol https --web --skip-ssh-key
}

Write-Host "`n=== 저장소 생성 및 push ===" -ForegroundColor Cyan
try {
  git remote get-url origin 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    git push -u origin main
  } else {
    throw "no remote"
  }
} catch {
  & $Gh repo create $RepoName --public --source=. --remote=origin --push --description "AURÉLIS 코스메틱 랜딩페이지 MVP"
}

if ($LASTEXITCODE -eq 0) {
  $url = & $Gh repo view --json url -q .url
  Write-Host "`n완료: $url" -ForegroundColor Green
} else {
  Write-Host "`n실패. 메시지를 확인해 주세요." -ForegroundColor Red
}

pause
