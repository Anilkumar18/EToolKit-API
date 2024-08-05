import jimp from "jimp";
import path from "path";
import { serverLog } from '../utils/logger';

module.exports.imageOptimise = (url, file) => {
  const jimpData = jimp
    .read(url)
    .then((image) => {
      const fileName = file.fieldname + "-" + Date.now() + path.extname(file.originalname);
      image.resize(250, jimp.AUTO).quality(100).write(config.uploadFilePath + fileName);
      serverLog.info(`{message : "user's thumbnail created for file ${fileName}"}`)
      return fileName;
    })
    .catch((err) => {
      throw err;
    });
  return jimpData;
};
