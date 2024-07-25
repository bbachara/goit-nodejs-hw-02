const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.mailgun.org",
  port: 587,
  secure: false,
  auth: {
    user: process.env.M_USER,
    pass: process.env.M_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendVerificationEmail = async (email, verificationToken) => {
  const verificationLink = `http://localhost:3000/api/users/verify/${verificationToken}`;

  try {
    await transporter.sendMail({
      from: '"Bart App" <contact@contact.com>',
      to: email,
      subject: "Email Verification",
      text: `Please verify your email by clicking on the following link: ${verificationLink}`,
      html: `<p>Please verify your email by clicking on the following link: <a href="${verificationLink}">${verificationLink}</a></p>`,
    });
    console.log("Verification email sent");
  } catch (error) {
    console.error("Error occurred: ", error);
  }
};

module.exports = { sendVerificationEmail };
