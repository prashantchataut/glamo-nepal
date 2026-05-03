export interface BaseEmailData {
  previewText: string
}

export function renderBaseTemplate(content: string, data: BaseEmailData): string {
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>GLAMO Nepal</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f9f5f3; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f9f5f3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <!--[if mso]>
  <table width="600" cellpadding="0" cellspacing="0" align="center"><tr><td>
  <![endif]-->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f5f3;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#c4a882,#a08060);padding:30px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:2px;">GLAMO NEPAL</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1px;">Premium Beauty &amp; Skincare</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color:#faf7f5;padding:20px 40px;text-align:center;font-size:12px;color:#999;">
              <p style="margin:0;">&copy; ${year} GLAMO Nepal. All rights reserved.</p>
              <p style="margin:4px 0 0;">Kathmandu, Nepal &middot; <a href="https://glamonepal.com" style="color:#a08060;text-decoration:none;">glamonepal.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <!--[if mso]>
  </td></tr></table>
  <![endif]-->
</body>
</html>`
}