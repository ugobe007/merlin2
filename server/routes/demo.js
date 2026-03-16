import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Configure nodemailer transporter
// Using environment variables for email configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

router.post('/send-demo-request', async (req, res) => {
  try {
    const { name, email, company, phone, preferredDate, preferredTime, message } = req.body;

    // Validate required fields
    if (!name || !email || !company) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Name, email, and company are required'
      });
    }

    // Email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #14b8a6); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .field { margin-bottom: 20px; }
            .field-label { font-weight: bold; color: #10b981; margin-bottom: 5px; }
            .field-value { background: white; padding: 10px; border-radius: 5px; border-left: 3px solid #10b981; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Demo Request</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Received: ${new Date().toLocaleString()}</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="field-label">👤 Contact Name:</div>
                <div class="field-value">${name}</div>
              </div>
              
              <div class="field">
                <div class="field-label">📧 Email:</div>
                <div class="field-value"><a href="mailto:${email}">${email}</a></div>
              </div>
              
              <div class="field">
                <div class="field-label">🏢 Company:</div>
                <div class="field-value">${company}</div>
              </div>
              
              ${phone ? `
              <div class="field">
                <div class="field-label">📱 Phone:</div>
                <div class="field-value"><a href="tel:${phone}">${phone}</a></div>
              </div>
              ` : ''}
              
              ${preferredDate ? `
              <div class="field">
                <div class="field-label">📅 Preferred Date:</div>
                <div class="field-value">${new Date(preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              ` : ''}
              
              ${preferredTime ? `
              <div class="field">
                <div class="field-label">🕐 Preferred Time:</div>
                <div class="field-value">${preferredTime.charAt(0).toUpperCase() + preferredTime.slice(1)}</div>
              </div>
              ` : ''}
              
              ${message ? `
              <div class="field">
                <div class="field-label">💬 Additional Information:</div>
                <div class="field-value">${message.replace(/\n/g, '<br>')}</div>
              </div>
              ` : ''}
              
              <div class="footer">
                <p>This demo request was submitted through the Merlin Energy website.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@merlinenergy.net',
      to: 'info@merlinenergy.net',
      subject: `Demo Request from ${name} - ${company}`,
      html: emailHtml,
      replyTo: email
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ 
      success: true, 
      message: 'Demo request sent successfully' 
    });

  } catch (error) {
    console.error('Error sending demo request email:', error);
    res.status(500).json({ 
      error: 'Failed to send demo request',
      message: error.message 
    });
  }
});

export default router;
