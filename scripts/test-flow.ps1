Param(
  [string]$Cpf = "99988877766",
  [switch]$Reset,
  [string]$BaseUrl = "http://localhost:3333"
)

function Show-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

function Invoke-JsonPost($Url, $BodyObj, $Headers=@{}) {
  $json = $BodyObj | ConvertTo-Json -Depth 5 -Compress
  return Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $json -ContentType 'application/json'
}

try {
  Show-Step "Simular conta ($Cpf)";
  $simulateBody = @{ cpf = $Cpf }
  if ($Reset) { $simulateBody.reset = $true }
  $sim = Invoke-JsonPost "$BaseUrl/simulate" $simulateBody
  $sim | ConvertTo-Json -Depth 5 | Write-Host

  Show-Step "Fazer depósito extra";
  Invoke-JsonPost "$BaseUrl/deposit" @{ description = 'Deposito Extra'; amount = 123.45 } @{ cpf = $Cpf } | Out-Null

  Show-Step "Ver extrato";
  $statement = Invoke-RestMethod -Uri "$BaseUrl/statement" -Headers @{ cpf = $Cpf }
  ($statement | Select-Object -First 5 | ConvertTo-Json -Depth 5) | Write-Host

  Show-Step "Ver saldo";
  $balance = Invoke-RestMethod -Uri "$BaseUrl/balance" -Headers @{ cpf = $Cpf }
  Write-Host "Saldo: $balance" -ForegroundColor Green

  Show-Step "Extrato por data hoje";
  $today = (Get-Date).ToString('yyyy-MM-dd')
  $statementToday = Invoke-RestMethod -Uri "$BaseUrl/statement/date?date=$today" -Headers @{ cpf = $Cpf }
  ($statementToday | ConvertTo-Json -Depth 5) | Write-Host

  Show-Step "Saque";
  Invoke-JsonPost "$BaseUrl/withdraw" @{ amount = 50 } @{ cpf = $Cpf } | Out-Null

  Show-Step "Saldo após saque";
  $balance2 = Invoke-RestMethod -Uri "$BaseUrl/balance" -Headers @{ cpf = $Cpf }
  Write-Host "Novo saldo: $balance2" -ForegroundColor Yellow

  Show-Step "Fluxo concluído";
}
catch {
  Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails) { Write-Host $_.ErrorDetails -ForegroundColor DarkRed }
  exit 1
}
