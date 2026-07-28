/**
 * Reusable HTML Email Templates for Smart Library
 */

export function buildHtmlEmail(subject: string, contentHtml: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            margin-top: 40px;
            margin-bottom: 40px;
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 32px 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .content {
            padding: 40px;
            color: #334155;
            font-size: 16px;
            line-height: 1.6;
        }
        .content h2 {
            color: #0f172a;
            font-size: 20px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 16px;
        }
        .content p {
            margin-top: 0;
            margin-bottom: 16px;
        }
        .content p:last-child {
            margin-bottom: 0;
        }
        .footer {
            background-color: #f1f5f9;
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 0;
            color: #64748b;
            font-size: 13px;
            line-height: 1.5;
        }
        .button {
            display: inline-block;
            background-color: #10b981;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            margin-top: 16px;
            margin-bottom: 16px;
            text-align: center;
        }
        .highlight-box {
            background-color: #f8fafc;
            border-left: 4px solid #10b981;
            padding: 16px 20px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
        }
        .highlight-box p {
            margin: 0;
            color: #475569;
        }
        @media only screen and (max-width: 600px) {
            .container {
                margin-top: 0;
                margin-bottom: 0;
                border-radius: 0;
                width: 100% !important;
            }
            .header, .content, .footer {
                padding-left: 24px !important;
                padding-right: 24px !important;
            }
        }
    </style>
</head>
<body>
    <div style="background-color: #f8fafc; padding: 20px 0;">
        <div class="container">
            <div class="header">
                <h1>Smart Library</h1>
            </div>
            <div class="content">
                ${contentHtml}
            </div>
            <div class="footer">
                <p>This is an automated message from the Smart Library system. Please do not reply directly to this email.</p>
                <p style="margin-top: 8px;">&copy; ${new Date().getFullYear()} Smart Library. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
}
