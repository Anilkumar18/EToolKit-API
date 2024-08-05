import * as helpSectionQuery from "../../../db/queries/helpModule.query";
import { serverLog } from '../../../utils/logger';
import mongoose from "mongoose";
import * as _ from 'lodash'
export default class helpModuleController {


    static async getPageInfo(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_message : "In get uploaded file list api"}`);
            let findPattern
            if(!_.isEmpty(req.query)){
                let toolBoxCheck = JSON.parse(req.query.isToolBox)
                if (toolBoxCheck) {
                    findPattern = {
                        questionId: mongoose.Types.ObjectId(req.params.code)
                    }
                }else{
                    findPattern = {
                        pageName: req.params.code
                    };
                }
            }
            const selectPattern = "pageName label fileName fileUrl";
            const filesList = await helpSectionQuery.findOne(findPattern, selectPattern, null, {
                createdAt: -1
            });
            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(filesList)}}`);
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.helpGet, filesList, []));

        } catch (err) {
            console.log(err)
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async getInfo(req, res) {
        try {
            const HelpSectionList = await helpSectionQuery.findAll({
                questionId: null
            });
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getHelpList, HelpSectionList, []));
        } catch (err) {
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }


    static async updateData(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request to update {organizationId : ${req.params.id}} request_payload : ${JSON.stringify(req.body)}}`)
            const {
                label
            } = req.body;
            const id = req.params.id
            let query
            if (req.file) {
                let { originalname, filename } = req.file;
                let fileUrl = config.uploadHelpFileUrl + filename;
                query= {
                    label,
                    fileName: originalname,
                    fileUrl
                }
            }else{
                query = {
                    label
                }
            }
            
            let helpModuleFile = await helpSectionQuery.findOne({ _id : id });
            if (!helpModuleFile) {
                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.errorMessage.invalidPageDetails, [], []));
            } else {
                await helpSectionQuery.findByIdAndUpdate(helpModuleFile._id, query, { new: true })
            }
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.pageInfoUpdated, [], []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}