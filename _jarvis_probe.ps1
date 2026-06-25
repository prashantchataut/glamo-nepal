$ErrorActionPreference = 'SilentlyContinue'
$root = 'C:\Users\MMT\Documents\side quests\glamo nepal'

function Line($t){ Write-Host "`n===== $t =====" }

Line "PRODUCTS.TS / SERVER.TS / CATALOG FILES"
Get-ChildItem -Path "$root\src\lib" -Recurse -File -Include products.ts,server.ts,catalog-products.ts | ForEach-Object { Write-Host ($_.FullName.Replace($root+'\','')) }

Line "PRODUCT CLIENT COMPONENT"
Get-ChildItem -Path "$root\src\components\product" -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { Write-Host ($_.FullName.Replace($root+'\','')) }

Line "CLOUDINARY references (src + backend)"
Select-String -Path "$root\src\*","$root\backend\src\*" -Pattern "cloudinary|CLOUDINARY|cloud_name|upload_preset" -Include *.ts,*.tsx -CaseSensitive:$false | ForEach-Object { Write-Host ($_.Path.Replace($root+'\','') + ":" + $_.LineNumber + "  " + $_.Line.Trim()) }

Line "FIREBASE references"
Select-String -Path "$root\src\*","$root\backend\src\*" -Pattern "firebase|firebaseConfig|FIREBASE" -Include *.ts,*.tsx -CaseSensitive:$false | Select-Object -First 25 | ForEach-Object { Write-Host ($_.Path.Replace($root+'\','') + ":" + $_.LineNumber + "  " + $_.Line.Trim()) }

Line "KHALTI/ESEWA references (backend)"
Select-String -Path "$root\backend\src\*" -Pattern "khalti|esewa|KHALTI|ESEWA|pidx" -Include *.ts -CaseSensitive:$false | Select-Object -First 25 | ForEach-Object { Write-Host ($_.Path.Replace($root+'\','') + ":" + $_.LineNumber + "  " + $_.Line.Trim()) }

Line "EMAIL references (backend)"
Select-String -Path "$root\backend\src\*" -Pattern "sendEmail|nodemailer|resend|SMTP|SMTP_|EMAIL_" -Include *.ts -CaseSensitive:$false | Select-Object -First 20 | ForEach-Object { Write-Host ($_.Path.Replace($root+'\','') + ":" + $_.LineNumber + "  " + $_.Line.Trim()) }

Line "DB connection (backend)"
Select-String -Path "$root\backend\src\*" -Pattern "DATABASE_URL|TURSO|libsql|createClient|new Database" -Include *.ts -CaseSensitive:$false | Select-Object -First 20 | ForEach-Object { Write-Host ($_.Path.Replace($root+'\','') + ":" + $_.LineNumber + "  " + $_.Line.Trim()) }

Line "HARDCODED/MOCK red flags (src only, top 40)"
Select-String -Path "$root\src\*" -Pattern "hardcoded|mock data|TODO|FIXME|HACK|dummy|placeholder|fallback to" -Include *.ts,*.tsx -CaseSensitive:$false | Select-Object -First 40 | ForEach-Object { Write-Host ($_.Path.Replace($root+'\','') + ":" + $_.LineNumber + "  " + $_.Line.Trim()) }

Line "ENV EXAMPLE FILES"
Get-ChildItem -Path $root -File -Filter "*.example" | ForEach-Object { Write-Host $_.Name }
Get-ChildItem -Path $root -File -Filter ".env*" | Where-Object { $_.Name -notmatch '\.local$' } | ForEach-Object { Write-Host $_.Name }
Get-ChildItem -Path "$root\backend" -File -Filter ".env*" -ErrorAction SilentlyContinue | Where-Object { $_.Name -notmatch '\.local$' } | ForEach-Object { Write-Host ("backend\" + $_.Name) }
