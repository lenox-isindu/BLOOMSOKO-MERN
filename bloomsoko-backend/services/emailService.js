// services/emailService.js - Complete version
import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail', // or your email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD // Use app password for Gmail
    }
  });
};

// Send email function
export const sendEmail = async (emailData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Bloomsoko" <${process.env.EMAIL_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: generateEmailTemplate(emailData.template, emailData.context)
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;

  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Generate email templates
const generateEmailTemplate = (template, context) => {
  const templates = {
    'order-confirmation': `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2E7D32; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .order-details { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2E7D32; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
            <p>Thank you for your purchase!</p>
          </div>
          <div class="content">
            <h2>Hello ${context.recipientName},</h2>
            <p>Your order <strong>${context.orderNumber}</strong> has been confirmed.</p>
            
            <div class="order-details">
              <h3>Pickup Information:</h3>
              <p><strong>Station:</strong> ${context.pickupStation}</p>
              <p><strong>Contact:</strong> ${context.stationContact}</p>
              <p><strong>Hours:</strong> ${context.operatingHours}</p>
            </div>

            <div class="order-details">
              <h3>Important Instructions:</h3>
              <ul>
                <li>Carry your <strong>Original National ID</strong></li>
                <li>Pay shipping fee at the station</li>
                <li>Provide order number: <strong>${context.orderNumber}</strong></li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 Bloomsoko. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  return templates[template] || '<p>Email content</p>';
};