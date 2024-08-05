import bcrypt from "bcrypt-nodejs";
import jsonwebtoken from "jsonwebtoken";

export default class AuthUtil {
  static encryptPassword(password, salt = bcrypt.genSaltSync(10)) {
    return bcrypt.hashSync(password, salt);
  }

  static comparePassword(password, hash) {
    return bcrypt.compareSync(password, hash);
  }

  static signJWT(payload) {
    const opts = {
      expiresIn: "365d",
    };
    return jsonwebtoken.sign(payload, config.JWTSecret, opts);
  }
}
