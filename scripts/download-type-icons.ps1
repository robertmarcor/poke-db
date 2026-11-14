# Works with Windows PowerShell 5.1 and PowerShell 7.
$ErrorActionPreference = 'Stop'
try {
    $destination = Join-Path $PSScriptRoot '../public/assets/types'
    New-Item -ItemType Directory -Path $destination -Force | Out-Null

    $types = 'Bug', 'Dark', 'Dragon', 'Electric', 'Fairy', 'Fighting', 'Fire',
        'Flying', 'Ghost', 'Grass', 'Ground', 'Ice', 'Normal', 'Poison',
        'Psychic', 'Rock', 'Steel', 'Water'
    $failed = @()
    $completed = 0
    Write-Host "Downloading $($types.Count) type icons to $destination"

    foreach ($type in $types) {
        Write-Host "[$($completed + 1)/$($types.Count)] Downloading $type..."
        $fileName = "$type.png"
        # MediaWiki stores images in directories derived from the filename's MD5.
        $md5 = [Security.Cryptography.MD5]::Create()
        try {
            $hash = [BitConverter]::ToString(
                $md5.ComputeHash([Text.Encoding]::UTF8.GetBytes($fileName))
            ).Replace('-', '').ToLowerInvariant()
        }
        finally {
            $md5.Dispose()
        }
        $url = "https://static.wikia.nocookie.net/pokemongo/images/$($hash.Substring(0, 1))/$($hash.Substring(0, 2))/$fileName/revision/latest?format=original"
        $target = Join-Path $destination "$($type.ToLowerInvariant()).png"
        $temporary = "$target.download"

        try {
            Invoke-WebRequest -Uri $url -OutFile $temporary -TimeoutSec 30 -UseBasicParsing `
                -UserAgent 'Mozilla/5.0' -Headers @{ Referer = 'https://pokemongo.fandom.com/'; Accept = 'image/png' }
            $bytes = [IO.File]::ReadAllBytes($temporary)
            if ($bytes.Length -lt 8 -or [BitConverter]::ToString($bytes[0..7]) -ne '89-50-4E-47-0D-0A-1A-0A') {
                throw 'The response was not a PNG image.'
            }
            Move-Item -LiteralPath $temporary -Destination $target -Force
            Write-Host "Saved $target"
        }
        catch {
            $failed += $type
            Write-Warning "$type failed: $($_.Exception.Message)"
        }
        finally {
            if (Test-Path -LiteralPath $temporary) {
                Remove-Item -LiteralPath $temporary
            }
        }
        $completed++
    }

    Write-Host "Finished. Saved $($types.Count - $failed.Count) of $($types.Count) icons."
    if ($failed.Count) {
        throw "Could not download: $($failed -join ', '). Fandom may be blocking automated requests. Run again to retry."
    }
}
catch {
    Write-Host "Download failed: $($_.Exception.Message)" -ForegroundColor Red
    $global:LASTEXITCODE = 1
}
finally {
    Read-Host 'Press Enter to close' | Out-Null
}
