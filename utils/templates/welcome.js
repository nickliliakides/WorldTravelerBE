const welcome = (message, name, url) => `<!DOCTYPE html>
  <html style="margin: 0; padding: 0;">
  
      <head>
          <title>One | Email template!</title>
      </head>
  
          <body style="margin: 0; padding: 0;">
              <table class="table" cellpadding="0" cellspacing="0" style="background-color: #eee; empty-cells: hide; margin: 0 auto; padding: 0; width: 600px;">
                  <tr>
                      <td style="background-color: #999592; margin: 0 auto;">
                          <h1 style="box-sizing: border-box; color: white; font-family: Helvetica, Arial, sans-serif; letter-spacing: 0.5px; line-height: 1.4; margin: 0; padding: 15px 25px; text-align: center; text-transform: uppercase;">Welcome to World Traveler Inc ${name}!</h1></td>
                  </tr>
                  <tr>
                      <td style="margin: 0 auto;">
                          <img class="full-width" src="https://res.cloudinary.com/nnck/image/upload/v1726577824/logo_isc7sp.png" style="vertical-align: sub; width: 100%;">
                      </td>
                  </tr>
                  <tr>
                      <td style="background-color: #999592; margin: 0 auto;">
                          <p style="box-sizing: border-box; color: white; font-family: Helvetica, Arial, sans-serif; letter-spacing: 0.5px; line-height: 1.4; margin: 0; padding: 15px 25px; text-align: center; font-size:14px">
                            ${message}
                            <a style="margin: 12px 0;" href=${url}>${url}</a>
                          </p>
                            
                          </td>
                  </tr>
              </table>
          </body>
  
    </html>`;

module.exports = { welcome };
