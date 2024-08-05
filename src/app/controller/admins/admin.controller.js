import { serverLog } from "../../../utils/logger";
import UsersModel from '../../../db/models/user.model';
import * as adminQuery from '../../../db/queries/admin.query';
import AuthUtil from '../../../utils/auth';
import mailUtil from "../../../utils/email";

const generateRandomNumber = (digits) => {
    var n = digits > 0 ? digits - 1 : 0;
    return Math.floor(Math.random() * (9 * (Math.pow(10, n)))) + (Math.pow(10, n));
};

export default class adminController {

    static async create(req, res) {
        try {
            const {
                email,
                password,
                firstName,
                lastName
            } = req.body;

            const admin = new UsersModel({
                email : email.toLowerCase(),
                password: AuthUtil.encryptPassword(password),
                isAdmin: true,
                firstName,
                lastName
            });

            await adminQuery.createAdmin(admin);

            res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.adminRegister, [], []));
        } catch (err) {
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async login(req, res) {
        try {
            const {
                email,
                password
            } = req.body;

            const findAdmin = await adminQuery.findAdmin({
                email: email.toLowerCase(),
                isAdmin: true
            });
            if (findAdmin) {
                if (AuthUtil.comparePassword(password, findAdmin.password)) {
                    const token = AuthUtil.signJWT({
                        id: findAdmin._id,
                        email: findAdmin.email,
                        isAdmin: findAdmin.isAdmin,
                        userRole: findAdmin.userRole,
                    });

                    return res.status(status_codes.OK).send(
                        Response.sendResponse(
                            status_codes.OK,
                            custom_message.InfoMessage.loginSuccessful, {
                            id: findAdmin._id,
                            firstName: (findAdmin.firstName) ? findAdmin.firstName : "",
                            lastName: (findAdmin.lastName) ? findAdmin.lastName : "",
                            email: findAdmin.email,
                            userRole: findAdmin.userRole,
                            token: "JWT " + token,
                        },
                            []
                        )
                    );
                } else {
                    res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.wrongUsernamePassword, [], []));
                }
            } else {
                res.status(status_codes.UNAUTHORISED).send(Response.sendResponse(status_codes.UNAUTHORISED, custom_message.errorMessage.notFound, [], []));
            }
        } catch (err) {
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async send_otp(req, res) {
        try {
            const { email, otpFor } = req.body;

            serverLog.info(`[${req.originalUrl}] [${req.method}], {request_payload : ${JSON.stringify(req.body)}}`);

            const user = await adminQuery.findAdmin({ email : email.toLowerCase() });

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

                await adminQuery.updateOne({ _id: user._id }, {
                    otpVerificationInfo: otpVerificationInfo
                });

                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}], {response_message : "otp sent to ${email}."}`);
                res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.otpSendOnEmail, [], []));

            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}], {error_message : ${custom_message.errorMessage.wrongEmail}}`);
                res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.wrongEmail, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async reset_password(req, res) {
        try {
            const { email, otpCode, newPassword } = req.body;
            serverLog.info(`[${req.originalUrl}] [${req.method}], {request_payload : ${JSON.stringify(req.body)}}`);

            const user = await adminQuery.findAdmin({ email : email.toLowerCase() });

            if (user) {

                if (user.otpVerificationInfo && user.otpVerificationInfo.otpCode == otpCode) {

                    await adminQuery.updateOne({ _id: user._id }, {
                        otpVerificationInfo: null,
                        password: AuthUtil.encryptPassword(newPassword)
                    });

                    serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}], {response_message : "Password reset successfully for ${email}."}`);
                    res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.changePasswordSuccess, [], []));

                } else {
                    serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}], {error_message : ${custom_message.errorMessage.invalidOtp}}`);
                    res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.invalidOtp, [], []));
                }

            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}], {error_message : ${custom_message.errorMessage.wrongEmail}}`);
                res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.wrongEmail, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}