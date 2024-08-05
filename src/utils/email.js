const Config = require("../config/config");
const nodemailer = require("nodemailer");
import { serverLog, requestLog } from "../utils/logger";


module.exports.sendEmail = (to_email, subject, message) => {

  var transport = nodemailer.createTransport({
    host: Config.SMTP_HOST,
    secureConnection: true,
    port: Config.SMTP_PORT,
    auth: {
      user: Config.SMTP_USER,
      pass: Config.SMTP_PASS,
    }
  });

  // setup e-mail data with unicode symbols
  var mailOptions = {
    from: Config.SMTP_FROM_NAME + "<" + Config.SMTP_FROM_EMAIL + ">",
    to: to_email,
    subject: subject,
    html: message
  }

  // send mail with defined transport object
  transport.sendMail(mailOptions, function (err, response) {
    if (err) {
      console.log(err.toString());
    } else {
      console.log("Mail sent.");
    }
  });
};



module.exports.email = (params) => {
  return new Promise((resolve, reject) => {
    try {
      const smtpTransport = nodemailer.createTransport({
        host: Config.SMTP_HOST,
        port: Config.SMTP_PORT,
        secure: false,
        auth: {
          user: Config.SMTP_USER,
          pass: Config.SMTP_PASS,
        },
      });

      var url = "";
      var mailOptions = {};

      if (params.type === "VERIFICATION") {
        url = config.applicationUrl + "user/verifyemail/" + params.token;

        mailOptions = {
          from: "mohit.sisodia@ics-global.in",
          to: params.to,
          subject: "Please verify your email for DPW-Digital Business card",
          text:
            "Hello [" +
            params.firstName +
            " " +
            params.lastName +
            "]," +
            "\n\nWe are happy you signed up with Digital business card app. Please confirm that [" +
            params.to +
            "] is your email address by clicking on the link " +
            "\n\n" +
            url +
            "\n\nIf you did not signup for the account you can ignore this email and the account will be deleted." +
            "\n\nNote: This is system generated email. Please do not reply on this email.",
        };
      }

      if (params.type === "FORGOT-PASSWORD") {
        url = config.applicationUrl + "user/reset-password/" + params.token;

        mailOptions = {
          from: "mohit.sisodia@ics-global.in",
          to: params.to,
          subject: "DP World [Reset Your Password]",
          text:
            "Hello " +
            params.firstName +
            " " +
            params.lastName +
            "," +
            "\n\nWe received requested to reset password for the Digital Business card app associated with " +
            params.to +
            "." +
            "\n\nNo changes have been made to your account yet." +
            "\n\nYou can reset your password by clicking Button below or use link " +
            "\n\n" +
            url +
            "\n\n[Reset password button]" +
            "\n\nIf you did not request a new password, please let us know immediately by replying to " +
            params.contactEmail +
            " email." +
            "\n\nYours," +
            "\n\nDP World Team" +
            "\n\nNote: This is a system generated email. Please do not reply on this email.",
        };
      }

      if (params.type === "RESET-PASSWORD") {
        mailOptions = {
          from: "mohit.sisodia@ics-global.in",
          to: params.to,
          subject: "DP World [Password Changed]",
          text:
            "Hello " +
            params.firstName +
            " " +
            params.lastName +
            "," +
            "\n\nYour password reset for Digital Business card app has been successful." +
            "\n\nFor any questions, you can contact us at " +
            params.contactEmail +
            "\n\nThank you," +
            "\n\nDP World Team",
        };
      }

      smtpTransport.sendMail(mailOptions, (err, info) => {
        if (err) { serverLog.error(`{error : "Mail send error"} ${err}`); reject(err, []) };
        if (info) { serverLog.info(`{message : "Mail sent"}`); resolve(info); }
      });
    } catch (err) {
      reject(err);
    }
  });
};
