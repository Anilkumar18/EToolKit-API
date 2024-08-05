import { serverLog } from "../../../utils/logger";
import AuthUtil from "../../../utils/auth";
import mailUtil from "../../../utils/email";
import * as userQuery from "../../../db/queries/user.query";

const generateRandomNumber = (digits) => {
  var n = digits > 0 ? digits - 1 : 0;
  return Math.floor(Math.random() * (9 * (Math.pow(10, n)))) + (Math.pow(10, n));
};

export default class userController {

  static async login(req, res) {
    try {
      const {
        email,
        password
      } = req.body;

      const user = await userQuery.findOne({
        email : email.toLowerCase(),
        isDeletedUser: false
      });
      if (user) {

        if (AuthUtil.comparePassword(password, user.password)) {
          const token = AuthUtil.signJWT({
            id: user._id,
            email: user.email,
            userRole: user.userRole,
          });

          return res.status(status_codes.OK).send(
            Response.sendResponse(
              status_codes.OK,
              custom_message.InfoMessage.loginSuccessful, {
              id: user._id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              userRole: user.userRole,
              token: "JWT " + token,
            },
              []
            )
          );
        } else {
          res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.wrongUsernamePassword, [], []));
        }
      } else {
        res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.wrongUsernamePassword, [], []));
      }
    } catch (err) {
      serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
      console.log(err);
      res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
    }
  }

  static async send_otp(req, res) {
    try {
      const { email, otpFor } = req.body;

      const user = await userQuery.findOne({ email : email.toLowerCase() });

      if (user) {

        let otpCode = generateRandomNumber(4);

        // Send Email
        let subject = "Emate - Reset Password";
        let message = otpCode + " is your OTP code. Use this code to complete reset the password.";

        mailUtil.sendEmail(email, subject, message);

        // Update OTP info
        let otpVerificationInfo = {
          otpFor: otpFor,
          otpCode: otpCode,
          createdOn: new Date(),
        };

        await userQuery.updateOne({ _id: user._id }, {
          otpVerificationInfo: otpVerificationInfo
        });

        res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.otpSendOnEmail, [], []));

      } else {
        res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.wrongEmail, [], []));
      }

    } catch (err) {
      serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
      console.log(err);
      res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
    }
  }

  static async reset_password(req, res) {
    try {
      const { email, otpCode, newPassword } = req.body;

      const user = await userQuery.findOne({ email : email.toLowerCase(), isDeletedUser: false });

      if (user) {

        if (user.otpVerificationInfo && user.otpVerificationInfo.otpCode == otpCode) {

          await userQuery.updateOne({ _id: user._id }, {
            otpVerificationInfo: null,
            password: AuthUtil.encryptPassword(newPassword)
          });

          res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.changePasswordSuccess, [], []));

        } else {
          res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.invalidOtp, [], []));
        }

      } else {
        res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.wrongEmail, [], []));
      }

    } catch (err) {
      serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
      console.log(err);
      res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
    }
  }

  static async deleteAccount(req, res) {
    try {
      const findPattern = { email: req.headers.email, isDeletedUser: false };
      const selectPattern = "firstName lastName countryCode phone designation userRole organizationId";
      const userData = await userQuery.findOne(findPattern, selectPattern);
      if (userData) {
        await userQuery.updateOne(findPattern, {
          isDeletedUser: true
        });
        serverLog.info(`[${req.originalUrl}] [${req.method}], [${status_codes.OK}] {response : "${req.headers.email} successfully deleted "}`)
        return res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.deletedSuccessfully, [], []));
      } else {
        serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.NOTFOUND}] {error :User not found.!}`)
        return res.status(status_codes.NOTFOUND).send(Response.sendResponse(status_codes.NOTFOUND, custom_message.errorMessage.userNotFound, [], []));
      }
    } catch (err) {
      serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`)
      res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
    }
  }
}
