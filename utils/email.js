const nodemailer = require('nodemailer')
const pug = require('pug')
const htmlToText = require('html-to-text')

// new Email(user, url).sendWelcome()

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email
    this.firstName = user.name.split(' ')[0]
    this.url = url;
    this.from = `Jonas Schmedtmann <${process.env.EMAIL_FROM}>`
  }

  newTransport() {
    if(process.env.NODE_ENV === 'production'){
      // sendgrid
      return nodemailer.createTransport({
        servie: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      })
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  }

  // send the actual email
  async send(template, subject) {
    // 1) render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    })

    // 2) define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: htmlToText.fromString(html),
      // html:
      html

    }

    // 3) create a transport and send email
    // this.newTransport()
    // await transporter.sendMail(mailOptions)
    await this.newTransport().sendMail(mailOptions)
  }

  async sendWelcome(){
    await this.send('welcome', 'welcome to the Natours family!')
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset token (valid for only 10 mins)')
  }
}

const sendEmail = async options => {
  // 1) create a transporter
  // const transporter = nodemailer.createTransport({
  //   host: process.env.EMAIL_HOST,
  //   port: process.env.EMAIL_PORT,
  //   auth: {
  //     user: process.env.EMAIL_USERNAME,
  //     pass: process.env.EMAIL_PASSWORD
  //   }
  // })

  // 2) define the email options
  // const mailOptions = {
  //   from: 'Jonas Schmedtmann <hellofd@jonas.io>',
  //   to: options.email,
  //   subject: options.subject,
  //   text: options.message,
  //   // html: 
  // }

  // 3) actually send the email, the below returns a promise
  // await transporter.sendMail(mailOptions)
}

// module.exports = sendEmail;