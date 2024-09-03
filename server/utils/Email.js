const nodemailer = require("nodemailer");
const { convert } = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Realtime-Chatting-App <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual email
  async send(html, subject) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html), // Optionally convert HTML to plain text
    };

    // Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    const html = `
      <h1>Welcome to the Realtime-Chatting-App Family, ${this.firstName}!</h1>
      <p>We are excited to have you onboard.</p>
      <p>Click <a href="${this.url}">here</a> to get verified.</p>
    `;

    await this.send(html, "Welcome to the Realtime-Chatting-App Family!");
  }

  async sendPasswordReset() {
    const html = `
    <h1>Password Reset Request</h1>
    <p>Hi ${this.firstName},</p>
    <p>You requested a password reset. Click the link below to set a new password. This link is valid for only 10 minutes.</p>
    <p><a href="${this.url}">Reset your password</a></p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>Thanks,</p>
    <p>The Realtime-Chatting-App Team</p>
  `;

    await this.send(
      html,
      "Your password reset token (valid only for 10 minutes)"
    );
  }
};
