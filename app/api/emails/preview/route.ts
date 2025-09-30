import { NextRequest, NextResponse } from 'next/server'
import { render } from '@react-email/render'
import { WelcomeEmail } from '@/components/Email/templates/WelcomeEmail'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId') || 'welcome-email'
    const format = searchParams.get('format') || 'html' // 'html' or 'text'

    let html: string
    let text: string = ''

    // Handle different templates
    if (templateId === 'welcome-email') {
      // Render the welcome email with sample data
      html = await render(WelcomeEmail({
        discountCode: 'WELCOME10-SAMPLE',
        customerEmail: 'customer@example.com',
      }))

      // Also generate plain text version
      text = await render(WelcomeEmail({
        discountCode: 'WELCOME10-SAMPLE',
        customerEmail: 'customer@example.com',
      }), {
        plainText: true
      })
    } else {
      // For other templates, return a placeholder
      html = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px;">
            <h1>Template Preview</h1>
            <p>Template ID: ${templateId}</p>
            <p>This template doesn't have a preview configured yet.</p>
          </body>
        </html>
      `
      text = `Template Preview\nTemplate ID: ${templateId}\nThis template doesn't have a preview configured yet.`
    }

    // Return based on format
    if (format === 'text') {
      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    }

    // Default to HTML with some wrapper for better viewing
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Preview - ${templateId}</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: #f5f5f5;
            }
            .preview-header {
              background: #333;
              color: white;
              padding: 20px;
              text-align: center;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .preview-header h1 {
              margin: 0;
              font-size: 18px;
              font-weight: 500;
            }
            .preview-header p {
              margin: 5px 0 0 0;
              font-size: 14px;
              opacity: 0.8;
            }
            .preview-actions {
              margin-top: 15px;
            }
            .preview-actions button {
              background: #4A9B4E;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              margin: 0 5px;
              cursor: pointer;
              font-size: 14px;
            }
            .preview-actions button:hover {
              background: #3a8b3e;
            }
            .email-container {
              max-width: 100%;
              margin: 0 auto;
              background: white;
            }
          </style>
        </head>
        <body>
          <div class="preview-header">
            <h1>📧 Email Preview: ${templateId === 'welcome-email' ? 'Welcome Email' : templateId}</h1>
            <p>This is how your email will look when sent</p>
            <div class="preview-actions">
              <button onclick="window.location.href='/email'">← Back to Email Manager</button>
              <button onclick="window.location.href='?templateId=${templateId}&format=text'">View Plain Text</button>
            </div>
          </div>
          <div class="email-container">
            ${html}
          </div>
        </body>
      </html>
    `

    return new NextResponse(fullHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { success: false, message: 'Error generating preview', error: (error as Error).message },
      { status: 500 }
    )
  }
}