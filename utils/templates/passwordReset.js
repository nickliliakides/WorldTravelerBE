const passwordReset = (message, url) => `<!DOCTYPE html>
  <html style="margin: 0; padding: 0;">
    <head>
        <title>Password Reset</title>
    </head>
    <body style="margin: 0; padding: 0;">
      <table class="table" cellpadding="0" cellspacing="0" style="background-color: #eee; empty-cells: hide; margin: 0 auto; padding: 0; width: 600px;">
        <tr>
            <td style="background-color: #999592; margin: 0 auto;">
              <h1 style="box-sizing: border-box; color: white; font-family: Helvetica, Arial, sans-serif; letter-spacing: 0.5px; line-height: 1.4; margin: 0; padding: 15px 25px; text-align: center; text-transform: uppercase;"> Password Reset </h1>
            </td>
        </tr>
        <tr>
            <td style="margin: 0 auto;">
                <a href="/" style="box-sizing: border-box; color: #999592 !important; font-family: Arial, Helvetica, sans-serif; line-height: 1.4; margin: 0; text-decoration: none;"><img class="full-width" src="https://images.unsplash.com/photo-1531417666976-ed2bdbeb043b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80" style="vertical-align: sub; width: 100%;"></a>
            </td>
        </tr>
        <tr>
            <td style="background-color: #999592; margin: 0 auto;">
                <p style="box-sizing: border-box; color: white; font-family: Helvetica, Arial, sans-serif; letter-spacing: 0.5px; line-height: 1.4; margin: 0; padding: 15px 25px; text-align: center; font-size:13px">
                  ${message}
                  \n\n
                  <a style="margin: 12px 0;" href=${url}>${url}</a>
                </p>                 
              </td>
        </tr>
      </table>
    </body>
  </html>`;

module.exports = { passwordReset };
