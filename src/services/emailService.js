// src/utils/emailService.js
import nodemailer from 'nodemailer';
import logger from '../services/logger.js';

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can also use host and port; service simplifies Gmail
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Verify the transporter configuration (optional, but recommended)
transporter.verify((error, success) => {
  if (error) {
    logger.error(`Email transporter error: ${error.message}`);
  } else {
    logger.info('Email transporter is ready to send messages');
  }
});

/**
 * sendEmail - sends an email using the configured transporter.
 * @param {Object} options - Options for the email.
 * @param {string} options.to - Recipient email address.
 * @param {string} options.subject - Email subject.
 * @param {string} options.text - Plain text body.
 * @param {string} [options.html] - HTML body (optional).
 */
export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"flipONE Support" <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
  } catch (error) {
    logger.error(`Failed to send email: ${error.message}`);
    throw error;
  }
};
