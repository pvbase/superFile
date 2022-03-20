var fs = require("fs");
var readline = require("readline");
var { google } = require("googleapis");
const { GoogleAuth, JWT, OAuth2Client } = require("google-auth-library");
const MailComposer = require("nodemailer/lib/mail-composer");
const sgMail = require("@sendgrid/mail");

var SCOPES = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send",
];

var TOKEN_PATH = require("../config/token.json");
// var TOKEN_PATH = undefined

var CREDENTIALS_PATH = require("../config/credentials.json");

function makeBody(to, from, subject, message, attachmentsPaths) {
  var boundary = "__myapp__";
  var nl = "\n";
  // var attach = (fs.readFileSync("./receipt.pdf")).toString("base64");
  var attach;
  if (attachmentsPaths.length > 0) {
    attach = attachmentsPaths[0].toString("base64");
  }
  var str = [
    "MIME-Version: 1.0",
    "Content-Transfer-Encoding: 7bit",
    "to: " + to,
    "from: " + from,
    "subject: " + subject,
    "Content-Type: multipart/alternate; boundary=" + boundary + nl,
    "--" + boundary,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit" + nl,
    message + nl,
    "--" + boundary,
    "--" + boundary,
    "Content-Type: Application/pdf; name=receipt.pdf",
    "Content-Disposition: attachment; filename=receipt.pdf",
    "Content-Transfer-Encoding: base64" + nl,
    attach,
    "--" + boundary + "--",
  ].join("\n");
  var encodedMail = new Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  // console.log(encodedMail)
  return encodedMail;
}

/**
 *
 * @param {*} provider - "gmail" or "zoho" or "outlook", etc
 * @param {*} to - email address of recepient
 * @param {*} from - email address of sender
 * @param {*} subject - subject of email
 * @param {*} message - HTML formatted body of email message
 * @param {*} attachmentsPaths - array of Strings (each String has path to 1 attachment)
 */
async function sendEmail(
  provider,
  to,
  from,
  subject,
  message,
  attachmentsPaths,
  namespace,
  attachmentType //type is for dailyreport / challan / receipt
) {
  try {
    switch (provider) {
      case "gmail": {
        let credentials = CREDENTIALS_PATH;
        // console.log("credentials: ");
        // console.log(credentials);

        let oa2client = await authorize(credentials);
        // console.log("oa2client .. : ");
        // console.log(JSON.parse(JSON.stringify(oa2client)));

        var gmail = google.gmail("v1");
        var rawMsg = makeBody(to, from, subject, message, attachmentsPaths);
        // console.log(rawMsg);
        gmail.users.messages.send(
          {
            auth: oa2client,
            userId: "me",
            resource: {
              raw: rawMsg,
            },
          },
          function (err, response) {
            // console.log(err || response)
            if (err) throw err;
            else return response;
          }
        );

        // var rawMsg = await createEmailPayload(to, from, subject, message, attachmentsPaths);
        // let mail = new MailComposer({
        //   to: to,
        //   from: from,
        //   html: message,
        //   subject: subject,
        //   textEncoding: "base64",
        //   attachments: attachmentsPaths,
        // });
        // mail.compile().build((error, msg) => {
        //   if (error) return console.log("Error compiling email " + error);
        //   const encodedMessage = Buffer.from(msg)
        //     .toString("base64")
        //     .replace(/\+/g, "-")
        //     .replace(/\//g, "_")
        //     .replace(/=+$/, "");
        //   gmail.users.messages.send(
        //     {
        //       auth: oa2client,
        //       userId: "me",
        //       resource: {
        //         raw: encodedMessage,
        //       },
        //     },
        //     function (err, response) {
        //       // console.log(err || response)
        //       if (err) throw err;
        //       else return response;
        //     }
        //   );
        // });
      } // case 'gmail'
      case "sendgrid": {
        if (
          namespace == undefined ||
          namespace == "undefined" ||
          namespace == null
        ) {
          let sgKey = process.env.sendgridKey;
          sgMail.setApiKey(sgKey);
          console.log("attachment", typeof attachmentsPaths);
          let msg;
          if (attachmentsPaths.length == 0) {
            msg = {
              to: to, // Change to your recipient
              from: process.env.sendgridEmail, // Change to your verified sender
              subject: subject,
              html: message,
            };
          }
          if (attachmentsPaths.type == "Buffer") {
            const attachment = Buffer.from(attachmentsPaths).toString("base64");

            let filename =
              attachmentType && attachmentType == "dailyReport"
                ? `Daily Report.pdf`
                : "Receipt.pdf";
            console.log(filename);

            msg = {
              to: to, // Change to your recipient
              from: process.env.sendgridEmail, // Change to your verified sender
              subject: subject,
              html: message,
              attachments: [
                {
                  content: attachment,
                  filename: filename,
                  type: "application/pdf",
                  disposition: "attachment",
                },
              ],
            };
          }

          // const msg = {
          //   to: to, // Change to your recipient
          //   from: from, // Change to your verified sender
          //   subject: subject,
          //   text: 'and easy to do anywhere, even with Node.js',
          //   html: message,
          // }
          await sgMail
            .send(msg)
            .then(async() => {
              console.log("Sent Email");
              var obj = {
                success: true,
              };
              return obj;
            })
            .catch((error) => {
              console.log("error", error);
              var obj = {
                success: false,
              };
              return obj;
            });
        } else {
          let sgKey =
            "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";
          sgMail.setApiKey(sgKey);
          console.log("attachment", typeof attachmentsPaths);
          let msg;
          if (attachmentsPaths.length == 0) {
            msg = {
              to: to, // Change to your recipient
              from: "noreply@ncfe.ac.in", // Change to your verified sender
              subject: subject,
              html: message,
            };
          }

          if (attachmentsPaths.type == "Buffer") {
            const attachment = Buffer.from(attachmentsPaths).toString("base64");
            let filename =
              attachmentType && attachmentType == "dailyReport"
                ? `Daily Report.pdf`
                : "Receipt.pdf";
            console.log(filename);

            msg = {
              to: to, // Change to your recipient
              from: "noreply@ncfe.ac.in", // Change to your verified sender
              subject: subject,
              html: message,
              attachments: [
                {
                  content: attachment,
                  filename: filename,
                  type: "application/pdf",
                  disposition: "attachment",
                },
              ],
            };
          }

          // const msg = {
          //   to: to, // Change to your recipient
          //   from: from, // Change to your verified sender
          //   subject: subject,
          //   text: 'and easy to do anywhere, even with Node.js',
          //   html: message,
          // }
          await sgMail
            .send(msg)
            .then(async() => {
              console.log("Sent Email");
              var obj = {
                success: true,
              };
              return obj;
            })
            .catch((error) => {
              console.log("error", error);
              var obj = {
                success: false,
              };
              return obj;
            });
        }
      } // case 'gmail'
    }
  } catch (err) {
    return err;
  }
}
async function authorize(credentials) {
  console.log(credentials);
  try {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    // var auth = new GoogleAuth();
    var oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    var token = TOKEN_PATH;
    if (!token || token == undefined || token == null) {
      token = await getNewToken(oauth2Client);
    }
    oauth2Client.credentials = token;
    return oauth2Client;
  } catch (err) {
    console.log("authorize: " + err.message);
  }
} // authorize
async function getNewToken(oauth2Client) {
  TOKEN_PATH = "../config/token.json";
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url: ", authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", function (code) {
    rl.close();
    oauth2Client.getToken(code, function (err, token) {
      if (err) {
        console.log("Error while trying to retrieve access token", err);
        return;
      }
      oauth2Client.setCredentials(token);
      console.log("Token stored to", TOKEN_PATH);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH, token);
      });
      // callback(oauth2Client);
      return token;
    });
  });
}
// testing code below
var attachmentsPaths = ["./receipt_1.pdf"];
// sendEmail(
//     'gmail',
//     'naveen.p@gmail.com',
//     'notice.exam@hkbk.edu.in',
//     'TEST 5',
//     '<h1 style="color:blue">Hi Prashanth</h1><br><p>Welcome to zenqore</p>',
//     attachmentsPaths
// )
// testing code ends

async function createEmailPayload(to, from, subject, html, attachments) {
  // ----------nodemailer test----------------------------------------------------

  let mail = new MailComposer({
    to: to,
    from: from,
    html: html,
    subject: subject,
    textEncoding: "base64",
    attachments: attachments,
  });

  return await mail.compile().build((error, msg) => {
    if (error) return console.log("Error compiling email " + error);
    const encodedMessage = Buffer.from(msg)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    gmail.users.messages.send(
      {
        auth: oa2client,
        userId: "me",
        resource: {
          raw: encodedMessage,
        },
      },
      function (err, response) {
        // console.log(err || response)
        if (err) throw err;
        else return response;
      }
    );
  });
}
module.exports = { sendEmail };
