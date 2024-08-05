import JWT from "jsonwebtoken";

export default class JWTClass {
  static async jwtValidation(req, res, next) {
    if (!req.headers.authorization) {
      res
        .status(status_codes.FORBIDDEN)
        .send(
          Response.sendResponse(
            status_codes.FORBIDDEN,
            custom_message.errorMessage.tokenNotFound,
            [],
            []
          )
        );
    } else {
      const exe = req.headers.authorization.split(" ");
      if (!exe) {
        res
          .status(status_codes.FORBIDDEN)
          .send(
            Response.sendResponse(
              status_codes.FORBIDDEN,
              custom_message.errorMessage.tokenNotFound,
              [],
              []
            )
          );
      } else {
        JWT.verify(exe[1], config.JWTSecret, async (err, result) => {
          if (err) {
            res
              .status(status_codes.UNAUTHORISED)
              .send(
                Response.sendResponse(
                  status_codes.UNAUTHORISED,
                  custom_message.errorMessage.tokenNotFound,
                  [],
                  err
                )
              );
          } else {
            req.headers.id = result.id;
            req.headers.email = result.email;
            next();
          }
        });
      }
    }
  }

  static async jwtValueSend(req, res, next) {
    const exe = req.headers.authorization.split(" ");
    return await JWT.verify(exe[1], config.JWTSecret);
  }
}
