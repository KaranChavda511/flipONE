// src/utils/emailService.js
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import logger from '../services/logger.js';



// if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
//   throw new Error('Gmail credentials missing in environment variables');
// }

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, 
  // service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, //only for local testing
  },
});



transporter.verify((error) => {
  if (error) {
    logger.error(`Email transporter error: ${error.message}`);
  } else {
    logger.info('Email transporter is ready to send messages');
  }
});



const renderTemplate = async (templateName, data) => {
  try {
    const templatePath = path.join(
      process.cwd(),
      'src', 
      'views',
      'emails',
      `${templateName}.ejs`
    );
    const template = fs.readFileSync(templatePath, 'utf-8');
    return ejs.render(template, data);
  } catch (error) {
    logger.error(`Template Rendering Error (${templateName}):`, error);
    throw new Error('Failed to render email template');
  }
};



export const sendEmail = async (options) => {
  try {

    let html;
    if (options.template) {
      html = await renderTemplate(options.template, options.templateData);
    }

    const mailOptions = {
      from: `"flipONE Support" <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}`, {
      messageId: info.messageId,
      subject: options.subject
    });
  
    return true;

  } catch (error) {
    logger.error(`Email Failed to ${options.to}`, {
      error: error.message,
      subject: options.subject
    });
    throw error; 
  }
};
