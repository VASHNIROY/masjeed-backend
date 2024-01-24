import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
 
const nodemailerConfig = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    service: process.env.SMTP_SERVICE,
    secure: false, // Use STARTTLS
    requireTLS: true,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
 
  return transporter;
};
 
export default nodemailerConfig;