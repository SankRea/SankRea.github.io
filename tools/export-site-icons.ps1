# Export the editable SVG using Windows' built-in WPF renderer; no npm build.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$siteIconDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../source/images/black-lizard'))
[xml]$siteIconSvg = Get-Content -LiteralPath (Join-Path $siteIconDirectory 'icon.svg') -Raw -Encoding UTF8
$siteIconBrushConverter = New-Object System.Windows.Media.BrushConverter

function Get-IconBrush([string]$Color) {
  if (-not $Color -or $Color -eq 'none') { return $null }
  return $siteIconBrushConverter.ConvertFromString($Color)
}

function Export-IconPng([int]$Size, [string]$FileName) {
  $visual = New-Object System.Windows.Media.DrawingVisual
  $drawing = $visual.RenderOpen()
  $drawing.PushTransform((New-Object System.Windows.Media.ScaleTransform(($Size * 4 / 64), ($Size * 4 / 64))))
  foreach ($node in $siteIconSvg.DocumentElement.ChildNodes) {
    $geometry = $null
    switch ($node.LocalName) {
      'path' { $geometry = [System.Windows.Media.Geometry]::Parse($node.GetAttribute('d')) }
      'circle' {
        $center = New-Object System.Windows.Point([double]$node.cx, [double]$node.cy)
        $geometry = New-Object System.Windows.Media.EllipseGeometry($center, [double]$node.r, [double]$node.r)
      }
      'rect' {
        $rect = New-Object System.Windows.Rect([double]$node.x, [double]$node.y, [double]$node.width, [double]$node.height)
        $geometry = New-Object System.Windows.Media.RectangleGeometry($rect, [double]$node.rx, [double]$node.rx)
      }
      default { continue }
    }
    if (-not $geometry) { continue }
    $brush = Get-IconBrush $node.GetAttribute('fill')
    $pen = $null
    if ($node.HasAttribute('stroke')) {
      $pen = New-Object System.Windows.Media.Pen((Get-IconBrush $node.GetAttribute('stroke')), [double]$node.GetAttribute('stroke-width'))
      $pen.StartLineCap = [System.Windows.Media.PenLineCap]::Round
      $pen.EndLineCap = [System.Windows.Media.PenLineCap]::Round
      $pen.LineJoin = [System.Windows.Media.PenLineJoin]::Round
    }
    $drawing.DrawGeometry($brush, $pen, $geometry)
  }
  $drawing.Pop()
  $drawing.Close()
  $large = New-Object System.Windows.Media.Imaging.RenderTargetBitmap(($Size * 4), ($Size * 4), 96, 96, ([System.Windows.Media.PixelFormats]::Pbgra32))
  $large.Render($visual)

  $smallVisual = New-Object System.Windows.Media.DrawingVisual
  [System.Windows.Media.RenderOptions]::SetBitmapScalingMode($smallVisual, [System.Windows.Media.BitmapScalingMode]::HighQuality)
  $smallDrawing = $smallVisual.RenderOpen()
  $smallDrawing.DrawImage($large, (New-Object System.Windows.Rect(0, 0, $Size, $Size)))
  $smallDrawing.Close()
  $bitmap = New-Object System.Windows.Media.Imaging.RenderTargetBitmap($Size, $Size, 96, 96, ([System.Windows.Media.PixelFormats]::Pbgra32))
  $bitmap.Render($smallVisual)
  $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
  $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
  $stream = [System.IO.File]::Create((Join-Path $siteIconDirectory $FileName))
  try { $encoder.Save($stream) } finally { $stream.Dispose() }
}

foreach ($size in @(16, 32, 48, 180, 192, 512)) {
  Export-IconPng $size "icon-$size.png"
}

# ICO contains the small PNGs at their native sizes.
$icoSizes = @(16, 32, 48)
$icoStream = [System.IO.File]::Create((Join-Path $siteIconDirectory 'favicon.ico'))
$icoWriter = New-Object System.IO.BinaryWriter($icoStream)
try {
  $icoWriter.Write([uint16]0)
  $icoWriter.Write([uint16]1)
  $icoWriter.Write([uint16]$icoSizes.Count)
  $offset = 6 + 16 * $icoSizes.Count
  $icoImages = @()
  foreach ($size in $icoSizes) {
    $bytes = [System.IO.File]::ReadAllBytes((Join-Path $siteIconDirectory "icon-$size.png"))
    $icoImages += ,$bytes
    $icoWriter.Write([byte]$size)
    $icoWriter.Write([byte]$size)
    $icoWriter.Write([byte]0)
    $icoWriter.Write([byte]0)
    $icoWriter.Write([uint16]1)
    $icoWriter.Write([uint16]32)
    $icoWriter.Write([uint32]$bytes.Length)
    $icoWriter.Write([uint32]$offset)
    $offset += $bytes.Length
  }
  foreach ($bytes in $icoImages) { $icoWriter.Write([byte[]]$bytes) }
} finally { $icoWriter.Dispose() }

$silhouette = @()
foreach ($node in $siteIconSvg.DocumentElement.ChildNodes) {
  if ($node.id -in @('lizard-body', 'lizard-legs')) {
    $silhouette += $node.OuterXml.Replace('#142E29', '#000000')
  }
}
$mask = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' + ($silhouette -join '') + '</svg>'
[System.IO.File]::WriteAllText((Join-Path $siteIconDirectory 'safari-pinned-tab.svg'), $mask, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "Icon assets exported to $siteIconDirectory"
