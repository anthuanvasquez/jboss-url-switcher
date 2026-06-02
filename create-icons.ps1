# create-icons.ps1
# Genera los íconos PNG de la extensión usando System.Drawing de .NET

Add-Type -AssemblyName System.Drawing

function New-ExtensionIcon {
    param([int]$Size, [string]$Path)

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode    = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Fondo transparente
    $g.Clear([System.Drawing.Color]::Transparent)

    # Círculo de fondo azul
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 24, 90, 157))
    $padding = [int]($Size * 0.04)
    $g.FillEllipse($bgBrush, $padding, $padding, $Size - $padding * 2, $Size - $padding * 2)
    $bgBrush.Dispose()

    # Letra "J" centrada en blanco
    $fontSize  = [float]($Size * 0.54)
    $font      = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment     = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $rect = New-Object System.Drawing.RectangleF(0, ([float]$Size * 0.04), [float]$Size, [float]$Size)
    $g.DrawString("J", $font, $textBrush, $rect, $sf)

    $font.Dispose()
    $textBrush.Dispose()
    $sf.Dispose()
    $g.Dispose()

    # Crear directorio si no existe
    $dir = Split-Path $Path -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }

    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    Write-Host "  Creado: $Path ($Size x $Size)"
}

Write-Host "Generando íconos de la extensión..."

$root = $PSScriptRoot
New-ExtensionIcon -Size 16  -Path (Join-Path $root "icons\icon16.png")
New-ExtensionIcon -Size 48  -Path (Join-Path $root "icons\icon48.png")
New-ExtensionIcon -Size 128 -Path (Join-Path $root "icons\icon128.png")

Write-Host "Listo."
