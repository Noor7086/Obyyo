import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Load email template
const loadTemplate = (templateName) => {
  try {
    const templatePath = join(__dirname, '../templates/emails', `${templateName}.html`);
    return readFileSync(templatePath, 'utf-8');
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw new Error(`Failed to load email template: ${templateName}`);
  }
};

// Replace placeholders in template
const replacePlaceholders = (template, data) => {
  let html = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value || '');
  }
  return html;
};

// Get logo HTML if logo URL is configured
const getLogoHtml = () => {
  // Use LOGO_URL if set, otherwise construct from FRONTEND_URL
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  // Logo is in public folder, accessible at root or assets
  const logoUrl = process.env.LOGO_URL || `${frontendUrl}/logo.png`;

  if (logoUrl) {
    // Return centered logo image with proper styling for email clients
    // The logo will be displayed instead of the text "Obyyo Lottery Prediction"
    return `<div style="text-align: center; margin-bottom: 20px;">
      <img src="${logoUrl}" alt="Obyyo Logo" style="max-width: 200px; height: auto; margin: 0 auto 15px auto; display: block;" />
    </div>`;
  }
  return '';
};

// Send email
const sendEmail = async ({ to, subject, templateName, data = {} }) => {
  try {
    // Validate required environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP credentials not configured. Email will not be sent.');
      return { success: false, message: 'Email service not configured' };
    }

    /* Commented out SMTP work as requested
    const transporter = createTransporter();
    
    // Load and process template
    let html = loadTemplate(templateName);
    html = replacePlaceholders(html, data);

    // Email options
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: to,
      subject: subject,
      html: html,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    */

    console.log('📧 SMTP Work Commented Out - Email would be sent to:', to);
    console.log('Subject:', subject);
    return { success: true, message: 'SMTP Disabled' };
  } catch (error) {
    console.error('Error in sendEmail (commented):', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email on registration
const sendWelcomeEmail = async (user) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const loginUrl = `${frontendUrl}/login`;

  // Format dates
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format lottery name
  const formatLotteryName = (lottery) => {
    const lotteryNames = {
      gopher5: 'Gopher 5',
      pick3: 'Pick 3',
      lottoamerica: 'Lotto America',
      megamillion: 'Mega Millions',
      powerball: 'Powerball'
    };
    return lotteryNames[lottery] || lottery;
  };

  const emailData = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    selectedLottery: formatLotteryName(user.selectedLottery),
    trialStartDate: formatDate(user.trialStartDate),
    trialEndDate: formatDate(user.trialEndDate),
    loginUrl: loginUrl,
    logoUrl: getLogoHtml()
  };

  return await sendEmail({
    to: user.email,
    subject: 'Welcome to Obyyo Lottery Prediction',
    templateName: 'welcome',
    data: emailData
  });
};

// Send forgot password email with reset code
const sendForgotPasswordEmail = async (user, resetCode) => {
  const emailData = {
    firstName: user.firstName,
    resetCode: resetCode,
    logoUrl: getLogoHtml()
  };

  return await sendEmail({
    to: user.email,
    subject: 'Password Reset Verification Code - Obyyo Lottery Prediction',
    templateName: 'forgot-password',
    data: emailData
  });
};

export {
  sendEmail,
  sendWelcomeEmail,
  sendForgotPasswordEmail
};

