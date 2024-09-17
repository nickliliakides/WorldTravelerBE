const nodemailer = require('nodemailer');
const { passwordReset } = require('./templates/passwordReset');
const { welcome } = require('./templates/welcome');

module.exports = class Email {
  constructor(user, message, url, send = true) {
    this.to = send ? user.email : process.env.EMAIL_FROM;
    this.firstName = user.name.split(' ')[0];
    this.email = user.email;
    this.message = message;
    this.url = url || '';
    this.from = `World Traveler INC <${process.env.EMAIL_FROM}>`;
  }

  createNewTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SEND_IN_BLUE_SMTP_USER,
          pass: process.env.SEND_IN_BLUE_SMTP_KEY,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(subject, type = 'welcome') {
    const selectHtml = (typeOfEmail) => {
      switch (typeOfEmail) {
        case 'reset':
          return passwordReset(this.message, this.url);
        // case 'contact':
        //   return contact(this.firstName, this.email, this.message);
        default:
          return welcome(this.message, this.firstName, this.url);
      }
    };

    // Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html: selectHtml(type),
      text: `${this.message} \n\n ${this.url}`,
    };

    // Create transport and send email
    await this.createNewTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('Welcome to World Traveler Inc, account activation link');
  }

  async sendPasswordReset() {
    await this.send(
      'Your password reset link, VALID ONLY for 10 minutes.',
      'reset',
    );
  }
};
