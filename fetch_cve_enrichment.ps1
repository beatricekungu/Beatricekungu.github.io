$ErrorActionPreference = 'Stop'

$sourcePath = 'C:\Users\Bkung\Downloads\known_exploited_vulnerabilities.csv'
$outputPath = 'C:\Users\Bkung\OneDrive\Documents\GitHub\Beatricekungu.github.io\outputs\cve_enrichment_raw.json'
$cveIds = (Import-Csv -LiteralPath $sourcePath).cveID | Sort-Object -Unique
$nvdRecords = @()
$epssRecords = @()

function Get-Chunks {
    param([string[]]$Items, [int]$Size)
    for ($i = 0; $i -lt $Items.Count; $i += $Size) {
        ,($Items[$i..([Math]::Min($i + $Size - 1, $Items.Count - 1))])
    }
}

$nvdChunks = @(Get-Chunks -Items $cveIds -Size 100)
for ($i = 0; $i -lt $nvdChunks.Count; $i++) {
    $joinedIds = [uri]::EscapeDataString(($nvdChunks[$i] -join ','))
    $uri = "https://services.nvd.nist.gov/rest/json/cves/2.0?cveIds=$joinedIds"
    $result = Invoke-RestMethod -Uri $uri -Headers @{ 'User-Agent' = 'PowerBI-CVE-Enrichment/1.0' }
    if ($result.vulnerabilities) { $nvdRecords += $result.vulnerabilities }
    Write-Host "NVD batch $($i + 1) of $($nvdChunks.Count): $($result.totalResults) records"
    if ($i -lt ($nvdChunks.Count - 1)) { Start-Sleep -Seconds 7 }
}

$epssChunks = @(Get-Chunks -Items $cveIds -Size 100)
for ($i = 0; $i -lt $epssChunks.Count; $i++) {
    $joinedIds = [uri]::EscapeDataString(($epssChunks[$i] -join ','))
    $uri = "https://api.first.org/data/v1/epss?cve=$joinedIds"
    $result = Invoke-RestMethod -Uri $uri -Headers @{ 'User-Agent' = 'PowerBI-CVE-Enrichment/1.0' }
    if ($result.data) { $epssRecords += $result.data }
    Write-Host "EPSS batch $($i + 1) of $($epssChunks.Count): $($result.total) records"
}

$payload = [ordered]@{
    generatedAt = (Get-Date).ToUniversalTime().ToString('o')
    sourceCveCount = $cveIds.Count
    nvd = $nvdRecords
    epss = $epssRecords
}
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $outputPath) | Out-Null
$payload | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $outputPath -Encoding utf8
Write-Host "Saved raw enrichment to $outputPath"
