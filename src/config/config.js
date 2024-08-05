import environment from "../../environment";
const envConfig = environment[process.env.NODE_ENV];
import moment from "moment";

module.exports = {
  apiUrl : envConfig.apiUrl,
  mongoUri: envConfig.mongoUri,
  applicationUrl: envConfig.applicationUrl,
  JWTSecret: "Emate-Toolkit",
  JWTExpireTime: "1 days",
  resetPasswordTokenExpireTime: () => moment().add(5, "days"),
  emailVerifyTokenExpireTime: () => moment().add(5, "days"),
  SMTP_HOST: envConfig.SMTP_HOST,
  SMTP_PORT: envConfig.SMTP_PORT,
  SMTP_USER: envConfig.SMTP_USER,
  SMTP_PASS: envConfig.SMTP_PASS,

  uploadFilePath: envConfig.uploadFilePath,
  uploadHelpFilePath: envConfig.uploadHelpFilePath,
  uploadFileUrl: envConfig.uploadFileUrl,
  uploadHelpFileUrl: envConfig.uploadHelpFileUrl,
  excelFileUploadPath: envConfig.excelFileUploadPath,
  reportFolderPath: envConfig.reportFolderPath,
  reportFileUrl: envConfig.reportFileUrl,
  uploadSampleFilePath : envConfig.uploadSampleFilePath,
  sampleFileUrl : envConfig.sampleFileUrl,
  networkComputationStaticHTMLFile: envConfig.networkComputationStaticHTMLFile,
  networkComputationHighChartHTMLFile: envConfig.networkComputationHighChartHTMLFile,
  portRatorStaticHTMLFile: envConfig.portRatorStaticHTMLFile,
  forecastHTMLFile: envConfig.forecastHTMLFile
};
