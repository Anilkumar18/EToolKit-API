"use strict";

import mongoose from 'mongoose';
import xlsx from "xlsx";
import {
    serverLog
} from '../../../utils/logger';
import * as excelDataQuery from '../../../db/queries/excelData.query';
import * as sampleFileQueries from '../../../db/queries/sampleFile.query';
import CommonUtility from '../../../utils/CommonUtility';
import * as staticFileDataQuery from '../../../db/queries/staticFileData.query';
import * as userQueries from '../../../db/queries/user.query';
import * as standardHeader from '../../../db/queries/standardHeader.query';
import ExcelDataModel from '../../../db/models/excelData.model';
import * as _ from 'lodash'
import fs from 'fs';
import {
    ObjectId
} from 'mongoose';
import DataTypeModel from '../../../db/models/datatype.model';

export default class excelDataController {

    /**
     * This api will get uploaded file list
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof excelDataController
     */
    static async getUploadedFilesList(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_message : "In get uploaded file list api"}`);

            const filesList = await excelDataQuery.find({ isDeleted: false }, "fileName updatedAt createdBy hasSampleFile", null, {
                fileName: 1
            });

            const sortedFileListArray = filesList.sort((a, b) => {
                return a.fileName.toLowerCase().localeCompare(b.fileName.toLowerCase());
            });

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(sortedFileListArray)}}`);
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.filesGet, sortedFileListArray, []));

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    /**
     * This api will return all the system file names
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof excelDataController
     */
    static async getSystemFileNames(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_message : "In get system file list api"}`);

            const fileList = await staticFileDataQuery.find({
                isSystemFile: true
            }, {
                fileName: 1
            });

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(fileList)}}`);
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.filesGet, fileList, []));
        } catch(err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }


    /**
     * This api will delete uploaded file
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof excelDataController
     */
    static async deleteUploadedExcelFile(req, res) {
        try {

            const fileId = req.params.id;
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);

            const fileRes = await excelDataQuery.findOne({
                _id: fileId,
                isDeleted: false
            });

            if (fileRes) {

                const updatePattern = {
                    updatedBy: req.headers.id,
                    isDeleted: true
                };

                await excelDataQuery.findOneAndUpdate({
                    _id: fileId
                }, updatePattern);

                const checkForStaticFile = await staticFileDataQuery.findOne({
                    fileName: fileRes.fileName,
                    isActive: true,
                    isDeleted: false
                });
                if (checkForStaticFile.isSystemFile) await staticFileDataQuery.findByIdAndUpdate(checkForStaticFile._id, {
                    headersTypes: []
                }, {
                    new: true
                });
                else await staticFileDataQuery.findByIdAndUpdate(checkForStaticFile._id, {
                    headersTypes: [],
                    isDeleted: true,
                    isActive: false
                }, {
                    new: true
                });

                await excelDataController.removeSampleFile(fileRes.fileName);
                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response_message : ${custom_message.InfoMessage.fileDeleted}}`)
                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.fileDeleted, [], []));

            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}] [loggedInUser : ${req.headers.id}], {error_message : ${custom_message.errorMessage.invalidUpdateRequest}}`);
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.invalidUpdateRequest, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    /**
     * This method will remove sample file
     *
     * @static
     * @param {*} fileName
     * @returns
     * @memberof excelDataController.deleteUploadedExcelFile
     */
    static async removeSampleFile(fileName) {
        const fileData = await sampleFileQueries.findOneAndUpdate({ originalFileName : fileName }, { isActive : false, isDeleted : true }, { new : true });
        fs.unlink(`${config.uploadSampleFilePath}/${fileData.sampleFileName}`, (err, data) => {
            return;
        });
        return;
    }

    /**
     * This api will return specific file details
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof excelDataController
     */
    static async getExcelFileById(req, res) {

        try {

            const fileId = req.params.id;
            const fileRes = await excelDataQuery.findOne({
                _id: fileId,
                isDeleted: false
            });
            if (fileRes) {
                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.dataGet, fileRes, []));
            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}] [loggedInUser : ${req.headers.id}], {error_message : ${custom_message.errorMessage.invalidUpdateRequest}}`);
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.invalidUpdateRequest, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    /**
     * This api will return json data of uploaded file with pagination
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof excelDataController
     */
    static async getFileData(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${req.query ? JSON.stringify(req.query) : "NO REQUEST DATA"}}`);

            var id = req.query.id || "";
            var pageNo = parseInt(req.query.pageNo) || "";
            var limit = 20;

            let findPattern = {
                _id: mongoose.Types.ObjectId(id),
                isDeleted: false
            };
            let filter;
            let excelDataRes;
            let selectPattern = "fileName fileHeaders uniqueKeyColumns fileData compositeKeyOptions isCompositive isCompositeUnique compositeKeyName displayNameHeaders";
                
            if (req.query.filter) {

                filter = JSON.parse(req.query.filter);
                filter = filter.filter(item => item.headerName !== '');
                if (filter.length>0) {
                    let endFilter = []
                    for (const key of filter) {
                        if (key.value) {
                            endFilter.push({
                                $regexMatch: {
                                    input: { $toString:`$$fileData.${key.headerName}`},
                                    regex: new RegExp(key.value, "i"), // Case-insensitive comparison
                                },
                            })  
                        }else{
                            endFilter.push({
                                "$eq":[`$$fileData.${key.headerName}`,`${key.value}`]
                            })
                        }
                        
                    }
                    filter = {
                        $filter: {
                            input: "$fileData",
                            as: "fileData",
                            cond: {
                                $and: endFilter
                            }
                        }
                    }
                    excelDataRes = await excelDataQuery.findFilter(findPattern, filter); 
                }else{
                    excelDataRes = await excelDataQuery.findOne(findPattern, selectPattern);
                } 
            } else{
                excelDataRes = await excelDataQuery.findOne(findPattern, selectPattern);
            }            
            if (excelDataRes) {
                if (pageNo && pageNo > 0) {

                    excelDataRes = JSON.parse(JSON.stringify(excelDataRes));

                    let start = limit * (pageNo - 1);
                    let end = limit * pageNo;
                    let totalPages = Math.ceil(excelDataRes.fileData.length / limit);

                    excelDataRes.fileData = excelDataRes.fileData.slice(start, end);
                    excelDataRes.totalPages = totalPages
                }

                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(excelDataRes)}}`);
                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.filesGet, excelDataRes, []));

            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}] [loggedInUser : ${req.headers.id}], {error_message : ${custom_message.errorMessage.dataNotFound}}`);
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.dataNotFound, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    /**
     * This api will return properties for the particular file
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof excelDataController
     */
    static async getFileColumns(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${req.query ? JSON.stringify(req.query) : "NO REQUEST DATA"}}`);

            var fileName = req.query.fileName || "";

            let findPattern = {
                fileName: fileName,
                isDeleted: false
            };
            let selectPattern = "fileName fileHeaders uniqueKeyColumns fileData";
            let excelDataRes = await excelDataQuery.findOne(findPattern, selectPattern);

            if (excelDataRes) {

                let result = excelDataRes.fileHeaders.map((item, index) => {
                    return {
                        colName: item,
                        isIdentityCol: excelDataRes.uniqueKeyColumns.includes(item),
                        index: index
                    }
                });

                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(result)}}`);
                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.dataGet, result, []));

            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}] [loggedInUser : ${req.headers.id}], {error_message : ${custom_message.errorMessage.dataNotFound}}`);
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.dataNotFound, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    /**
     * This api will return specific data of the row
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof excelDataController
     */
    static async getFileRowsData(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${req.query ? JSON.stringify(req.query) : "NO REQUEST DATA"}}`);

            var fileName = req.query.fileName || "";
            var identityCol = req.query.identityCol || "";
            var identityColValue = req.query.identityColValue || "";

            let findPattern = {
                fileName: fileName,
                isDeleted: false
            };
            let selectPattern = "fileName fileHeaders uniqueKeyColumns fileData";
            let excelDataRes = await excelDataQuery.findOne(findPattern, selectPattern);

            if (excelDataRes) {

                let result = excelDataRes.fileData.filter(obj => {
                    return obj[identityCol] == identityColValue
                });

                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(result)}}`);
                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.dataGet, result, []));

            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}] [loggedInUser : ${req.headers.id}], {error_message : ${custom_message.errorMessage.dataNotFound}}`);
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.dataNotFound, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    /**
     * This api will return specific data of the column
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof excelDataController
     */
    static async getFileColumnsData(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : NO PAYLOAD}`);

            const fileName = req.query.fileName || "";
            const identityCol = req.query.identityCol || "";

            const findPattern = {
                fileName: fileName
            };
            const selectPattern = "fileName fileHeaders uniqueKeyColumns fileData";
            const [excelDataRes, systemFileData] = await Promise.all([
                excelDataQuery.findOne(findPattern, selectPattern),
                staticFileDataQuery.findOne({fileName, isActive : true, isDeleted : false}, { headersRows : 1 })
            ]);

            let identityColumn;
            if(systemFileData) {
                systemFileData.headersRows.forEach(col => {
                    if(col.toLowerCase().replace(/ /g, '').trim() === identityCol.toLowerCase().replace(/ /g, '').trim()) {
                        identityColumn = col;
                        return;
                    }
                })
            }

            if (excelDataRes) {
                const result = excelDataRes.fileData.map(obj => {
                    return obj[identityColumn ? identityColumn : identityCol];
                });

                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(result)}}`);
                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.dataGet, result, []));

            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}] [loggedInUser : ${req.headers.id}], {error_message : ${custom_message.errorMessage.dataNotFound}}`);
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.dataNotFound, [], []));
            }

        } catch (err) {
            console.log(err);
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    /**
     * This api will return static file name list
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof excelDataController
     */
    static async getStaticFileNameList(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : NO PAYLOAD}`);
            let findPattern = {
                isDeleted: false
            };
            let selectPattern = "uniqueHeaders fileName headersRows";
            const staticFileDataRes = await staticFileDataQuery.find(findPattern, selectPattern, null, {
                createdAt: -1
            });
            if (staticFileDataRes) {
                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(staticFileDataRes)}}`);
                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.dataGet, staticFileDataRes, []));
            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}] [loggedInUser : ${req.headers.id}], {error_message : ${custom_message.errorMessage.dataNotFound}}`);
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.dataNotFound, [], []));
            }
        } catch (err) {
            console.log("err => ", err);
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    //
    static async finalDataProcess(finalizeSheetDataList, headerRowValues) {
        const finalData = [];

        for (const data of finalizeSheetDataList) {
            for (const prop in data) {
                if (prop === "_id") {
                    data["_id"] = data['_id'];
                } else {
                    headerRowValues.forEach(header => {
                        if (prop.toLowerCase().replace(/ /g, '').trim() === header.toLowerCase().replace(/ /g, '').trim()) {
                            data[header] = data[prop];
                            if (prop !== header) {
                                delete data[prop];
                            }
                        }
                    })
                }
            }
            finalData.push(data);
        }
        return finalData;
    }

    // For upload new file process as create/save action
    static async uploadExcelFile(req, res, isNewFile = true) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);
            const user = await userQueries.findOne({
                _id: req.headers.id
            }, {
                isAdmin: 1
            })
            const payloadObj = req.body,
                excelFile = req.file;
            const fileNameFromRequestBody = payloadObj.fileName ? payloadObj.fileName : payloadObj.selectFileName;
            let validationFields = [];
            const checkAvailableFile = await excelDataQuery.findOne({
                fileName: fileNameFromRequestBody,
                isDeleted: false
            }, {
                _id: 1
            });

            let errorDetails = {};
            if (checkAvailableFile && isNewFile) {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}] [loggedInUser : ${req.headers.id}], {error_message : "Please any update operation of file"}`);
                errorDetails.message = "Already exists! Please select any update operation for file";
                errorDetails.errorFields = [];
                return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, errorDetails, [], []));
            }

            if (CommonUtility.isValidObject(payloadObj) && !CommonUtility.isUndefinedOrNull(excelFile)) {
                const uploadedFileContent = xlsx.readFile(excelFile.path);
                const uniqueKeyColumns = CommonUtility.isValidString(payloadObj.uniqueKeyColumns) ? payloadObj.uniqueKeyColumns.split(",").map((x) => x.toLowerCase().replace(/ /g, '').trim()) : [];
                // below is file validation process check for new/fresh file upload
                const {
                    finalizeSheetDataList,
                    isEqualHeaders,
                    headerRowValues,
                    staticFileDataRes,
                    displayHeaders
                } = await excelDataController.excelFileValidationProcess(uploadedFileContent, payloadObj);

                // if (payloadObj.headersTypes && JSON.parse(payloadObj.headersTypes).length) validationFields = await excelDataController.addFieldValidation(payloadObj.fileName ? payloadObj.fileName : payloadObj.selectFileName, JSON.parse(payloadObj.headersTypes), headerRowValues, uniqueKeyColumns, isNewFile, user);
                validationFields = await excelDataController.addFieldValidation(payloadObj.fileName ? payloadObj.fileName : payloadObj.selectFileName, payloadObj.headersTypes ? JSON.parse(payloadObj.headersTypes) : [], headerRowValues, uniqueKeyColumns, isNewFile, user);

                const fileNewHead = []
                headerRowValues.forEach(value => {
                    fileNewHead.push(value.toLowerCase().replace(/ /g, '').trim());
                });

                if (uniqueKeyColumns.length) {
                    const missedFieldsInArray = CommonUtility.getMissedUniqueKeys(fileNewHead, uniqueKeyColumns);
                    if (missedFieldsInArray.length) {
                        errorDetails.message = "Unique key missed in uploaded file";
                        errorDetails.errorFields = missedFieldsInArray;
                    }
                }

                if (CommonUtility.isValidObject(errorDetails)) {
                    serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}] [loggedInUser : ${req.headers.id}], {error_message : ${errorDetails}}`);
                    return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, errorDetails, [], []));
                }

                /* below finalizeSheetDataList.length is 0 that means
                    1. uploaded file is without sheet file
                    2. sheet/s avaialble, but is blank sheet upload only
                    3. sheet/s avaialble, but sheet have only headers, no row data found 
                */
                if (!isEqualHeaders || finalizeSheetDataList.length === 0) {
                    errorDetails.message = custom_message.errorMessage[finalizeSheetDataList.length === 0 ? "fileHasNoData" : "headersValuesNotMatched"];
                    errorDetails.errorFields = [];
                }
                if (CommonUtility.isValidObject(errorDetails)) {
                    serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}] [loggedInUser : ${req.headers.id}], {error_message : ${errorDetails}}`);
                    return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, errorDetails, [], []));
                }

                let formattedFileData = [],
                    uniqueKeyObj = {},
                    unqKeys;
                finalizeSheetDataList.forEach((sheetRowObj) => {
                    uniqueKeyObj = {
                        SheetName: sheetRowObj.SheetName
                    };
                    if (req.isEditMode || payloadObj.selectFileName !== 'other') {
                        uniqueKeyColumns.forEach((key) => {
                            const newSheetObj = {};
                            const keys = Object.keys(sheetRowObj);
                            let keyAssign, n = keys.length;
                            while (n--) {
                                keyAssign = keys[n];
                                newSheetObj[keyAssign.toLowerCase()] = sheetRowObj[keyAssign];
                            }
                            uniqueKeyObj[key.toLowerCase()] = newSheetObj[key.toLowerCase()]
                        })
                        formattedFileData.push(uniqueKeyObj);
                    } else {
                        unqKeys = payloadObj.uniqueKeyColumns ? payloadObj.uniqueKeyColumns.split(",").map((x) => x) : [];
                        unqKeys.forEach((key) => uniqueKeyObj[key.replace(/ /g, '').trim()] = sheetRowObj[key.replace(/ /g, '').trim()])
                        formattedFileData.push(uniqueKeyObj);
                    }
                })
                formattedFileData = CommonUtility.removeDuplicateFromArray(formattedFileData);
                if (finalizeSheetDataList.length > formattedFileData.length) {
                    const duplicatedRecords = CommonUtility.getDuplicatedByKeys1(finalizeSheetDataList, req.isEditMode || payloadObj.selectFileName !== 'other' ? uniqueKeyColumns.concat(['SheetName']) : unqKeys);
                    if (duplicatedRecords.length > 0 && uniqueKeyColumns.length > 0) {
                        let temp = {},
                            errorArr = [];
                        duplicatedRecords.forEach((x) => {
                            temp = {
                                SheetName: x.SheetName
                            };
                            uniqueKeyColumns.forEach((key) => temp[key] = x[key.toLowerCase()]);
                            errorArr.push(temp)
                        })
                        errorDetails = {
                            message: custom_message.errorMessage.duplicatedUniqueValuesError,
                            errorFields: errorArr
                        };
                    }
                }
                if (CommonUtility.isValidObject(errorDetails)) {
                    serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}] [loggedInUser : ${req.headers.id}], {error_message : ${errorDetails}}`);
                    return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, errorDetails, [], []));
                }

                // This will validate data type of mentioned headers
                let finalData = finalizeSheetDataList;
                const staticFileHeaders = staticFileDataRes ? staticFileDataRes.headersTypes : [];
                if ((staticFileHeaders && staticFileHeaders.length > 0) || validationFields.length > 0) {
                    finalData = await excelDataController.validateAndReplaceOriginalData(finalizeSheetDataList, validationFields ? validationFields : staticFileDataRes.headersTypes);
                }
                if (typeof finalData === 'string') {
                    errorDetails = {
                        message: finalData,
                        errorFields: []
                    };
                    serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}] [loggedInUser : ${req.headers.id}], {error_message : ${errorDetails}}`);
                    return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, errorDetails, [], []));
                }

                if (req.isEditMode) {
                    return {
                        isValidWithBasicDetails: true,
                        uploadedFileContent: uploadedFileContent,
                        uniqueKeyColumns: uniqueKeyColumns,
                        finalizeSheetDataList: finalData,
                        headerRowValues: headerRowValues,
                        displayNameHeaders: displayHeaders
                    }
                }
                let finalUniqueKeyColumns = CommonUtility.isValidString(payloadObj.uniqueKeyColumns) ? payloadObj.uniqueKeyColumns.split(",") : [];
                if (!_.isEmpty(payloadObj.isCompositeUnique)) {
                    payloadObj.isCompositeUnique = JSON.parse(payloadObj.isCompositeUnique)
                    if (payloadObj.isCompositeUnique) {
                        finalUniqueKeyColumns = !finalUniqueKeyColumns.includes(payloadObj.compositeKeyName) ? [...finalUniqueKeyColumns,payloadObj.compositeKeyName] : finalUniqueKeyColumns

                    }
                }
                const sampleFileId = await excelDataController.createSampleFile(finalData, payloadObj.fileName ? payloadObj.fileName : payloadObj.selectFileName);
                const excelData = {
                    fileName: payloadObj.fileName ? payloadObj.fileName : payloadObj.selectFileName,
                    fileHeaders: headerRowValues,
                    uniqueKeyColumns: finalUniqueKeyColumns,
                    fileData: finalData,
                    createdBy: req.headers.id,
                    updatedBy: req.headers.id,
                    isCompositeUnique: payloadObj.isCompositeUnique,
                    displayNameHeaders: displayHeaders,
                    compositeKeyName: payloadObj.compositeKeyName,
                    compositeKeyOptions: CommonUtility.isValidString(payloadObj.compositeKeyOptions) ? payloadObj.compositeKeyOptions.split(",") : [],
                    isCompositive: payloadObj.isCompositive,
                }
                if(sampleFileId) excelData['hasSampleFile'] = true;
                await excelDataQuery.create(excelData);

                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}] [loggedInUser : ${req.headers.id}], {response_message : ${custom_message.InfoMessage.fileUploaded}}`)
                return res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.fileUploaded, [], []));
            } else {
                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}] [loggedInUser : ${req.headers.id}], {response_message : ${custom_message.errorMessage.invalidRequestDetails}}`)
                return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.invalidRequestDetails, [], []));
            }
        } catch (err) {
            console.log("err => ", err);
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async createSampleFile(fileData, fileName) {
        const jsonData = fileData.slice(0, 2);
        const sampleFileName = `${fileName}.xlsx`;
        const fileUrl = `${config.sampleFileUrl}${sampleFileName}`;

        const finalJSONData = jsonData.map(data => {
            const { SheetName, _id, ...rest } = data;
            return rest;
        });
        const headers = Object.keys(finalJSONData[0]);

        const ws = xlsx.utils.json_to_sheet(finalJSONData,{header : headers});
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'sheet1');
        await xlsx.writeFile(wb, `${config.uploadSampleFilePath}/${sampleFileName}`);

        let sampleFile;
        const findSampleFile = await sampleFileQueries.findOne({originalFileName : fileName, isActive : true, isDeleted : false});
        if(findSampleFile) await sampleFileQueries.findByIdAndUpdate(findSampleFile._id, {sampleFileName, fileUrl});
        else sampleFile = await sampleFileQueries.saveData({
            originalFileName : fileName,
            sampleFileName,
            fileUrl
        });
        return findSampleFile ? findSampleFile._id : sampleFile._id;
    }

    static async addFieldValidation(fileName, headersTypes = [], headersRows = [], uniqueHeaders = [], isNewFile, user) {
        const checkForStaticData = await staticFileDataQuery.findOne({
            fileName,
            isActive: true,
            isDeleted: false
        });
        if (isNewFile) {
            // adding new file
            if (checkForStaticData && headersTypes.length > 0) {
                if (checkForStaticData.headersRows) headersTypes = await excelDataController.replaceHeaders(checkForStaticData.headersRows, headersTypes);
                await staticFileDataQuery.findByIdAndUpdate(checkForStaticData._id, {
                    headersTypes
                }, {
                    new: true
                });
            } else {
                if (!checkForStaticData) {
                    await staticFileDataQuery.create({
                        uniqueHeaders,
                        headersRows,
                        fileName,
                        headersTypes,
                        isSystemFile: false
                    });
                }
            }
        } else {
            //file is in update mode
            if (headersTypes.length > 0) {
                headersTypes = await excelDataController.replaceHeaders(checkForStaticData.headersRows, headersTypes);
                if (!checkForStaticData.headersTypes && user.isAdmin) {
                    await staticFileDataQuery.findByIdAndUpdate(checkForStaticData._id, {
                        headersTypes
                    }, {
                        new: true
                    });
                    // if(checkForStaticData.isModifiableFields) headersTypes = await excelDataController.findAndReplaceColumnValidation(headersTypes, checkForStaticData.headersTypes);
                }
            }

            if (checkForStaticData.headersTypes && user.isAdmin) {
                headersTypes = await excelDataController.findAndReplaceColumnValidation(headersTypes, checkForStaticData.headersTypes, checkForStaticData._id);
            }
        }
        return headersTypes;
    }

    static async findAndReplaceColumnValidation(headersTypes, oldHeaderTypes, staticFileValidationId) {
        const validationToReturn = [];
        oldHeaderTypes.forEach(columnData => {
            const findIndex = CommonUtility.search(columnData.columnName, headersTypes);
            if (!findIndex && findIndex !== 0) {
                // if(columnData.isSecureField) validationToReturn.push(columnData);
                validationToReturn.push(columnData);
            }
        });

        await headersTypes.forEach(columnValidation => {
            validationToReturn.push(columnValidation);
            const findOldValidationIndex = CommonUtility.search(columnValidation.columnName, oldHeaderTypes);

            if (columnValidation.isSecureField && (findOldValidationIndex === 0 || findOldValidationIndex)) {
                oldHeaderTypes[findOldValidationIndex] = columnValidation;
            }

            if (!findOldValidationIndex && findOldValidationIndex !== 0) {
                if (columnValidation.isSecureField) {
                    oldHeaderTypes.push(columnValidation);
                } else {
                    oldHeaderTypes.push(columnValidation);
                }
            }

            // if ((findOldValidationIndex === 0 || findOldValidationIndex) && !columnValidation.isSecureField) {
            //     validationToReturn.push(columnValidation);
            // }
        });
        await staticFileDataQuery.findByIdAndUpdate(staticFileValidationId, {
            headersTypes: oldHeaderTypes
        }, {
            new: true
        });
        return validationToReturn;
    }

    static async replaceHeaders(headers, headersTypes) {
        headers.forEach((key) => {
            headersTypes.map(field => {
                if (field.columnName.toLowerCase().replace(/ /, '').trim() === key.toLowerCase().replace(/ /, '').trim()) {
                    field['columnName'] = key;
                }
            })
        });
        return headersTypes;
    }

    static async validateAndReplaceOriginalData(finalizeSheetDataList, headersTypes) {
        const finalizeSheetData = finalizeSheetDataList;
        const error = [];
        await headersTypes.forEach(fieldValidations => {
            if (fieldValidations.columnType === "Date") {
                const returnDateFormat = 'M/D/YY';
                const columnName = fieldValidations.columnName;
                finalizeSheetData.map(data => {
                    if (isNaN(data[columnName]) && data[columnName].split('/').length !== 3) error.push("dateError");
                    const returnDate = CommonUtility.formatPortDate(data[columnName], returnDateFormat, fieldValidations.dateFormat);
                    if (returnDate === "InValidDateFormat") error.push("dateError");
                    data[columnName] = returnDate
                    return data;
                });
            }
            if (fieldValidations.columnType === "String") {
                const columnName = fieldValidations.columnName;
                finalizeSheetData.map(data => {
                    if (!isNaN(data[columnName])) error.push("stringError");
                    return data;
                });
            }
            if (fieldValidations.columnType === "Number") {
                const columnName = fieldValidations.columnName;
                finalizeSheetData.map(data => {
                    if (isNaN(data[columnName])) error.push("numberError");
                    return data;
                });
            }
        });
        if (error.indexOf('dateError') > -1) return "please provide valid date or date format";
        if (error.indexOf('stringError') > -1) return "please provide valid string format";
        if (error.indexOf('numberError') > -1) return "please provide valid number format";
        return finalizeSheetData;
    }

    //For create/Edit headers file validation process only
    static async excelFileValidationProcess(uploadedFileContent, payloadObj) {
        const excelSheets = uploadedFileContent.SheetNames;
        let headerRowValues = '',
            isEqualHeaders = true,
            displayHeaders = {},
            finalizeSheetDataList = [];
        try {
            let staticFileDataRes;
            // if condition block is for file validation process check for new/fresh file upload.
            if (excelSheets.length > 0) {
                staticFileDataRes = await staticFileDataQuery.findOne({
                    fileName: payloadObj.fileName ? payloadObj.fileName : payloadObj.selectFileName,
                    isDeleted: false
                });
                const standardHeadersArr = [];
                if (staticFileDataRes && staticFileDataRes.headersRows) {
                    staticFileDataRes.headersRows.forEach((key) => standardHeadersArr.push(key.toLowerCase().replace(/ /, '').trim()));
                }
                excelSheets.forEach(async (SheetName) => {
                    let sheetDataList = xlsx.utils.sheet_to_json(uploadedFileContent.Sheets[SheetName], {
                        defval: "",
                        blankrows: false
                    });
                    if (sheetDataList.length > 0) {
                        sheetDataList.map((rowObj) => {
                            rowObj.SheetName = excelDataController.sheetNameSetUp(payloadObj, rowObj, SheetName)
                            if (!_.isEmpty(payloadObj.compositeKeyOptions)) {
                                rowObj[payloadObj.compositeKeyName || 'CompositeKey'] = excelDataController.excelConcatenateValuesByKeys(rowObj,payloadObj.compositeKeyOptions.split(','))
                            }
                            return rowObj
                        });
                        sheetDataList = CommonUtility.removeEmptyCharFromArray(sheetDataList);
                        const fileHeaders = Object.keys(sheetDataList[0]);
                        if (CommonUtility.isEmptyString(headerRowValues)) {
                            headerRowValues = JSON.parse(JSON.stringify(fileHeaders));
                        }
                        const newFileHeaders = fileHeaders;
                        const fileNewHead = [];
                        fileHeaders.forEach((value) => fileNewHead.push(value.toLowerCase().replace(/ /, '').trim()));
                        const isEqual = CommonUtility.isEqualArray(standardHeadersArr.length ? fileNewHead : newFileHeaders, standardHeadersArr.length ? standardHeadersArr : headerRowValues);

                        if (!isEqual && isEqualHeaders) {
                            isEqualHeaders = false;
                        }
                        sheetDataList = CommonUtility.removeDuplicateFromArray(sheetDataList)
                        if (payloadObj.isHavingDisplayName) {
                            let { extraDisplayHeaders, newSheetDataList } = excelDataController.setDisplayHeaders(sheetDataList);
                            sheetDataList = newSheetDataList;
                            displayHeaders = extraDisplayHeaders;
                        }
                        sheetDataList.map((rowObj) => rowObj._id = mongoose.Types.ObjectId());
                        finalizeSheetDataList = [...finalizeSheetDataList, ...sheetDataList];
                    }
                });
            }

            finalizeSheetDataList = await this.finalDataProcess(finalizeSheetDataList, staticFileDataRes ? staticFileDataRes.headersRows : headerRowValues);

            return {
                finalizeSheetDataList,
                isEqualHeaders,
                headerRowValues,
                staticFileDataRes,
                displayHeaders
            }
        } catch (ex) {
            console.log(ex)
        }
    }

    // For Edit file data process as edit mode action
    static async editUploadedExcelFile(req, res) {
        try {
            req.isEditMode = true;

            const {
                isValidWithBasicDetails,
                uploadedFileContent,
                uniqueKeyColumns,
                finalizeSheetDataList,
                headerRowValues,
                displayNameHeaders
            } = await excelDataController.uploadExcelFile(req, res, false);

            if (!isValidWithBasicDetails) {
                return;
            }
            const payloadObj = req.body;
            const fileId = req.params.id;
            const existingExcelFileData = await excelDataQuery.findOne({
                '_id': fileId
            });

            let errorDetails = {};
            const missedFieldsInArray = CommonUtility.getMissedFieldsFromArrays(existingExcelFileData.uniqueKeyColumns.map((x) => x.toLowerCase().replace(/ /g, '').trim()), uniqueKeyColumns.concat(['SheetName']));

            if (missedFieldsInArray.length > 0 && existingExcelFileData.uniqueKeyColumns) {
                if (missedFieldsInArray.includes(payloadObj.compositeKeyName.toLowerCase())) {
                    //Ignore this section as used to custom composite key
                }else{
                    errorDetails.message = 'Unique key is missing from existing keys';
                    errorDetails.errorFields = missedFieldsInArray;
                }
            }
            if (CommonUtility.isValidObject(errorDetails)) {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}] [loggedInUser : ${req.headers.id}], {error_message : ${errorDetails}}`);
                return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, errorDetails, [], []));
            }

            let updateObj = {};
            // 1 for replace entire details
            if (Number(payloadObj.uploadBehavior) == 1) {
                let finalUniqueKeyColumns = payloadObj.uniqueKeyColumns.split(",")
                payloadObj.isCompositeUnique = JSON.parse(payloadObj.isCompositeUnique)
                if (payloadObj.isCompositeUnique) {
                    if (!_.isEmpty(payloadObj.compositeKeyName)) {
                        finalUniqueKeyColumns = !finalUniqueKeyColumns.includes(payloadObj.compositeKeyName) ? [...finalUniqueKeyColumns,payloadObj.compositeKeyName] : finalUniqueKeyColumns
                    }
                }else{
                    if (_.isArray(updateObj.uniqueKeyColumns)) {
                        if (updateObj.uniqueKeyColumns.includes(payloadObj.compositeKeyName)) {
                            finalUniqueKeyColumns = updateObj.uniqueKeyColumns.filter(key => key !== payloadObj.compositeKeyName)
                        }
                    }
                }
                updateObj = {
                    ...(CommonUtility.isValidString(payloadObj.fileName ? payloadObj.fileName : payloadObj.selectFileName) && {
                        fileName: payloadObj.fileName ? payloadObj.fileName : payloadObj.selectFileName
                    }),
                    fileHeaders: headerRowValues,
                    fileData: finalizeSheetDataList,
                    uniqueKeyColumns: finalUniqueKeyColumns,
                    updatedBy: req.headers.id,
                    isCompositeUnique: payloadObj.isCompositeUnique,
                    compositeKeyName: payloadObj.compositeKeyName,
                    compositeKeyOptions: CommonUtility.isValidString(payloadObj.compositeKeyOptions) ? payloadObj.compositeKeyOptions.split(",") : [],
                    isCompositive: payloadObj.isCompositive,
                };
                if (payloadObj.isHavingDisplayName) {
                    updateObj.displayNameHeaders = displayNameHeaders
                }

                //will update/create sample file
                const sampleFileId = await excelDataController.createSampleFile(updateObj.fileData, payloadObj.fileName ? payloadObj.fileName : payloadObj.selectFileName);
                if(sampleFileId) updateObj['hasSampleFile'] = true;

                await excelDataQuery.findOneAndUpdate({
                    _id: fileId
                }, updateObj);
 
                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response_message : ${custom_message.InfoMessage.fileUploaded}}`)
                return res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.fileUpdated, [], []));
            }
            // 2 for appending data additional data
            else if (Number(payloadObj.uploadBehavior) == 2) {
                const combinedDataSheetArray = existingExcelFileData.fileData.concat(finalizeSheetDataList);
                const lowerCaseCombinedDataSheetArray = [];
                for (const obj of combinedDataSheetArray) {
                    const newSheetObj = {};
                    const keys = Object.keys(obj);
                    let keyAssign, n = keys.length;
                    while (n--) {
                        keyAssign = keys[n];
                        newSheetObj[keyAssign.toLowerCase()] = obj[keyAssign];
                    }
                    lowerCaseCombinedDataSheetArray.push(newSheetObj)
                }
 
                // const duplicatedByKeys = CommonUtility.getDuplicatedByKeys1(lowerCaseCombinedDataSheetArray, uniqueKeyColumns);
                // if (duplicatedByKeys.length > 0) {
                //     errorDetails.message = custom_message.errorMessage.existingDuplicatedValuesError;
                //     errorDetails.errorFields = duplicatedByKeys;
                // }

                // if (CommonUtility.isValidObject(errorDetails)) {
                //     serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}] [loggedInUser : ${req.headers.id}], {error_message : ${errorDetails}}`);
                //     return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, errorDetails, [], []));
                // }
 
                const removdDuplicatedList = CommonUtility.appendDataArray(existingExcelFileData.fileData.concat(finalizeSheetDataList), payloadObj.uniqueKeyColumns ? payloadObj.uniqueKeyColumns.split(",") : []);
                
                if (removdDuplicatedList.length>0) {
                    updateObj = {
                        ...(CommonUtility.isValidString(payloadObj.fileName ? payloadObj.fileName : payloadObj.selectFileName) && {
                            fileName: payloadObj.fileName ? payloadObj.fileName : payloadObj.selectFileName
                        }),
                        ...(CommonUtility.isValidString(payloadObj.uniqueKeyColumns) && {
                            uniqueKeyColumns: payloadObj.uniqueKeyColumns.split(",")
                        }),
                        fileHeaders: headerRowValues,
                        fileData: removdDuplicatedList,
                        updatedBy: req.headers.id,
                        isCompositeUnique: payloadObj.isCompositeUnique,
                        compositeKeyName: payloadObj.compositeKeyName,
                        compositeKeyOptions: CommonUtility.isValidString(payloadObj.compositeKeyOptions) ? payloadObj.compositeKeyOptions.split(",") : [],
                        isCompositive: payloadObj.isCompositive,
                    }
                    if (payloadObj.isHavingDisplayName) {
                        updateObj.displayNameHeaders= displayNameHeaders
                    }
                    updateObj.uniqueKeyColumns = excelDataController.uniqueKeyColumnsValue(payloadObj, updateObj)
                    
                }
                // else if (Number(payloadObj.removeExistingMatchRecords) == 1) {
                //     updateObj = {
                //         ...(CommonUtility.isValidString(payloadObj.fileName) && { fileName: payloadObj.fileName }),
                //         ...(CommonUtility.isValidString(payloadObj.uniqueKeyColumns) && { uniqueKeyColumns: payloadObj.uniqueKeyColumns.split(",") }),
                //         fileHeaders: headerRowValues,
                //         fileData: removdDuplicatedList,
                //         updatedBy: req.headers.id
                //     }
                // } 
                else {
                    errorDetails.message = custom_message.errorMessage.existingDuplicatedValuesError;
                    errorDetails.errorFields = CommonUtility.getDuplicatedInArray(existingExcelFileData.fileData.concat(finalizeSheetDataList));
                    serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}] [loggedInUser : ${req.headers.id}], {error_message : ${errorDetails}}`);
                    return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, errorDetails, [], []));
                }

                //will update/create sample file
                const sampleFileId = await excelDataController.createSampleFile(updateObj.fileData, payloadObj.fileName ? payloadObj.fileName : payloadObj.selectFileName);
                if(sampleFileId) updateObj['hasSampleFile'] = true;

                await excelDataQuery.findOneAndUpdate({
                    _id: fileId
                }, updateObj);
                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response_message : ${custom_message.InfoMessage.dataUpdated}}`)
                return res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.dataUpdated, [], []));
            }
            // 3 for modify data with existing data
            else if (Number(payloadObj.uploadBehavior) == 3) {
                if (existingExcelFileData.uniqueKeyColumns.length > 0) {
                    let uniqColumnObj = {};
                    existingExcelFileData.fileData.forEach((rowObj, fileIdx) => {
                        uniqColumnObj = {
                            'SheetName': rowObj.SheetName
                        };
                        existingExcelFileData.uniqueKeyColumns.forEach(column => {
                            uniqColumnObj[column.replace(/ /g, '').trim()] = rowObj[column.replace(/ /g, '').trim()];
                        });
                        let idx = finalizeSheetDataList.findIndex((rowData) => (CommonUtility.isSubsetOfObject(rowData, uniqColumnObj)));
                        if (idx > -1) {
                            existingExcelFileData.fileData[fileIdx] = finalizeSheetDataList[idx];
                            finalizeSheetDataList.splice(idx, 1);
                        }
                    });
                }
                updateObj = {
                    ...(CommonUtility.isValidString(payloadObj.fileName ? payloadObj.fileName : payloadObj.selectFileName) && {
                        fileName: payloadObj.fileName ? payloadObj.fileName : payloadObj.selectFileName
                    }),
                    ...(CommonUtility.isValidString(payloadObj.uniqueKeyColumns) && {
                        uniqueKeyColumns: payloadObj.uniqueKeyColumns.split(",")
                    }),
                    fileHeaders: headerRowValues,
                    fileData: existingExcelFileData.fileData.concat(finalizeSheetDataList),
                    updatedBy: req.headers.id,
                    isCompositeUnique: payloadObj.isCompositeUnique,
                    compositeKeyName: payloadObj.compositeKeyName,
                    compositeKeyOptions: CommonUtility.isValidString(payloadObj.compositeKeyOptions) ? payloadObj.compositeKeyOptions.split(",") : [],
                    isCompositive: payloadObj.isCompositive,
                }
                if (payloadObj.isHavingDisplayName) {
                    updateObj.displayNameHeaders= displayNameHeaders
                }
                updateObj.uniqueKeyColumns = excelDataController.uniqueKeyColumnsValue(payloadObj, updateObj)

                //will update/create sample file
                const sampleFileId = await excelDataController.createSampleFile(updateObj.fileData, payloadObj.fileName ? payloadObj.fileName : payloadObj.selectFileName);
                if(sampleFileId) updateObj['hasSampleFile'] = true;

                await excelDataQuery.findOneAndUpdate({
                    _id: fileId
                }, updateObj);
                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response_message : ${custom_message.InfoMessage.dataUpdated}}`)
                return res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.dataUpdated, [], []));
            }
        } catch (err) {
            console.log(err)
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    // static data type listing api
    static async getDataTypeList(req, res) {
        try {
            const dataTypes = await DataTypeModel.find({
                isActive: true,
                isDeleted: false
            })
            return res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getTypeList, dataTypes, []));
        } catch (err) {
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async dateFormat(req, res) {
        try {
            const formats = ["MM/DD/YYYY", "M/D/YYYY", "M/D/YY", "DD/MM/YYYY", "D/M/YYYY", "D/M/YY", "DD/M/YYYY", "DD/M/YY", "D/MM/YYYY", "D/MM/YY", "M/DD/YYYY", "M/DD/YY", "MM/D/YYYY", "MM/D/YY", "YYYY/MM/DD", "YY/MM/DD", "YYYY/M/D", "YY/M/D", "YYYY/DD/MM", "YY/D/M"];
            // ["MM/DD/YYYY", "M/D/YYYY", "M/D/YY", "DD/MM/YYYY", "D/M/YYYY", "D/M/YY" ,"YYYY/MM/DD", "YY/MM/DD", "YYYY/M/D", "YY/M/D"]
            return res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getFormatList, formats, []));
        } catch (err) {
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    // this is migration api that store file headers to the static file collection
    static async migrateStaticFileData(req, res) {
        try {
            const fileList = ['Port Data', 'Port Regions', 'Port Comparison Types', 'LTL Rates', 'Mileage', 'Parcel Rates', 'Products', 'Service Level Types', 'Sites', 'States', 'Trailer Sizes', 'Weight Units', 'Zones'];
            const fileData = await excelDataQuery.find({
                fileName: {
                    $in: fileList
                },
                isActive: true,
                isDeleted: false
            }, {
                fileName: 1,
                fileHeaders: 1,
                uniqueKeyColumns: 1
            })
            for (const file of fileData) {
                const staticFile = await staticFileDataQuery.findOne({
                    fileName: file.fileName,
                    isDeleted: false,
                    isActive: true
                });
                if (!staticFile) {
                    const indexOfId = file.fileHeaders.indexOf('_id');
                    const indexOfSheetName = file.fileHeaders.indexOf('SheetName');
                    if (indexOfId > -1) {
                        file.fileHeaders.splice(indexOfId, 1);
                    }
                    if (indexOfSheetName < 0) {
                        file.fileHeaders.push('SheetName')
                    }

                    const record = {
                        uniqueHeaders: file.uniqueKeyColumns ? file.uniqueKeyColumns : [],
                        headersRows: file.fileHeaders ? file.fileHeaders : [],
                        fileName: file.fileName,
                        excelFileId: file._id
                    }
                    await staticFileDataQuery.create(record);
                }
            }

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.dataUpdated, [], []));
        } catch (err) {
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static sheetNameSetUp(payloadObj, rowObj, SheetName){
        let fileName = payloadObj.selectFileName || payloadObj.fileName;
        switch (fileName) {
            case 'Port Data':
                return rowObj.LoCode
            default:
                return SheetName;
        }
    }

    static excelConcatenateValuesByKeys(rowObject, targetKeys) {
        return targetKeys.map((key) => rowObject[key]).filter(Boolean).join('');
    } 

    static uniqueKeyColumnsValue(payloadObj, updateObj){
        if (payloadObj.isCompositeUnique) {
            payloadObj.isCompositeUnique = JSON.parse(payloadObj.isCompositeUnique)
            if (payloadObj.isCompositeUnique) {
                updateObj.uniqueKeyColumns = !_.isEmpty(updateObj.uniqueKeyColumns) ? 
                !updateObj.uniqueKeyColumns.includes(payloadObj.compositeKeyName) ? [...updateObj.uniqueKeyColumns,payloadObj.compositeKeyName] : updateObj.uniqueKeyColumns
                :[payloadObj.compositeKeyName]
            }else{
                if (_.isArray(updateObj.uniqueKeyColumns) && updateObj.uniqueKeyColumns.includes(payloadObj.compositeKeyName)) {
                    updateObj.uniqueKeyColumns = updateObj.uniqueKeyColumns.filter(key => key !== payloadObj.compositeKeyName)
                }
            }
        }
        if(!updateObj.uniqueKeyColumns){
            updateObj.uniqueKeyColumns=[]
        }
        return updateObj.uniqueKeyColumns
    }

    static setDisplayHeaders(sheetDataList){
        const extraDisplayHeaders = sheetDataList[0];
        const newSheetDataList = sheetDataList.slice(1);
        if (extraDisplayHeaders.SheetName) {
            extraDisplayHeaders.SheetName= ""
        }
        return {
            extraDisplayHeaders,
            newSheetDataList
        };
    }
}
