const nodemailer = require("nodemailer");
require('dotenv').config();


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail
    pass: process.env.EMAIL_PASS, // app password
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Failed:', error);
  } else {
    console.log('✅ SMTP Connected:', success);
  }
});


module.exports = transporter;
