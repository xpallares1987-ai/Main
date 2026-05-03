param(
  [ValidateSet("GET")]
  [string]$Mode = "GET",
  [string]$BaseUrl   = "https://www.b2b.paper.saica.com",
  [string]$OutFolder = "C:\Users\xpall\Source\Main\Logistics-Dashboard\data",
  [string]$CodBoarding = "",
  [int]$RetryCount = 3,
  [int]$RetryDelaySec = 10,
  [int]$TimeoutSec = 600
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Credenciales directas
$Login = "AEMEYERSSOHN"
$Password = "prueba"

try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
} catch {}

function Ensure-Folder([string]$path){
  if (!(Test-Path -LiteralPath $path)) { [void](New-Item -ItemType Directory -Path $path -Force) }
}

function Log([string]$msg){
  Write-Host ("{0}  {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg)
}

function Build-Url([string]$path, [hashtable]$params){
  $base = $BaseUrl.TrimEnd('/')
  $p = $path
  if ($p[0] -ne '/') { $p = '/' + $p }
  $query = ($params.GetEnumerator() | Sort-Object Key | ForEach-Object {
    "{0}={1}" -f $_.Key, [System.Uri]::EscapeDataString([string]$_.Value)
  }) -join "&"
  return ("{0}{1}?{2}" -f $base, $p, $query)
}

function Download-With-Retry([string]$url){
  for ($i=1; $i -le $RetryCount; $i++){
    try{
      return (Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec $TimeoutSec).Content
    } catch {
      if ($i -lt $RetryCount) {
        Log ("ERROR descarga: " + $_.Exception.Message + " | Reintento en " + $RetryDelaySec + "s")
        Start-Sleep -Seconds $RetryDelaySec
      } else { throw }
    }
  }
}

function Remove-InvalidXmlChars([string]$s){
  if ($null -eq $s) { return $s }
  return ($s -replace "[\x00-\x08\x0B\x0C\x0E-\x1F]", "")
}

function Fix-InvalidAmpersands([string]$s){
  if ($null -eq $s) { return $s }
  return ($s -replace '&(?!amp;|lt;|gt;|apos;|quot;|#\d+;|#x[0-9A-Fa-f]+;)', '&amp;')
}

function Parse-ResponseToXml([string]$content){
  $content = Remove-InvalidXmlChars $content
  [xml]$outer = $content
  $stringNode = $outer.SelectSingleNode("//*[local-name()='string']")
  if ($null -ne $stringNode) {
      $inner = [System.Net.WebUtility]::HtmlDecode($stringNode.InnerText).Trim()
      $inner = Remove-InvalidXmlChars $inner
      $inner = Fix-InvalidAmpersands $inner
      [xml]$innerDoc = $inner
      return $innerDoc
  }
  return $outer
}

function Add-OriginTag([xml]$doc, [System.Xml.XmlNode]$itemNode, [string]$code){
  $name = if ($code -eq "100") { "ES" } else { "FR" }
  $el = $doc.CreateElement("Origin")
  $el.InnerText = $name
  [void]$itemNode.AppendChild($el)
}

function Save-Xml([xml]$doc, [string]$path){
    $doc.Save($path)
    $text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    $text = $text -replace ">ANVERS<", ">VAN MOER<"
    [System.IO.File]::WriteAllText($path, $text, [System.Text.Encoding]::UTF8)
}

function Merge-Items([xml]$destDoc, [xml]$srcDoc, [string]$destListXPath, [string]$srcItemXPath, [string]$code){
  $destList = $destDoc.SelectSingleNode($destListXPath)
  if($null -eq $destList) { return }
  $srcItems = $srcDoc.SelectNodes($srcItemXPath)
  if($null -eq $srcItems) { return }
  foreach ($n in $srcItems) {
    Add-OriginTag $srcDoc $n $code
    [void]$destList.AppendChild($destDoc.ImportNode($n, $true))
  }
}

Ensure-Folder $OutFolder

Log "1/3 Descargando Embarques (Boarding)..."
$b100 = Parse-ResponseToXml (Download-With-Retry (Build-Url "/Webservices/ExternalWarehousesService.asmx/GetBoardingList" @{strLogin=$Login; strPassword=$Password; strCompany="100"; strCodBoarding=""}))
$b200 = Parse-ResponseToXml (Download-With-Retry (Build-Url "/Webservices/ExternalWarehousesService.asmx/GetBoardingList" @{strLogin=$Login; strPassword=$Password; strCompany="200"; strCodBoarding=""}))
foreach ($n in $b100.SelectNodes("//BoardingItem")) { Add-OriginTag $b100 $n "100" }
Merge-Items $b100 $b200 "//Shipments" "//BoardingItem" "200"
Save-Xml $b100 (Join-Path $OutFolder "BoardingList.xml")

Log "2/3 Descargando Recepciones (Receptions)..."
$p100 = Parse-ResponseToXml (Download-With-Retry (Build-Url "/Webservices/ExternalWarehousesService.asmx/GetPendingReceptionsList" @{strLogin=$Login; strPassword=$Password; strCompany="100"}))
$p200 = Parse-ResponseToXml (Download-With-Retry (Build-Url "/Webservices/ExternalWarehousesService.asmx/GetPendingReceptionsList" @{strLogin=$Login; strPassword=$Password; strCompany="200"}))
foreach ($n in $p100.SelectNodes("//ReceptionItem")) { Add-OriginTag $p100 $n "100" }
Merge-Items $p100 $p200 "//Receptions" "//ReceptionItem" "200"
Save-Xml $p100 (Join-Path $OutFolder "PendingReceptionsList.xml")

Log "3/3 Descargando Stock..."
$s100 = Parse-ResponseToXml (Download-With-Retry (Build-Url "/Webservices/ExternalWarehousesService.asmx/GetStock" @{strLogin=$Login; strPassword=$Password; strCompany="100"}))
$s200 = Parse-ResponseToXml (Download-With-Retry (Build-Url "/Webservices/ExternalWarehousesService.asmx/GetStock" @{strLogin=$Login; strPassword=$Password; strCompany="200"}))
foreach ($n in $s100.SelectNodes("//StockItem")) { Add-OriginTag $s100 $n "100" }
Merge-Items $s100 $s200 "//Stock" "//StockItem" "200"
Save-Xml $s100 (Join-Path $OutFolder "Stock.xml")

Log "Sincronizacion Finalizada Exitosamente."
