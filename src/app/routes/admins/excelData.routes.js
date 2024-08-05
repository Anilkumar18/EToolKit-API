import {
    Router
} from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import {
    upload
} from "../../../utils/fileUpload";
import excelDataController from "../../controller/admins/excelData.controller";

router.post("/", jwtMiddleware.jwtValidation, upload.single("excelFile"), excelDataController.uploadExcelFile);
router.get("/", jwtMiddleware.jwtValidation, excelDataController.getUploadedFilesList);
router.put("/:id", jwtMiddleware.jwtValidation, upload.single("excelFile"), excelDataController.editUploadedExcelFile);
router.delete("/:id", jwtMiddleware.jwtValidation, excelDataController.deleteUploadedExcelFile);
router.get("/fileData", jwtMiddleware.jwtValidation, excelDataController.getFileData);
router.get("/systemFiles", jwtMiddleware.jwtValidation, excelDataController.getSystemFileNames)
router.get("/fileColumns", jwtMiddleware.jwtValidation, excelDataController.getFileColumns);
router.get("/fileRowsData", jwtMiddleware.jwtValidation, excelDataController.getFileRowsData);
router.get("/fileColumnsData", jwtMiddleware.jwtValidation, excelDataController.getFileColumnsData);
router.get("/getStaticFileList", jwtMiddleware.jwtValidation, excelDataController.getStaticFileNameList);
router.get("/dateFormats", jwtMiddleware.jwtValidation, excelDataController.dateFormat);
router.get("/dataType", jwtMiddleware.jwtValidation, excelDataController.getDataTypeList);
router.get("/:id", jwtMiddleware.jwtValidation, excelDataController.getExcelFileById);
router.post("/migrationAPI", excelDataController.migrateStaticFileData);
module.exports = router;