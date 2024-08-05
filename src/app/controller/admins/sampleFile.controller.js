import SampleFileModel from "../../../db/models/sampleFile.model";
import * as sampleFileQueries from "../../../db/queries/sampleFile.query";
import * as excelDataQueries from "../../../db/queries/excelData.query";

export default class SampleFileController {

    static async uploadFile(req, res) {
        try {
            const {
                originalFileName
            } = req.body;
            let fileName = req.file.filename;
            let fileUrl = config.sampleFileUrl + fileName;

            let findSampleFile = await sampleFileQueries.findOne({ originalFileName, isActive : true });
            if(!findSampleFile) {
                const sampleFileModelData = new SampleFileModel({
                    originalFileName,
                    sampleFileName : fileName,
                    fileUrl
                });
                await sampleFileQueries.saveData(sampleFileModelData);
                await excelDataQueries.findOneAndUpdate({ fileName : originalFileName, isActive : true }, { hasSampleFile : true });
            } else {
                await sampleFileQueries.findByIdAndUpdate(findSampleFile._id, { sampleFileName : fileName, fileUrl }, { new : true })
            }
            res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.fileUploaded, [], []));

        } catch (err) {
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async getUrl(req, res) {
        try {
            const {
                originalFileName
            } = req.query;

            const sampleFile = await sampleFileQueries.findOne({ originalFileName, isActive : true });

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getUrl, {url : sampleFile ? sampleFile.fileUrl : "" }, []));

        } catch (err) {

            console.log(err)
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}