const contact = (name, email, subject, message) => `<!DOCTYPE html>
  <html style="margin: 0; padding: 0;">
    <head>
        <title>New Email</title>
    </head>
      <body style="margin: 0; padding: 0;">
        <p>You have a new message</p>
        <h3>Contact details</h3>
          <ul style="list-style: none;">
            <li>Name: ${name}</li>
            <li>Email: ${email}</li>
            <li>Subject: ${subject}</li>
          </ul>
        <h3>Message</h3>
        <p>${message}</p>
      </body>
    </html>`;

module.exports = { contact };
