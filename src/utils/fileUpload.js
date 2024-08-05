const multer = require("multer");
const reader = require("xlsx");

let imageName = "";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let reqUrlArr = req.originalUrl.split("/");
    if(reqUrlArr[reqUrlArr.length - 1] == "sampleFile") {
      cb(null, config.uploadSampleFilePath);
    } else {
      if (file.fieldname=="helpFile") {
        cb(null, config.uploadHelpFilePath);
      } else {
        cb(null, config.uploadFilePath);
      }
    }
  },
  filename: function (req, file, cb) {
    const exe = file.originalname.split(".");

    imageName = exe[0] + "-" + Date.now() + "." + exe[exe.length - 1];
    cb(null, imageName);
  },
});

exports.upload = multer({
  storage: storage,
  limits: { fileSize: 5000000000 },
});
