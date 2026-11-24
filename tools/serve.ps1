param([string]$Root, [int]$Port = 8080, [switch]$AllowPut)
$types = @{ ".html"="text/html; charset=utf-8"; ".css"="text/css"; ".js"="text/javascript"; ".svg"="image/svg+xml";
  ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".webp"="image/webp"; ".gif"="image/gif"; ".ico"="image/x-icon"; ".json"="application/json" }
$l = [System.Net.HttpListener]::new(); $l.Prefixes.Add("http://localhost:$Port/"); $l.Start()
Write-Host "Serving $Root on http://localhost:$Port/"
while ($l.IsListening) {
  $c = $l.GetContext(); $p = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath).TrimStart('/')
  if ($p -eq "" -or $p.EndsWith("/")) { $p += "index.html" }
  $f = Join-Path $Root $p
  if ($AllowPut -and $c.Request.HttpMethod -eq "PUT") {
    # only plain file names inside out/
    if ($p -match '^out/[\w.-]+$') {
      New-Item -ItemType Directory -Force (Join-Path $Root "out") | Out-Null
      $fs = [IO.File]::Create($f); $c.Request.InputStream.CopyTo($fs); $fs.Close()
      $c.Response.StatusCode = 204
    } else { $c.Response.StatusCode = 403 }
    $c.Response.Close(); Write-Host "PUT /$p"; continue
  }
  $status = 200
  if (-not (Test-Path $f -PathType Leaf)) { $f = Join-Path $Root "404.html"; $status = 404 }
  if (Test-Path $f -PathType Leaf) { $bytes = [IO.File]::ReadAllBytes($f) } else { $bytes = [Text.Encoding]::UTF8.GetBytes("Not found") }
  $ext = [IO.Path]::GetExtension($f).ToLower()
  $c.Response.StatusCode = $status
  $c.Response.Headers.Add("Cache-Control", "no-store")
  $c.Response.ContentType = $(if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" })
  $c.Response.OutputStream.Write($bytes, 0, $bytes.Length); $c.Response.Close()
  Write-Host "$status /$p"
}
