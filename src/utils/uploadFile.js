"use strict";
import multer from "multer";

module.exports.uploadFile = (params, req, res) => {
  return new Promise((resolve, reject) => {
    try {
      let imageName = "";
      const storage = multer.diskStorage({
        destination: (req, file, callback) => {
          callback(null, config.uploadFilePath);
        },
        filename: (req, file, callback) => {
          const exe = file.originalname.split(".");

          imageName = exe[0] + "-" + Date.now() + "." + exe[exe.length - 1];
          callback(null, imageName);
        },
      });
      const upload = multer({
        storage: storage,
        limits: {
          fileSize: 5000000, // 5000000 Bytes = 5 MB
        },
        fileFilter(req, file, cb) {
          if (!file.originalname.match(/\.(png|jpg)$/)) {
            // upload only png and jpg format
            return cb(new Error("Please upload a Image"));
          }
          cb(undefined, true);
        },
      }).single(params.fieldName);
      upload(req, res, (err, result) => {
        console.log(">>>>>>>> ", req.file);
        if (err) {
          reject(err);
        } else {
          console.log(imageName);
          resolve(imageName);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};