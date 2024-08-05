const _crypto = require("crypto");
import CryptoJS from "crypto-js";

module.exports.encryptStringWithRsaPublicKey = (toEncrypt, PublicKey) => {
  console.log("PublicKey :-", PublicKey);
  var buffer = Buffer.from(toEncrypt);
  var encrypted = _crypto.publicEncrypt(PublicKey, buffer);
  return encrypted.toString("base64");
};

module.exports.decryptStringWithRsaPrivateKey = (toDecrypt, PrivateKey) => {
  var buffer = Buffer.from(toDecrypt, "base64");
  var decrypted = _crypto.privateDecrypt(PrivateKey, buffer);
  return decrypted.toString("utf8");
};

module.exports.hash = (password) => {
  return CryptoJS.SHA512(password).toString().toUpperCase();
};
