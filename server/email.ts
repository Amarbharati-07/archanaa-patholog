import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(to: string, otp: string, purpose: string): Promise<boolean> {
  const subject = purpose === "email_verification" 
    ? "Verify Your Email - Archana Pathology Lab"
    : "Password Reset OTP - Archana Pathology Lab";
  
  const purposeText = purpose === "email_verification"
    ? "verify your email address"
    : "reset your password";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #005B96, #87CEEB); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-box { background: #005B96; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
        .warning { color: #e74c3c; font-size: 14px; margin-top: 20px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Archana Pathology Lab</h1>
        </div>
        <div class="content">
          <h2>Your One-Time Password</h2>
          <p>Use the following OTP to ${purposeText}:</p>
          <div class="otp-box">${otp}</div>
          <p>This OTP is valid for <strong>5 minutes</strong> and can only be used once.</p>
          <p class="warning">If you did not request this OTP, please ignore this email or contact our support team.</p>
        </div>
        <div class="footer">
          <p>Archana Pathology Lab | NABL Accredited</p>
          <p>Contact: +91 98765 43210 | info@archanapathology.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.log(`[DEV MODE] Email OTP for ${to}: ${otp}`);
      return true;
    }

    await transporter.sendMail({
      from: `"Archana Pathology Lab" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    console.log(`[FALLBACK] Email OTP for ${to}: ${otp}`);
    return true;
  }
}
