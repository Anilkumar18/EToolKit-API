"use strict";

import mongoose from "mongoose";
import moment from 'moment';
import {
    _
} from 'lodash';
import xlsx from 'sheetjs-style';
import {
    serverLog
} from '../../../utils/logger';
import * as excelDataQuery from '../../../db/queries/excelData.query';
import * as userTransactionInputQuery from '../../../db/queries/userTransactionInput.query';
import * as loopTypeQuery from '../../../db/queries/loopType.query';
import * as staticFileDataQuery from '../../../db/queries/staticFileData.query';
import * as nodeQuery from "../../../db/queries/node.query";
import ejs from 'ejs';
import path from 'path';
import puppeteer from 'puppeteer';
import config from './../../../config/config';
import HighChartCountry from '../../../data/highChartCountry'

export default class treeLogicsController {

    //================================ Utility Functions to Get Excel Data =====================

    static async getExcelFileDataList(fileName = "", selectedFields = "") {

        let projectFields = {};
        if (selectedFields) {
            projectFields[`fileData._id`] = 1;
            let selectedFieldArray = selectedFields.split(" ");

            const staticFileData = await staticFileDataQuery.findOne({
                fileName,
                isActive: true,
                isDeleted: false
            }, {
                headersRows: 1
            });
            staticFileData.headersRows.forEach(col => {
                for (let element of selectedFieldArray) {
                    if (col.toLowerCase().replace(/ /g, '').trim() === element.toLowerCase().replace(/ /g, '').trim()) {
                        projectFields[`fileData.${col}`] = 1;
                    }
                }
            })

        }

        let excelRes = await excelDataQuery.findOne({
            fileName: fileName,
            isDeleted: false
        }, projectFields);
        return excelRes ? excelRes.fileData : [];
    }

    static async getLookupDataFromVariable(variableName, selectedFields, userTransactionId) {
        const data = await userTransactionInputQuery.findOne({
            variableName,
            userTransactionId
        });
        if (data.value) {
            const value = typeof JSON.parse(data.value) === "string" ? JSON.parse(JSON.parse(data.value)) : JSON.parse(data.value);
            const properties = selectedFields.split(" ");
            const finalData = value.map(obj => treeLogicsController.selectProperties(obj, properties));
            return finalData;
        }
        return [];
    }

    static selectProperties(obj, properties) {
        return properties.reduce((result, property) => {
            if (property in obj) result[property] = obj[property];
            return result;
        }, {});
    }

    static async getExcelFileDataListById(fileId = "", selectedFields = "") {

        let projectFields = {};
        if (selectedFields) {
            projectFields[`fileData._id`] = 1;
            let selectedFieldArray = selectedFields.split(" ");
            for (let element of selectedFieldArray) {
                projectFields[`fileData.${element}`] = 1;
            }
        }

        let excelRes = await excelDataQuery.findOne({
            _id: mongoose.Types.ObjectId(fileId)
        }, projectFields);
        return excelRes ? excelRes.fileData : [];
    }

    static async getExcelFileFieldValue(fileName = "", conditionField = "", conditionFieldValue = "", requiredField = "") {
        let dataList = await treeLogicsController.getExcelFileDataList(fileName);

        let findItem = dataList.find(obj => obj[conditionField] == conditionFieldValue);
        return findItem ? findItem[requiredField] : "";
    }

    static async getExcelFileFieldValueAndReturnMultipleFields(dataList = [], conditionField = "", conditionFieldValue = "", requiredField = [], comparisonType = "") {

        let findItem;
        // Equals To, Greater Than, Greater Than Or Equal To, Less Than, Less Than Or Equal To, Not Equals To
        switch (comparisonType) {
            case 'Equals To':
                findItem = await dataList.filter(obj => String(obj[conditionField]) === String(conditionFieldValue));
                break;
            case 'Greater Than':
                findItem = dataList.filter(obj => Number(obj[conditionField]) > Number(conditionFieldValue));
                break;
            case 'Greater Than Or Equal To':
                findItem = dataList.filter(obj => Number(obj[conditionField]) >= Number(conditionFieldValue));
                break;
            case 'Less Than':
                findItem = dataList.filter(obj => Number(obj[conditionField]) < Number(conditionFieldValue));
                break;
            case 'Less Than Or Equal To':
                findItem = dataList.filter(obj => Number(obj[conditionField]) <= Number(conditionFieldValue));
                break;
            case 'Not Equals To':
                findItem = dataList.filter(obj => String(obj[conditionField]) !== String(conditionFieldValue));
                break;
        }
        let dataToReturn = "";
        if (findItem.length === 1 && requiredField.length === 1) {
            dataToReturn = findItem[0][requiredField[0]];
            return dataToReturn;
        }
        return findItem;
    }

    static filterDataListByItemIds(dataList = [], ArrayOfIds = []) {

        return dataList.filter(obj => ArrayOfIds.includes(obj._id.toString()));
    }

    static filterItemsInDataList(dataList = [], key = "", value = "") {

        return dataList.filter(obj => obj[key] == value);
    }

    static findItemInDataList(dataList = [], key = "", value = "") {

        return dataList.find(obj => obj[key] == value);
    }

    static groupByDataList(dataList = [], fieldName = "", filterKeyName = "") {
        return _.chain(dataList).groupBy(fieldName).map((value, key) => ({
            [fieldName]: key,
            list: filterKeyName ? treeLogicsController.removeDuplicatesFromData(value, filterKeyName) : value
        })).value();
    }

    static removeDuplicatesFromData(array, fieldName) {
        const seen = new Set();
        return array.reduce((uniqueArray, item) => {
            if (!seen.has(item[`${fieldName}`])) {
                seen.add(item[`${fieldName}`]);
                uniqueArray.push(item);
            }
            return uniqueArray;
        }, []);
    }

    static sumArrayItems(dataList = [], fieldName = "") {
        const sumValue = dataList.reduce((acc, item) => {
            return Number(acc) + Number(item[fieldName]);
        }, 0);
        const roundOffValue = sumValue.toFixed(2);
        return Number(roundOffValue);
    }

    static sumNonZeroArrayItems(dataList = [], fieldName = "") {
        const sumValue = dataList.reduce((acc, item) => {
            return Number(acc) + Number(item[fieldName]);
        }, 0);
        let counter = 0;
        dataList.forEach(data => {
            if (data[fieldName] === "0") {
                counter++;
            }
        })
        const roundOffValue = sumValue.toFixed(2);
        if (counter === dataList.length)
            return "N/A";
        else
            return Number(roundOffValue);
    }

    static averageArrayItems(dataList = [], fieldName = "") {

        const avgValue = dataList.reduce((acc, item) => {
            return Number(acc) + (Number(item[fieldName]) / dataList.length);
        }, 0)
        const roundOffValue = avgValue.toFixed(2);
        return Number(roundOffValue);
    }

    static averageNonZeroArrayItems(dataList = [], fieldName = "") {

        const sumOfData = this.sumArrayItems(dataList, fieldName);
        let counter = 0;
        dataList.forEach(data => {
            if (data[fieldName] === "0") {
                counter++;
            }
        })
        const avgValue = sumOfData / (dataList.length - counter)
        const roundOffValue = avgValue.toFixed(2);
        if (counter === dataList.length)
            return "N/A";
        else
            return Number(roundOffValue);
    }

    static async averageCalculate(array) {
        let sumOfData = 0;
        for (let i = 0; i < array.length; i++) {
            sumOfData += Number(array[i]);
        }
        return sumOfData / array.length;
    }

    static async getLoopTypeSlugById(loopTypeId) {

        let loopRes = await loopTypeQuery.findOne({
            _id: loopTypeId
        });
        return loopRes ? loopRes.slug : "";
    }

    static getTotalLoadedValue(valueObj) {
        return (valueObj.packageSpreed || 0) + (valueObj.ltlLoads || 0) +
            (valueObj.tlLoads || 0) + (valueObj.fleetLoads || 0)
    }

    static setYellowColorColArr(inputServiceLevel, firstIndex, secondIndex, yellowColorColArray = []) {
        if (inputServiceLevel === 1) {
            if (secondIndex > 0) {
                yellowColorColArray.push(firstIndex, secondIndex);
            } else {
                yellowColorColArray.push(firstIndex);
            }

        } else if (inputServiceLevel === 2) {
            if (secondIndex > 0) {
                yellowColorColArray.push(firstIndex, secondIndex);
                yellowColorColArray.push(firstIndex + 1, secondIndex + 1);
            } else {
                yellowColorColArray.push(firstIndex)
            }
        } else if (inputServiceLevel === 3) {
            if (secondIndex > 0) {
                yellowColorColArray.push(firstIndex, secondIndex);
                yellowColorColArray.push(firstIndex + 1, secondIndex + 1);
                yellowColorColArray.push(firstIndex + 2, secondIndex + 2);
            } else {
                yellowColorColArray.push(firstIndex);
                yellowColorColArray.push(firstIndex + 1);
                yellowColorColArray.push(firstIndex + 2);
            }
        } else if (inputServiceLevel === 4) {
            if (secondIndex > 0) {
                yellowColorColArray.push(firstIndex, secondIndex);
                yellowColorColArray.push(firstIndex + 1, secondIndex + 1);
                yellowColorColArray.push(firstIndex + 2, secondIndex + 2);
                yellowColorColArray.push(firstIndex + 3, secondIndex + 3);
            } else {
                yellowColorColArray.push(firstIndex);
                yellowColorColArray.push(firstIndex + 1);
                yellowColorColArray.push(firstIndex + 2);
                yellowColorColArray.push(firstIndex + 3);
            }
        } else if (inputServiceLevel === 5) {
            if (secondIndex > 0) {
                yellowColorColArray.push(firstIndex, secondIndex);
                yellowColorColArray.push(firstIndex + 1, secondIndex + 1);
                yellowColorColArray.push(firstIndex + 2, secondIndex + 2);
                yellowColorColArray.push(firstIndex + 3, secondIndex + 3);
                yellowColorColArray.push(firstIndex + 4, secondIndex + 4);
            } else {
                yellowColorColArray.push(firstIndex);
                yellowColorColArray.push(firstIndex + 1);
                yellowColorColArray.push(firstIndex + 2);
                yellowColorColArray.push(firstIndex + 3);
                yellowColorColArray.push(firstIndex + 4);
            }
        } else if (inputServiceLevel === 6) {
            if (secondIndex > 0) {
                yellowColorColArray.push(firstIndex, secondIndex);
                yellowColorColArray.push(firstIndex + 1, secondIndex + 1);
                yellowColorColArray.push(firstIndex + 2, secondIndex + 2);
                yellowColorColArray.push(firstIndex + 3, secondIndex + 3);
                yellowColorColArray.push(firstIndex + 4, secondIndex + 4);
                yellowColorColArray.push(firstIndex + 5, secondIndex + 5);
            } else {
                yellowColorColArray.push(firstIndex);
                yellowColorColArray.push(firstIndex + 1);
                yellowColorColArray.push(firstIndex + 2);
                yellowColorColArray.push(firstIndex + 3);
                yellowColorColArray.push(firstIndex + 4);
                yellowColorColArray.push(firstIndex + 5);
            }
        } else if (inputServiceLevel > 6) {
            if (secondIndex > 0) {
                yellowColorColArray.push(firstIndex, secondIndex);
                yellowColorColArray.push(firstIndex + 1, secondIndex + 1);
                yellowColorColArray.push(firstIndex + 2, secondIndex + 2);
                yellowColorColArray.push(firstIndex + 3, secondIndex + 3);
                yellowColorColArray.push(firstIndex + 4, secondIndex + 4);
                yellowColorColArray.push(firstIndex + 5, secondIndex + 5);
                yellowColorColArray.push(firstIndex + 6, secondIndex + 6);
            } else {
                yellowColorColArray.push(firstIndex);
                yellowColorColArray.push(firstIndex + 1);
                yellowColorColArray.push(firstIndex + 2);
                yellowColorColArray.push(firstIndex + 3);
                yellowColorColArray.push(firstIndex + 4);
                yellowColorColArray.push(firstIndex + 5);
                yellowColorColArray.push(firstIndex + 6);
            }
        }
        return yellowColorColArray;
    }

    static getUserTransactionInputValue(userTransInputsData = [], key = "", value = "", valueType = "") {

        let findItem = userTransInputsData.find(obj => obj[key] == value);

        let emptyValue = null;
        if (valueType == "Number") {
            emptyValue = 0
        }
        if (valueType == "String") {
            emptyValue = ""
        }
        if (valueType == "Array") {
            emptyValue = []
        }
        if (valueType == "Object") {
            emptyValue = null
        }

        if (findItem && findItem.value) {

            let itemValue = valueType != "String" ? JSON.parse(findItem['value']) : findItem['value'];
            if (valueType == "Number") {
                return parseFloat(itemValue);
            } else {
                return itemValue;
            }
        } else {
            return emptyValue;
        }
    }

    static getUserTransactionInputValueWishDisplayColumn(userTransInputsData = [], key = "", value = "", valueType = "") {

        const findItem = userTransInputsData.find(obj => obj[key] === value);

        let emptyValue = null;
        if (valueType == "Number") {
            emptyValue = 0
        }
        if (valueType == "String") {
            emptyValue = ""
        }
        if (valueType == "Array") {
            emptyValue = []
        }
        if (valueType == "Object") {
            emptyValue = null
        }

        if (findItem && findItem.value) {
            const data = JSON.parse(findItem['value']);

            const metaData = {
                value: data,
                label: findItem.variableLabel ? findItem.variableLabel : findItem.variableName
            };
            if (valueType === "Number") {
                metaData['value'] = parseFloat(data);
            }
            return metaData;
            // if(valueType === "Array") {
            //     if(findItem.isFetchFromLookup) return data;
            //     else {

            //     }
            // }
            // let itemValue = valueType != "String" ? JSON.parse(findItem['value']) : findItem['value'];
            // if (valueType == "Number") {
            //     return parseFloat(itemValue);
            // } else {
            //     return itemValue;
            // }
        } else {
            return {
                value: "",
                label: ""
            };
        }
    }

    static async filterDataItemFromFileDataCaseInsensitive(dataFile, dataToFilter, field) {
        const dataToFilterInLowerCaseKeys = [];
        for (const data of dataToFilter.value) {
            const keys = Object.keys(data);
            const newObj = {};
            for (const key of keys) {
                if (key.toLowerCase() === field.toLowerCase()) newObj[field] = data[key];
                else newObj[key] = data[key];
            }
            dataToFilterInLowerCaseKeys.push(newObj);
        }

        const thirdArray = dataFile.filter((elem) => {
            return dataToFilterInLowerCaseKeys.some((ele) => {
                return ele[field] === elem[field];
            });
        });
        return {
            value: thirdArray,
            label: dataToFilter.label
        };
        // return dataFile.filter(obj => dataToFilterInLowerCaseKeys.includes(obj[field].toString()));
        // // dataFile.filter(data => {
        // //     if(dataToFilterInLowerCaseKeys.length === 1) {
        // //         dataToFilterInLowerCaseKeys[0][]
        // //     }
        // // })
    }

    static getUserTransactionInputValueReference(userTransInputsData = [], key = "", value = "", valueType = "") {

        let findItem = userTransInputsData.find(obj => obj[key] == value);

        let emptyValue = null;
        if (valueType == "Number") {
            emptyValue = 0
        }
        if (valueType == "String") {
            emptyValue = ""
        }
        if (valueType == "Array") {
            emptyValue = []
        }
        if (valueType == "Object") {
            emptyValue = null
        }

        if (findItem && findItem.valueReference) {

            let itemValue = valueType != "String" ? JSON.parse(findItem['valueReference']) : findItem['valueReference'];
            if (valueType == "Number") {
                return parseFloat(itemValue);
            } else {
                return itemValue;
            }
        } else {
            return emptyValue;
        }
    }

    static getUserTransactionInputFileId(userTransInputsData = [], key = "", value = "") {

        let findItem = userTransInputsData.find(obj => obj[key] == value);
        return findItem ? findItem.fileId : null;
    }

    static sumTotalContainersOfDate(objItem = null) {
        if (objItem.PortName === "Mobile" && objItem.Date === "1/13/22") {
            console.log(objItem)
        }
        let Containers = objItem["Containers"] ? objItem["Containers"] : objItem["Containers"] === 0 ? 0 : "0";
        let DryBreakbulk = objItem["DryBreakbulk"] ? objItem["DryBreakbulk"] : objItem["DryBreakbulk"] === 0 ? 0 : "0";
        let DryBulk = objItem["DryBulk"] ? objItem["DryBulk"] : objItem["DryBulk"] === 0 ? 0 : "0";
        let RoRo = objItem["RoRo"] ? objItem["RoRo"] : objItem["RoRo"] === 0 ? 0 : "0";
        let LPGCarriers = objItem["LPGCarriers"] ? objItem["LPGCarriers"] : objItem["LPGCarriers"] === 0 ? 0 : "0";
        let LNGCarriers = objItem["LNGCarriers"] ? objItem["LNGCarriers"] : objItem["LNGCarriers"] === 0 ? 0 : "0";
        let WetBulk = objItem["WetBulk"] ? objItem["WetBulk"] : objItem["WetBulk"] === 0 ? 0 : "0";
        let OtherMarkets = objItem["OtherMarkets"] ? objItem["OtherMarkets"] : objItem["OtherMarkets"] === 0 ? 0 : "0";
        let OffshoreRigs = objItem["OffshoreRigs"] ? objItem["OffshoreRigs"] : objItem["OffshoreRigs"] === 0 ? 0 : "0";

        return Containers + DryBreakbulk + DryBulk + RoRo + LPGCarriers + LNGCarriers + WetBulk + OtherMarkets + OffshoreRigs;
    }

    static getPortFormattedDate(date) {

        var dateArr = date.split("/");
        return dateArr[0] + "/" + dateArr[1] + "/" + dateArr[2];
    }

    static getTrend(value1, value2, trendPercent) {

        var dateArr = date.split("/");
        return dateArr[0] + "/" + dateArr[1];
    }

    static getRealDate(dateString = "") {

        dateString = dateString.replace(/['"]+/g, '');
        return moment(dateString, "D/M/YYYY").format('M/D/YYYY');
    }

    static convertToMillion(amount) {
        if (isNaN(amount)) {
            return "";
        }
        return (Number(amount) / 1000000).toLocaleString("en-US", {
            // minimumFractionDigits: 2,
            // maximumFractionDigits: 2,
            style: 'currency',
            currency: 'USD',
        }).concat('M');
    }

    static getSiteDataByType(dataList, raterType, sitesArr) {
        if (dataList.length > 0) {
            const ByTypeWiseRaterSiteWise = this.groupByDataList(dataList, "siteName");
            for (let i = 0; i < ByTypeWiseRaterSiteWise.length; i++) {
                const siteTotalPackages = ByTypeWiseRaterSiteWise[i]["list"].reduce((sum, obj) => {
                    if (raterType === 'parcel') {
                        return sum + obj.packageSpreed;
                    } else if (raterType === 'ltl') {
                        return sum + obj.ltlLoads;
                    } else if (raterType === 'tl') {
                        return sum + obj.tlLoads;
                    } else if (raterType === 'fleet') {
                        return sum + obj.fleetLoads;
                    }
                    return sum;
                }, 0);
                sitesArr.push({
                    siteName: ByTypeWiseRaterSiteWise[i]["siteName"],
                    raterType: raterType,
                    list: ByTypeWiseRaterSiteWise[i]["list"],
                    numberOfPackages: siteTotalPackages,
                    siteTotalCost: this.sumArrayItems(ByTypeWiseRaterSiteWise[i]["list"], 'totalCost'),
                });
            }
        }
        return sitesArr;
    }

    //================================ Utility Functions ======================================

    static getServiceLevelLabel(inputServiceLevel) {
        let label = "";
        switch (inputServiceLevel) {
            case 1:
                label = "1-Day";
                break;
            case 2:
                label = "2-Day";
                break;
            case 3:
                label = "3-Day";
                break;
            case 4:
                label = "SurePost";
                break;
            case 5:
                label = "UPSGround";
                break;
            default:
                label = "SL " + inputServiceLevel;
                break;
        }

        return label;
    }

    static getPercentageWithoutZero(amount, totalAmount) {
        if (isNaN(amount)) {
            return "";
        }
        if (isNaN(amount / totalAmount)) {
            return "";
        }
        return (amount / totalAmount * 100).toFixed(2) != "0.00" ? (amount / totalAmount * 100).toFixed(2) + "%" : "";
    }

    static getPercentageWithZero(amount, totalAmount) {
        return amount ? (amount / totalAmount * 100).toFixed(2) + "%" : "";
    }

    static groupByServiceLevel(itemsList) {

        // First update service level for >6 condition
        itemsList = itemsList.map(item => {
            item.serviceLevel = item.serviceLevel > 6 ? 7 : item.serviceLevel;
            return item;
        });

        return treeLogicsController.groupByDataList(itemsList, "serviceLevel");
    }

    static getTotalCostServiceLevelWise(groupedSLSitesArr, serviceLevel) {
        let slObj = groupedSLSitesArr.find(o => o.serviceLevel == serviceLevel);
        if (slObj && slObj["list"].length > 0) {
            let sumTotalCost = Math.round(slObj["list"].reduce((acc, item) => {
                return acc + (item.totalCost);
            }, 0));
            return sumTotalCost / 1000000;
        } else {
            return 0;
        }
    }

    static getTotalPkgServiceLevelWise(groupedSLSitesArr, serviceLevel, raterType = "") {
        let slObj = groupedSLSitesArr.find(o => o.serviceLevel == serviceLevel);
        if (slObj && slObj["list"].length > 0) {

            let sumTotalPKg = 0;

            if (raterType == "parcel") {
                sumTotalPKg = Math.round(slObj["list"].reduce((acc, item) => {
                    return acc + (item.packageSpreed);
                }, 0));
            }
            if (raterType == "ltl") {
                sumTotalPKg = Math.round(slObj["list"].reduce((acc, item) => {
                    return acc + (item.ltlLoads);
                }, 0));
            }
            if (raterType == "tl") {
                sumTotalPKg = Math.round(slObj["list"].reduce((acc, item) => {
                    return acc + (item.tlLoads);
                }, 0));
            }
            if (raterType == "fleet") {
                sumTotalPKg = Math.round(slObj["list"].reduce((acc, item) => {
                    return acc + (item.fleetLoads);
                }, 0));
            }

            return sumTotalPKg;
        } else {
            return 0;
        }
    }

    //================================ Execute Pre-defined Process in Test mode ======================================

    static async executeLoopProcessTest(req, res) {

        try {

            // Inputs get from tree travelsal data
            var userId = req.body.userId || null;
            var transactionId = req.body.transactionId || null;
            var loopTypeId = req.body.loopTypeId || null;

            var reqParams = {
                userId: userId,
                transactionId: transactionId,
                loopTypeId: loopTypeId,
            };

            await treeLogicsController.executeLoopProcess(reqParams);

            // Send Response
            res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, "Executed Loop Process", {}, []));

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    //================================ Execute Pre-defined Process in Live mode ======================================

    static async executeLoopProcess(reqParams) {
        try {

            // Inputs get from tree travelsal data
            const userId = reqParams.userId || null;
            const transactionId = reqParams.transactionId || null;
            const loopTypeId = reqParams.loopTypeId || null;

            // Get loop type slug by id
            const loopType = await treeLogicsController.getLoopTypeSlugById(loopTypeId);

            // Get user transaction inputs 
            const findUtiPattern = {
                userTransactionId: transactionId,
                isActive: true
            };
            const userTransInputsData = await userTransactionInputQuery.findAll(findUtiPattern);

            let inputValue = null;
            const convertToValueObject = (val) => {
                return {
                    value : val,
                    label : ""
                };
            }

            // network computation
            if (loopType == "parcelRater" || loopType == "ltlRater" || loopType == "tlRater" || loopType == "fleetRater") {
                const selectedProducts = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "selectedProducts", "Array");
                const selectedSites = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "selectedSites", "Array");
                const selectedStates = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "selectedStates", "Array");
                const selectedServiceLevels = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "selectedServiceLevels", "Array");

                // Common Calculation
                const productList = await treeLogicsController.getExcelFileDataList("Products");
                const statesList = await treeLogicsController.getExcelFileDataList("States");
                const sitesList = await treeLogicsController.getExcelFileDataList("Sites");
                const serviceLevelTypesList = await treeLogicsController.getExcelFileDataList("Service Level Types");
                const parcelRatesList = await treeLogicsController.getExcelFileDataList("Parcel Rates");
                const trailerSizesList = await treeLogicsController.getExcelFileDataList("Trailer Sizes");
                const mileageList = await treeLogicsController.getExcelFileDataList("Mileage");
                const ltLRatesList = await treeLogicsController.getExcelFileDataList("LTL Rates");
                const weightUnitsList = await treeLogicsController.getExcelFileDataList("Weight Units");

                // Get selected service levels
                const serviceLevelsArr = await treeLogicsController.filterDataItemFromFileDataCaseInsensitive(serviceLevelTypesList, convertToValueObject(selectedServiceLevels), "DisplayName");
                const inputServiceLevel = serviceLevelsArr.value.length > 0 ? serviceLevelsArr.value[0]["Number"] : 1;

                // Get selected sites
                const siteArrWithValue = await treeLogicsController.filterDataItemFromFileDataCaseInsensitive(sitesList, convertToValueObject(selectedSites), "SiteName");
                const siteArr = siteArrWithValue.value;

                // Get average of population of selected states
                const stateArrWithValue = await treeLogicsController.filterDataItemFromFileDataCaseInsensitive(statesList, convertToValueObject(selectedStates), "StateName");
                const stateArr = stateArrWithValue.value;
                const sumPopulation = treeLogicsController.sumArrayItems(stateArr, "Population");

                // Get average of weight of selected products
                const productArrWithValue = await treeLogicsController.filterDataItemFromFileDataCaseInsensitive(productList, convertToValueObject(selectedProducts), "Name");
                const productArr = productArrWithValue.value;

                // Group products by category
                let groupedProductArr = treeLogicsController.groupByDataList(productArr, "Category");

                groupedProductArr = groupedProductArr.map((itemObj) => {
                    itemObj.averageRetailPrice = treeLogicsController.averageArrayItems(itemObj.list, "RetailPrice");
                    itemObj.averagePCuFt = treeLogicsController.averageArrayItems(itemObj.list, "PCuFt");
                    itemObj.averageWeight = treeLogicsController.averageArrayItems(itemObj.list, "ActualWeight");
                    return itemObj;
                });

                // Get average by categories
                const averageRetailPrice = treeLogicsController.averageArrayItems(groupedProductArr, "averageRetailPrice");
                const averagePCuFt = treeLogicsController.averageArrayItems(groupedProductArr, "averagePCuFt");
                const actualAverageWeight = treeLogicsController.averageArrayItems(groupedProductArr, "averageWeight");
                const averageWeight = Math.ceil(actualAverageWeight);

                let parcelRaterMainJson = [];
                let ltlRaterMainJson = [];
                let tlRaterMainJson = [];
                let fleetRaterMainJson = [];

                // Get existing report summary data
                const reportSummary = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "reportSummary", "Object");

                if (reportSummary) {
                    parcelRaterMainJson = reportSummary.mainJson.parcelRaterMainJson || [];
                    ltlRaterMainJson = reportSummary.mainJson.ltlRaterMainJson || [];
                    tlRaterMainJson = reportSummary.mainJson.tlRaterMainJson || [];
                    fleetRaterMainJson = reportSummary.mainJson.fleetRaterMainJson || [];
                }

                // Get Percent Inputs
                const overAllRevenue = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "overAllRevenue", "Number");
                const eCommercePercent = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "eCommerceRevenuePercentage", "Number");
                const ltlPercent = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "LTLRaterPercentage", "Number");
                const tlPercent = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "TLRaterPercentage", "Number");
                const fleetPercent = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "PrivateFleetRaterPercentage", "Number");
                const parcelRaterPercent = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "ParcelRaterPercentage", "Number");
                const siteInfos = treeLogicsController.prepareNetWorkCompLocationData(selectedSites,sitesList)

                if (loopType == "parcelRater") {

                    const eCommerceRevenue = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "eCommerceRevenue", "Number");

                    parcelRaterMainJson = await treeLogicsController.getParcelRaterMainDataJson(
                        eCommerceRevenue,
                        sumPopulation,
                        inputServiceLevel,
                        averageWeight,
                        averageRetailPrice,
                        siteArr,
                        stateArr,
                        parcelRatesList,
                    );
                }

                if (loopType == "ltlRater") {

                    var ltlRevenue = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "ltlRevenue", "Number");

                    ltlRaterMainJson = await treeLogicsController.getLtlRaterMainDataJson(
                        ltlRevenue,
                        sumPopulation,
                        actualAverageWeight,
                        averageWeight,
                        averagePCuFt,
                        averageRetailPrice,
                        siteArr,
                        stateArr,
                        weightUnitsList,
                        trailerSizesList,
                        ltLRatesList,
                    );
                }

                if (loopType == "tlRater") {

                    var tlRevenue = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "tlRevenue", "Number");

                    tlRaterMainJson = await treeLogicsController.getTlRaterMainDataJson(
                        tlRevenue,
                        sumPopulation,
                        averageRetailPrice,
                        averagePCuFt,
                        siteArr,
                        stateArr,
                        trailerSizesList,
                        mileageList
                    );
                }

                if (loopType == "fleetRater") {

                    var fleetRevenue = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "fleetRevenue", "Number");
                    
                    fleetRaterMainJson = await treeLogicsController.getFleetRaterMainDataJson(
                        fleetRevenue,
                        sumPopulation,
                        averageRetailPrice,
                        averagePCuFt,
                        siteArr,
                        stateArr,
                        trailerSizesList,
                        mileageList
                    );
                }

                // Prepare input data object
                inputValue = {
                    inputData: {
                        overAllRevenue: overAllRevenue,
                        eCommercePercent: eCommercePercent,
                        ltlPercent: ltlPercent,
                        tlPercent: tlPercent,
                        fleetPercent: fleetPercent,
                        inputServiceLevel: inputServiceLevel,
                        parcelRaterPercent
                    },
                    averageWeight: averageWeight,
                    averagePCuFt: averagePCuFt,
                    averageRetailPrice: averageRetailPrice,
                    mainJson: {
                        siteInfos: siteInfos,
                        parcelRaterMainJson: parcelRaterMainJson,
                        ltlRaterMainJson: ltlRaterMainJson,
                        tlRaterMainJson: tlRaterMainJson,
                        fleetRaterMainJson: fleetRaterMainJson,
                    },
                };
            }
            // if (loopType == "parcelRater" || loopType == "ltlRater" || loopType == "tlRater" || loopType == "fleetRater") {
            //     var selectedProducts = treeLogicsController.getUserTransactionInputValueReference(userTransInputsData, "variableName", "selectedProducts", "Array");
            //     var selectedSites = treeLogicsController.getUserTransactionInputValueReference(userTransInputsData, "variableName", "selectedSites", "Array");
            //     var selectedStates = treeLogicsController.getUserTransactionInputValueReference(userTransInputsData, "variableName", "selectedStates", "Array");
            //     var selectedServiceLevels = treeLogicsController.getUserTransactionInputValueReference(userTransInputsData, "variableName", "selectedServiceLevels", "Array");

            //     // Common Calculation
            //     var productList = await treeLogicsController.getExcelFileDataList("Products");
            //     var statesList = await treeLogicsController.getExcelFileDataList("States");
            //     var sitesList = await treeLogicsController.getExcelFileDataList("Sites");
            //     var serviceLevelTypesList = await treeLogicsController.getExcelFileDataList("Service Level Types");
            //     var parcelRatesList = await treeLogicsController.getExcelFileDataList("Parcel Rates");
            //     var trailerSizesList = await treeLogicsController.getExcelFileDataList("Trailer Sizes");
            //     var mileageList = await treeLogicsController.getExcelFileDataList("Mileage");
            //     var ltLRatesList = await treeLogicsController.getExcelFileDataList("LTL Rates");
            //     var weightUnitsList = await treeLogicsController.getExcelFileDataList("Weight Units");

            //     // Get selected service levels
            //     var serviceLevelsArr = treeLogicsController.filterDataListByItemIds(serviceLevelTypesList, selectedServiceLevels);
            //     var inputServiceLevel = serviceLevelsArr.length > 0 ? serviceLevelsArr[0]["Number"] : 1;

            //     // Get selected sites
            //     var siteArr = treeLogicsController.filterDataListByItemIds(sitesList, selectedSites);

            //     // Get average of population of selected states
            //     var stateArr = treeLogicsController.filterDataListByItemIds(statesList, selectedStates);
            //     var sumPopulation = treeLogicsController.sumArrayItems(stateArr, "Population");

            //     // Get average of weight of selected products
            //     var productArr = treeLogicsController.filterDataListByItemIds(productList, selectedProducts);

            //     // Group products by category
            //     var groupedProductArr = treeLogicsController.groupByDataList(productArr, "Category");

            //     groupedProductArr = groupedProductArr.map((itemObj) => {
            //         itemObj.averageRetailPrice = treeLogicsController.averageArrayItems(itemObj.list, "RetailPrice");
            //         itemObj.averagePCuFt = treeLogicsController.averageArrayItems(itemObj.list, "PCuFt");
            //         itemObj.averageWeight = treeLogicsController.averageArrayItems(itemObj.list, "ActualWeight");
            //         return itemObj;
            //     });

            //     // Get average by categories
            //     var averageRetailPrice = treeLogicsController.averageArrayItems(groupedProductArr, "averageRetailPrice");
            //     var averagePCuFt = treeLogicsController.averageArrayItems(groupedProductArr, "averagePCuFt");
            //     var actualAverageWeight = treeLogicsController.averageArrayItems(groupedProductArr, "averageWeight");
            //     var averageWeight = Math.ceil(actualAverageWeight);

            //     var parcelRaterMainJson = [];
            //     var ltlRaterMainJson = [];
            //     var tlRaterMainJson = [];
            //     var fleetRaterMainJson = [];

            //     // Get existing report summary data
            //     var reportSummary = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "reportSummary", "Object");

            //     if (reportSummary) {
            //         parcelRaterMainJson = reportSummary.mainJson.parcelRaterMainJson || [];
            //         ltlRaterMainJson = reportSummary.mainJson.ltlRaterMainJson || [];
            //         tlRaterMainJson = reportSummary.mainJson.tlRaterMainJson || [];
            //         fleetRaterMainJson = reportSummary.mainJson.fleetRaterMainJson || [];
            //     }

            //     // Get Percent Inputs
            //     var overAllRevenue = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "overAllRevenue", "Number");
            //     var eCommercePercent = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "eCommerceRevenuePercentage", "Number");
            //     var ltlPercent = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "LTLRaterPercentage", "Number");
            //     var tlPercent = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "TLRaterPercentage", "Number");
            //     var fleetPercent = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "PrivateFleetRaterPercentage", "Number");
            //     const parcelRaterPercent = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "ParcelRaterPercentage", "Number");

            //     if (loopType == "parcelRater") {

            //         var eCommerceRevenue = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "eCommerceRevenue", "Number");

            //         parcelRaterMainJson = await treeLogicsController.getParcelRaterMainDataJson(
            //             eCommerceRevenue,
            //             sumPopulation,
            //             inputServiceLevel,
            //             averageWeight,
            //             averageRetailPrice,
            //             siteArr,
            //             stateArr,
            //             parcelRatesList,
            //         );
            //     }

            //     if (loopType == "ltlRater") {

            //         var ltlRevenue = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "ltlRevenue", "Number");

            //         ltlRaterMainJson = await treeLogicsController.getLtlRaterMainDataJson(
            //             ltlRevenue,
            //             sumPopulation,
            //             actualAverageWeight,
            //             averageWeight,
            //             averagePCuFt,
            //             averageRetailPrice,
            //             siteArr,
            //             stateArr,
            //             weightUnitsList,
            //             trailerSizesList,
            //             ltLRatesList,
            //         );
            //     }

            //     if (loopType == "tlRater") {

            //         var tlRevenue = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "tlRevenue", "Number");

            //         tlRaterMainJson = await treeLogicsController.getTlRaterMainDataJson(
            //             tlRevenue,
            //             sumPopulation,
            //             averageRetailPrice,
            //             averagePCuFt,
            //             siteArr,
            //             stateArr,
            //             trailerSizesList,
            //             mileageList
            //         );
            //     }

            //     if (loopType == "fleetRater") {

            //         var fleetRevenue = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "fleetRevenue", "Number");

            //         fleetRaterMainJson = await treeLogicsController.getFleetRaterMainDataJson(
            //             fleetRevenue,
            //             sumPopulation,
            //             averageRetailPrice,
            //             averagePCuFt,
            //             siteArr,
            //             stateArr,
            //             trailerSizesList,
            //             mileageList
            //         );
            //     }

            //     // Prepare input data object
            //     inputValue = {
            //         inputData: {
            //             overAllRevenue: overAllRevenue,
            //             eCommercePercent: eCommercePercent,
            //             ltlPercent: ltlPercent,
            //             tlPercent: tlPercent,
            //             fleetPercent: fleetPercent,
            //             inputServiceLevel: inputServiceLevel,
            //             parcelRaterPercent
            //         },
            //         averageWeight: averageWeight,
            //         averagePCuFt: averagePCuFt,
            //         averageRetailPrice: averageRetailPrice,
            //         mainJson: {
            //             parcelRaterMainJson: parcelRaterMainJson,
            //             ltlRaterMainJson: ltlRaterMainJson,
            //             tlRaterMainJson: tlRaterMainJson,
            //             fleetRaterMainJson: fleetRaterMainJson,
            //         },
            //     };
            // }

            // Port summary
            if (loopType == "portRater" || loopType == "portRaterWithComparisonDate") {

                // const selectedPorts = treeLogicsController.getUserTransactionInputValueReference(userTransInputsData, "variableName", "selectedPorts", "Array");
                const selectedPorts = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "selectedPorts", "Array");
                const selectedDate = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "selectedDate", "String");
                let comparisonDate = null;
                if (loopType === "portRaterWithComparisonDate") comparisonDate = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "comparisonDate", "String");

                // file data
                const portRegionsList = await treeLogicsController.getExcelFileDataList("Port Regions");
                const portDataList = await treeLogicsController.getExcelFileDataList("Port Data");

                // data projection
                const selectedPort = {
                    value: selectedPorts,
                    label: "Selected Ports"
                };
                // Get port data
                const portRegionsArr = await treeLogicsController.filterDataItemFromFileDataCaseInsensitive(portRegionsList, selectedPort, "PortName");
                const selectedPortLoCodeArr = portRegionsArr.value.map(a => a.LoCode);

                const portRaterMainJson = await treeLogicsController.getPortRaterMainDataJson(
                    portRegionsList,
                    selectedPortLoCodeArr,
                    comparisonDate,
                    selectedDate,
                    portDataList,
                );

                // Prepare input data object
                inputValue = {
                    inputData: {
                        // comparisonType: comparisonType,
                        selectedDate: selectedDate,
                    },
                    mainJson: {
                        portRaterMainJson: portRaterMainJson ? portRaterMainJson : [],
                    },
                };
            }

            if (loopType === "nearshore") {
                const currentManufacturingCountry = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "CurrentCountry", "Array");
                const futureManufacturingCountry = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "FutureCountry", "Array");
                const currentPortOfExport = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "CurrentPortOfExport", "Array");
                const futurePortOfExport = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "FuturePortOfExport", "Array");
                const currentPortOfImport = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "CurrentPortOfImport", "Array");
                const futurePortOfImport = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "FuturePortOfImport", "Array");
                const distributionNode = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "Site", "Array");
                const LeadTimeNet = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "LTNet", "Number");
                const containerSavings = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "ContainerSavings", "Number");
                const deliverySavings = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "DSavings", "Number");
                const spaceCost = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "SpaceCost", "Number");
                const laborCost = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "LaborCost", "Number");
                const futureMaintenanceCost = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "FMCost", "Number");
                const inTransitInv = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "InTransitInv", "Number");
                const manufacturingRelocation = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "ManufacturingRelocation", "Number");
                const costOfPlantOwnership = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "PlantCost", "Number");
                const finalDistributionRelocation = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "FinalDistributionRelocation", "Number");
                const totalOpportunityValue = await treeLogicsController.getUserTransactionInputValueWishDisplayColumn(userTransInputsData, "variableName", "TotalOpportunityValue", "Number");

                // files
                const portRegionsList = await treeLogicsController.getExcelFileDataList("Port Regions");
                const sitesList = await treeLogicsController.getExcelFileDataList("Sites");

                //get data object after filter process
                const currentCountry = await treeLogicsController.filterDataItemFromFileDataCaseInsensitive(portRegionsList, currentManufacturingCountry, "Country");
                const futureCountry = await treeLogicsController.filterDataItemFromFileDataCaseInsensitive(portRegionsList, futureManufacturingCountry, "Country");
                // const currentExportPort = await treeLogicsController.filterDataItemFromFileDataCaseInsensitive(portRegionsList, currentPortOfExport, "PortName");
                // const futureExportPort = await treeLogicsController.filterDataItemFromFileDataCaseInsensitive(portRegionsList, futurePortOfExport, "PortName");
                const currentImportPort = await treeLogicsController.filterDataItemFromFileDataCaseInsensitive(portRegionsList, currentPortOfImport, "PortName");
                const futureImportPort = await treeLogicsController.filterDataItemFromFileDataCaseInsensitive(portRegionsList, futurePortOfImport, "PortName");
                const currentDistributionNode = await treeLogicsController.filterDataItemFromFileDataCaseInsensitive(sitesList, distributionNode, "SiteName");

                const dataToProcess = {
                    // portRegionsList,
                    // sitesList,
                    // currentManufacturingCountry,
                    // futureManufacturingCountry,
                    // currentPortOfExport,
                    // futurePortOfExport,
                    // currentPortOfImport,
                    // futurePortOfImport,
                    // distributionNode,
                    currentCountry,
                    futureCountry,
                    currentImportPort,
                    futureImportPort,
                    currentDistributionNode,
                    LeadTimeNet,
                    containerSavings,
                    deliverySavings,
                    spaceCost,
                    laborCost,
                    futureMaintenanceCost,
                    inTransitInv,
                    manufacturingRelocation,
                    costOfPlantOwnership,
                    finalDistributionRelocation,
                    totalOpportunityValue
                };

                const nearshoreMainJson = await treeLogicsController.prepareNearshoreMainJson(dataToProcess);

                inputValue = {
                    inputData: {},
                    mainJson: {
                        nearshoreMainJson
                    }
                }
            }

            const findPattern = {
                userTransactionId: transactionId,
                variableName: "reportSummary",
                isActive: true
            };

            const updatePattern = {
                value: JSON.stringify(inputValue),
                valueType: 'Object',
                createdBy: userId
            };

            await userTransactionInputQuery.upsertOne(findPattern, updatePattern);

        } catch (err) {
            console.log(err.toString());
        }
    }

    static async generateReportUrl(transactionId = "", inputMainJson = null, reportTemplate = "", userInfo = null) {
        if (reportTemplate === "nearshoreTemplate") {
            const reportURL = await treeLogicsController.generateReportPDFFile(transactionId, userInfo, inputMainJson, reportTemplate);
            return reportURL;
        }
        if (reportTemplate === "simpleForecast"){
            return treeLogicsController.generateReportExcelFileForSimpleForecast(transactionId, userInfo, inputExcelSheets, reportTemplate);
        }
        var inputExcelSheets = await treeLogicsController.getExcelSheetsReportTemplateWise(reportTemplate, inputMainJson, userInfo);
        return treeLogicsController.generateReportExcelFile(transactionId, userInfo, inputExcelSheets, reportTemplate);
    }

    static async generateReportHtml(transactionId = "", inputMainJson = null, reportTemplate = "", userInfo = null) {

        var inputExcelSheets = await treeLogicsController.getExcelSheetsReportTemplateWiseForHtml(reportTemplate, inputMainJson);
        return treeLogicsController.generateReportHtmlContent(transactionId, userInfo, inputExcelSheets);
    }

    //================================ Nearshore Process =======================================

    static async prepareNearshoreMainJson(data) {

        const value = (number) => {
            const absoluteNumber = Math.abs(Number(number))
            return number < 0 ? "-" + (absoluteNumber / 1.0e+6).toFixed(2) + "M" : (absoluteNumber / 1.0e+6).toFixed(2) + "M";
            // else return Math.round(number);
        }

        const currentCountryLocationData = await treeLogicsController.prepareLocationData(data.currentCountry.value, "mfgCurrent", "country");
        const futureCountryLocationData = await treeLogicsController.prepareLocationData(data.futureCountry.value, "mfgFuture", "country");
        const currentPortLocationData = await treeLogicsController.prepareLocationData(data.currentImportPort.value, "portCurrent", "port");
        const futurePortLocationData = await treeLogicsController.prepareLocationData(data.futureImportPort.value, "portFuture", "port");
        const currentDistributionNodeLocationData = await treeLogicsController.prepareLocationData(data.currentDistributionNode.value, "node", "site");
        const mainJson = {
            locations: JSON.stringify([
                currentCountryLocationData,
                futureCountryLocationData,
                currentPortLocationData,
                futurePortLocationData,
                currentDistributionNodeLocationData
            ]),
            currentPort: {
                value: currentPortLocationData.location,
                label: data.currentImportPort.label
            },
            futurePort: {
                value: futurePortLocationData.location,
                label: data.futureImportPort.label
            },
            distributionNode: {
                value: currentDistributionNodeLocationData.location,
                label: data.currentDistributionNode.label
            },
            currentManufacturing: {
                value: currentCountryLocationData.location,
                label: data.currentCountry.label
            },
            futureManufacturing: {
                value: futureCountryLocationData.location,
                label: data.futureCountry.label
            },
            LTNet: {
                value: value(data.LeadTimeNet.value),
                label: data.LeadTimeNet.label
            },
            ContainerSavings: {
                value: value(data.containerSavings.value),
                label: data.containerSavings.label
            },
            DSavings: {
                value: value(data.deliverySavings.value),
                label: data.deliverySavings.label
            },
            SpaceCost: {
                value: value(data.spaceCost.value),
                label: data.spaceCost.label
            },
            LaborCost: {
                value: value(data.laborCost.value),
                label: data.laborCost.label
            },
            FMCost: {
                value: value(data.futureMaintenanceCost.value),
                label: data.futureMaintenanceCost.label
            },
            InTransitInv: {
                value: value(data.inTransitInv.value),
                label: data.inTransitInv.label
            },
            valueOfManufacturingRelocation: {
                value: value(data.manufacturingRelocation.value),
                label: data.manufacturingRelocation.label
            },
            costOfPlantOwnership: {
                value: value(data.costOfPlantOwnership.value),
                label: data.costOfPlantOwnership.label
            },
            finalDistributionRelocation: {
                value: value(data.finalDistributionRelocation.value),
                label: data.finalDistributionRelocation.label
            },
            totalOpportunityValue: {
                value: value(data.totalOpportunityValue.value),
                label: data.totalOpportunityValue.label
            }
        };
        return mainJson;
    }


    static async prepareLocationData(data, pinType, dataRefersTo) {
        const variableNames = {
            country: "Country",
            port: "PortName",
            site: "SiteName"
        };
        const variableName = variableNames[dataRefersTo];

        const location = data[0][variableName];
        const lat = data[0]["Latitude"];
        const long = data[0]["Longitude"];
        let hcKey;
        for (var i = 0; i < HighChartCountry.length; i++) {
        if (HighChartCountry[i].name.toLowerCase() === location.toLowerCase()) {
                hcKey = HighChartCountry[i]['hc-key']
                break; // Exit the loop since you've found a match
            }
        }
        return {
            location,
            lat,
            long,
            pinType,
            hcKey
        };
    }

    //================================ Parcel Rater Process ======================================

    static async getParcelRaterMainDataJson(
        eCommerceRevenue,
        sumPopulation,
        inputServiceLevel,
        averageWeight,
        averageRetailPrice,
        siteArr,
        stateArr,
        parcelRatesList,
    ) {
        try {

            const sheetFlagArr = ["UPSGround", "SurePost", "3-Day", "2-Day", "1-Day"];

            const parcelRatesArr = [];
            for (let item of sheetFlagArr) {
                parcelRatesArr.push({
                    sheetFlag: item,
                    parcelRatesList: treeLogicsController.filterItemsInDataList(parcelRatesList, "SheetName", item)
                });
            }

            const finalOutput = [];

            const eCommerceUnits = Math.ceil(eCommerceRevenue / averageRetailPrice);
            const numberOfPackages = Math.ceil(eCommerceUnits);

            for (let i = 0; i < siteArr.length; i++) {

                for (let j = 0; j < stateArr.length; j++) {

                    const populationMultiplier = stateArr[j]["Population"] / sumPopulation;
                    const packageSpreed = Math.round(numberOfPackages * populationMultiplier);

                    const zoneKey = stateArr[j]["StateCode"] + "Zone";
                    const zoneNumber = siteArr[i][zoneKey];

                    if (zoneNumber) {

                        const zoneType = "Zone" + zoneNumber;
                        const serviceLevelType = "SL" + zoneNumber;

                        for (let k = 0; k < parcelRatesArr.length; k++) {

                            const parcelRatesObj = parcelRatesArr[k].parcelRatesList.find(obj => {
                                return obj.Weight == averageWeight;
                            });
                            const parcelRate = parcelRatesObj ? parcelRatesObj[zoneType] : 0;
                            const serviceLevel = parcelRate ? parcelRatesObj[serviceLevelType] : 0;

                            if (parcelRatesObj && serviceLevel <= inputServiceLevel && serviceLevel > 0) {

                                finalOutput.push({
                                    siteName: siteArr[i]["SiteName"],
                                    stateCode: stateArr[j]["StateCode"],
                                    populationPercent: stateArr[j]["PopulationPercent"],
                                    zoneNumber: zoneNumber,
                                    parcelRate: parcelRate,
                                    serviceLevel: serviceLevel,
                                    numberOfPackages: numberOfPackages,
                                    packageSpreed: packageSpreed,
                                    totalCost: parcelRate * packageSpreed,
                                });
                                break;
                            }
                        }
                    }
                }
            }

            return finalOutput;

        } catch (err) {
            console.log(err);
        }
    }

    static async getParcelRaterExcelJson(parcelRaterMainJson) {

        var groupedParcelRaterMainJson = {
            siteWise: [],
            stateWise: []
        };
        var parcelRaterExcelJson = {
            siteWise: null,
            serviceLevelWise: null
        };

        if (parcelRaterMainJson.length > 0) {

            groupedParcelRaterMainJson["siteWise"] = treeLogicsController.groupByDataList(parcelRaterMainJson, "siteName");
            groupedParcelRaterMainJson["stateWise"] = treeLogicsController.groupByDataList(parcelRaterMainJson, "stateCode");

            parcelRaterExcelJson["siteWise"] = await treeLogicsController.getExcelJsonForParcelRaterSiteWise(groupedParcelRaterMainJson.siteWise);
            parcelRaterExcelJson["serviceLevelWise"] = await treeLogicsController.getExcelJsonForParcelRaterServiceLevelWise(groupedParcelRaterMainJson.stateWise);
        }

        return parcelRaterExcelJson;
    }

    static async getExcelJsonForParcelRaterSiteWise(parcelRaterMainJson, styleOpts = {}, userInfo = {}) {

        let siteWiseData = this.groupByDataList(parcelRaterMainJson, "siteName");
        const topThickBoarderRowArr = [];
        const leftThickBoarderColArr = [];
        const rightThickBoarderColArr = [];
        const bottomThickBoarderRowArr = [];
        const sixteenSizeFontArray = [];
        const topAndBottomBorderDashedColArray = [];
        const currencyColArr = [5, 6, 7];
        const percentageFormatColArr = [9, 10, 11, 12, 13, 14, 15];

        // Start to set Excel JSON
        const columnCount = 23;
        let mergeArr = [{
            s: {
                r: 2,
                c: 0
            },
            e: {
                r: 2,
                c: columnCount
            }
        }, ];

        let rowsCount = siteWiseData.length + 6;

        let boldRowArr = [];
        let colorRowArr = [];
        let jsonArr = [];

        let jsonLengthFromTitles;
        const type = 'Parcel Rater Report';
        const titleMain = ['', 'Network', '', 'Demand', '', 'Cost Analysis', '', '', '', 'Percent Service Level Achievement', '', '', '', '', '', '', '', 'Service Level Achievement - Deliveries', '', '', '', '', '', ''];
        jsonArr.push(titleMain);
        jsonLengthFromTitles = jsonArr.length + 5;
        topThickBoarderRowArr.push(jsonArr.length + 5);
        const subTitle = ['', 'Site', 'Delivery State', 'No. Packages', 'Packages Spread', 'Cost / Package', 'Total Packages Cost', 'Total Scenario Cost', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day'];
        jsonArr.push(subTitle);
        const startRowForYellowColorSummary = jsonArr.length + 5;
        bottomThickBoarderRowArr.push(jsonArr.length + 5);
        rightThickBoarderColArr.push(2, 7, 15, columnCount);
        leftThickBoarderColArr.push(1, 9, 17);
        const yellowColorColArray = [];
        let firstIndex = 9,
            secondIndex = 17;
        this.setYellowColorColArr(userInfo.inputServiceLevel, firstIndex, secondIndex, yellowColorColArray);

        for (let m = 0; m < siteWiseData.length; m++) {
            const siteTotalCost = siteWiseData[m]["list"].reduce((total, obj) => obj.totalCost + total, 0);
            // const siteWiseServiceLevelDelivery = siteWiseData[m]["list"].reduce((total, obj) => obj.packageSpreed + total, 0);
            const costPerPackage = siteTotalCost / siteWiseData[m].list[0]["numberOfPackages"];
            const deliveryPercentage = (siteWiseData[m].list[0]["numberOfPackages"] / siteWiseData[m].list[0]["numberOfPackages"]) * 100;
            jsonArr.push([
                '',
                siteWiseData[m].list[0]["siteName"],
                '',
                String(siteWiseData[m].list[0]["numberOfPackages"]),
                '',
                Math.round((costPerPackage + Number.EPSILON) * 100) / 100,
                '',
                Number(siteTotalCost.toFixed(2)),
                '',
                siteWiseData[m].list[0]["serviceLevel"] == 1 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 2 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 3 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 4 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 5 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 6 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] > 6 ? (deliveryPercentage || '') : '',
                '',
                siteWiseData[m].list[0]["serviceLevel"] == 1 ? String(siteWiseData[m].list[0]["numberOfPackages"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 2 ? String(siteWiseData[m].list[0]["numberOfPackages"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 3 ? String(siteWiseData[m].list[0]["numberOfPackages"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 4 ? String(siteWiseData[m].list[0]["numberOfPackages"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 5 ? String(siteWiseData[m].list[0]["numberOfPackages"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 6 ? String(siteWiseData[m].list[0]["numberOfPackages"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] > 6 ? String(siteWiseData[m].list[0]["numberOfPackages"]) : "",
            ]);
        }
        const endRowForYellowColorSummary = jsonArr.length + 5;
        mergeArr.push(await this.prepareMergeRecord(jsonLengthFromTitles, 8, jsonArr.length + 5, 8));
        mergeArr.push(await this.prepareMergeRecord(jsonLengthFromTitles, 16, jsonArr.length + 5, 16));
        bottomThickBoarderRowArr.push(jsonArr.length + 5);
        jsonArr.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + 5, 0, jsonArr.length + 5, columnCount + 1))
        jsonArr.push(['', 'Scenario Details ', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + 5, 1, jsonArr.length + 5, columnCount + 1));
        const noBorderRowTitle = [jsonArr.length + 5];
        sixteenSizeFontArray.push(jsonArr.length + 5);
        jsonArr.push(titleMain);
        topThickBoarderRowArr.push(jsonArr.length + 5);
        boldRowArr.push(jsonArr.length + 5);
        const scenarioStartsFrom = jsonArr.length + 5;
        mergeArr.push(
            await this.prepareMergeRecord(jsonArr.length + 5, 1, jsonArr.length + 5, 2),
            await this.prepareMergeRecord(jsonArr.length + 5, 3, jsonArr.length + 5, 4),
            await this.prepareMergeRecord(jsonArr.length + 5, 5, jsonArr.length + 5, 7),
            await this.prepareMergeRecord(jsonArr.length + 5, 9, jsonArr.length + 5, 15),
            await this.prepareMergeRecord(jsonArr.length + 5, 17, jsonArr.length + 5, columnCount),
        )
        const subTitleForDetail = ['', 'Site', 'Delivery State', 'No. Packages', 'Packages Spread', 'Cost / Package', '$ By Delivery State', 'Total Scenario Cost', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day'];
        jsonArr.push(subTitleForDetail);
        const startRowForYellowColorDetail = jsonArr.length + 5;
        bottomThickBoarderRowArr.push(jsonArr.length + 5)

        for (let i = 0; i < siteWiseData.length; i++) {

            var siteTotalCost = siteWiseData[i]["list"].reduce((total, obj) => obj.totalCost + total, 0);
            let siteStartFrom = jsonArr.length + 5 + 1;
            for (let j = 0; j < siteWiseData[i].list.length; j++) {
                const deliveryPercentage = (siteWiseData[i].list[j]["packageSpreed"] / siteWiseData[i].list[j]["packageSpreed"]) * 100;
                jsonArr.push([
                    '',
                    j == 0 ? siteWiseData[i].list[j]["siteName"] : "",
                    siteWiseData[i].list[j]["stateCode"],
                    j == 0 ? String(siteWiseData[i].list[j]["numberOfPackages"]) : "",
                    String(siteWiseData[i].list[j]["packageSpreed"]),
                    siteWiseData[i].list[j]["parcelRate"],
                    siteWiseData[i].list[j]["totalCost"],
                    j == 0 ? Number(siteTotalCost.toFixed(2)) : "",
                    '',
                    siteWiseData[i].list[j]["serviceLevel"] == 1 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 2 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 3 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 4 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 5 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 6 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] > 6 ? (deliveryPercentage || '') : '',
                    '',
                    siteWiseData[i].list[j]["serviceLevel"] == 1 ? String(siteWiseData[i].list[j]["packageSpreed"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 2 ? String(siteWiseData[i].list[j]["packageSpreed"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 3 ? String(siteWiseData[i].list[j]["packageSpreed"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 4 ? String(siteWiseData[i].list[j]["packageSpreed"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 5 ? String(siteWiseData[i].list[j]["packageSpreed"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 6 ? String(siteWiseData[i].list[j]["packageSpreed"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] > 6 ? String(siteWiseData[i].list[j]["packageSpreed"]) : "",
                ]);
                let firstIndex = 9;
                let secondIndex = 17;
                this.setYellowColorColArr(siteWiseData[i].list[j]["serviceLevel"], firstIndex, secondIndex, yellowColorColArray);
            }
            mergeArr.push(
                await this.prepareMergeRecord(siteStartFrom, 1, jsonArr.length + 5, 1),
                await this.prepareMergeRecord(siteStartFrom, 3, jsonArr.length + 5, 3),
                await this.prepareMergeRecord(siteStartFrom, 7, jsonArr.length + 5, 7)
            )
        }
        const endRowForYellowColorDetail = jsonArr.length + 5;
        mergeArr.push(
            await this.prepareMergeRecord(scenarioStartsFrom, 8, jsonArr.length + 5, 8),
            await this.prepareMergeRecord(scenarioStartsFrom, 16, jsonArr.length + 5, 16),
            await this.prepareMergeRecord(6, 0, jsonArr.length + 6, 0),
            await this.prepareMergeRecord(6, 8, jsonArr.length + 5, 8),
            await this.prepareMergeRecord(6, 16, jsonArr.length + 5, 16),
            await this.prepareMergeRecord(6, 1, 6, 2),
            await this.prepareMergeRecord(6, 3, 6, 4),
            await this.prepareMergeRecord(6, 5, 6, 7),
            await this.prepareMergeRecord(6, 9, 6, 15),
            await this.prepareMergeRecord(6, 17, 6, columnCount),
            // await this.prepareMergeRecord(6, 8, jsonArr.length + 5, 8),
        );
        boldRowArr.push(6);
        bottomThickBoarderRowArr.push(jsonArr.length + 5);
        topAndBottomBorderDashedColArray.push(8, 16);
        const getColSizeArr = await this.getColumnSizeArr(jsonArr);
        getColSizeArr[9].wch = 5;
        getColSizeArr[17].wch = 5;
        return {
            jsonArr: jsonArr,
            type,
            mergeArr: styleOpts.mergeArr || mergeArr,
            columnCount: styleOpts.columnCount || columnCount,
            rowsCount: styleOpts.rowsCount || rowsCount,
            currencyColArr: styleOpts.currencyColArr || currencyColArr,
            boldRowArr: styleOpts.boldRowArr || boldRowArr,
            colorRowArr: styleOpts.colorRowArr || colorRowArr,
            topThickBoarderRowArr: styleOpts.topThickBoarderRowArr || topThickBoarderRowArr,
            bottomThickBoarderRowArr: styleOpts.bottomThickBoarderRowArr || bottomThickBoarderRowArr,
            leftThickBoarderColArr: styleOpts.leftThickBoarderColArr || leftThickBoarderColArr,
            rightThickBoarderColArr: styleOpts.rightThickBoarderColArr || rightThickBoarderColArr,
            sixteenSizeFontArray: styleOpts.sixteenSizeFontArray || sixteenSizeFontArray,
            noBorderRowTitle: noBorderRowTitle,
            topAndBottomBorderDashedColArray: styleOpts.topAndBottomBorderDashedColArray || topAndBottomBorderDashedColArray,
            columSizeArr: styleOpts.getColSizeArr || getColSizeArr,
            percentageFormatColArr: styleOpts.percentageFormatColArr || percentageFormatColArr,
            yellowColorColArray: styleOpts.yellowColorColArray || yellowColorColArray,
            colorRowDetail: {
                startRowForYellowColorSummary,
                endRowForYellowColorSummary,
                startRowForYellowColorDetail,
                endRowForYellowColorDetail
            }
        };
    }

    static async getColumnSizeArr(jsonArr) {
        const maxSizeArr = [];
        const sizeArr = [];
        for (let i = 0; i < jsonArr.length; i++) {
            for (let j = 0; j < jsonArr[i].length; j++) {
                if (i === 0) {
                    maxSizeArr.push(String(jsonArr[i][j]).length + 2)
                } else {
                    if (String(jsonArr[i][j]).length > maxSizeArr[j] - 2) {
                        maxSizeArr[j] = String(jsonArr[i][j]).length + 2;
                    }
                }
            }
        }
        for (let k = 0; k < maxSizeArr.length; k++) {
            sizeArr.push({
                wch: maxSizeArr[k]
            });
        }
        return sizeArr;
    }

    static async getExcelJsonForParcelRaterServiceLevelWise(parcelRaterMainJson, styleOpts = {}) {

        let stateWiseData = treeLogicsController.groupByDataList(parcelRaterMainJson, "stateCode");
        const centerAlignmentArr = [];
        const headingSizeArray = [];
        var minCostSitesArr = [];
        stateWiseData.forEach((stateItem) => {
            var minCostSite = stateItem["list"].reduce(function (prev, curr) {
                return prev.totalCost < curr.totalCost ? prev : curr;
            });
            minCostSitesArr.push(minCostSite);
        });
        const siteWiseRaterPkgArr = [];
        let groupedMinCostSitesArr = treeLogicsController.groupByDataList(minCostSitesArr, "siteName");

        var inputSitesArr = stateWiseData[0]["list"].map(a => a.siteName);
        var groupedMinSitesArr = groupedMinCostSitesArr.map(a => a.siteName);
        var missingSitesArr = inputSitesArr.filter(x => !groupedMinSitesArr.includes(x));

        // Start to set Excel JSON
        let columnCount = 18;
        let mergeArr = [];
        let rowsCount = groupedMinCostSitesArr.length;
        let currencyColArr = [];
        let boldRowArr = [];
        let colorRowArr = [2];
        let jsonArr = [];

        let Sl1Sum = 0;
        let Sl2Sum = 0;
        let Sl3Sum = 0;
        let Sl4Sum = 0;
        let Sl5Sum = 0;
        let Sl6Sum = 0;
        let Sl7Sum = 0;
        let Sl1PkgSum = 0;
        let Sl2PkgSum = 0;
        let Sl3PkgSum = 0;
        let Sl4PkgSum = 0;
        let Sl5PkgSum = 0;
        let Sl6PkgSum = 0;
        let Sl7PkgSum = 0;

        groupedMinCostSitesArr.forEach((siteItem) => {

            var groupedSlItemsArr = this.groupByServiceLevel(siteItem["list"]);

            let Sl1Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 1);
            let Sl2Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 2);
            let Sl3Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 3);
            let Sl4Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 4);
            let Sl5Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 5);
            let Sl6Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 6);
            let Sl7Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 7);

            let Sl1Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 1, "parcel");
            let Sl2Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 2, "parcel");
            let Sl3Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 3, "parcel");
            let Sl4Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 4, "parcel");
            let Sl5Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 5, "parcel");
            let Sl6Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 6, "parcel");
            let Sl7Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 7, "parcel");

            jsonArr.push([
                "",
                "Parcel",
                siteItem["siteName"],
                Sl1Cost || "",
                Sl2Cost || "",
                Sl3Cost || "",
                Sl4Cost || "",
                Sl5Cost || "",
                Sl6Cost || "",
                Sl7Cost || "",
                (Sl1Cost + Sl2Cost + Sl3Cost + Sl4Cost + Sl5Cost + Sl6Cost + Sl7Cost),
                Sl1Pkg || "",
                Sl2Pkg || "",
                Sl3Pkg || "",
                Sl4Pkg || "",
                Sl5Pkg || "",
                Sl6Pkg || "",
                Sl7Pkg || "",
                (Sl1Pkg + Sl2Pkg + Sl3Pkg + Sl4Pkg + Sl5Pkg + Sl6Pkg + Sl7Pkg),
            ]);

            siteWiseRaterPkgArr.push({
                "siteName": siteItem["siteName"],
                "raterType": "parcel",
                "totalCost": (Sl1Cost + Sl2Cost + Sl3Cost + Sl4Cost + Sl5Cost + Sl6Cost + Sl7Cost),
                "totalPkg": (Sl1Pkg + Sl2Pkg + Sl3Pkg + Sl4Pkg + Sl5Pkg + Sl6Pkg + Sl7Pkg)
            })

            Sl1Sum += Sl1Cost;
            Sl2Sum += Sl2Cost;
            Sl3Sum += Sl3Cost;
            Sl4Sum += Sl4Cost;
            Sl5Sum += Sl5Cost;
            Sl6Sum += Sl6Cost;
            Sl7Sum += Sl7Cost;

            Sl1PkgSum += Sl1Pkg;
            Sl2PkgSum += Sl2Pkg;
            Sl3PkgSum += Sl3Pkg;
            Sl4PkgSum += Sl4Pkg;
            Sl5PkgSum += Sl5Pkg;
            Sl6PkgSum += Sl6Pkg;
            Sl7PkgSum += Sl7Pkg;
        });

        missingSitesArr.forEach((siteName) => {
            jsonArr.push(["", "Parcel", siteName, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
        });

        var totalSlSum = Sl1Sum + Sl2Sum + Sl3Sum + Sl4Sum + Sl5Sum + Sl6Sum + Sl7Sum;
        var totalSlPkgSum = Sl1PkgSum + Sl2PkgSum + Sl3PkgSum + Sl4PkgSum + Sl5PkgSum + Sl6PkgSum + Sl7PkgSum;

        jsonArr.push([
            "",
            "",
            "Sub Total",
            Sl1Sum ? Sl1Sum : "",
            Sl2Sum ? Sl2Sum : "",
            Sl3Sum ? Sl3Sum : "",
            Sl4Sum ? Sl4Sum : "",
            Sl5Sum ? Sl5Sum : "",
            Sl6Sum ? Sl6Sum : "",
            Sl7Sum ? Sl7Sum : "",
            totalSlSum,
            Sl1PkgSum ? Sl1PkgSum : "",
            Sl2PkgSum ? Sl2PkgSum : "",
            Sl3PkgSum ? Sl3PkgSum : "",
            Sl4PkgSum ? Sl4PkgSum : "",
            Sl5PkgSum ? Sl5PkgSum : "",
            Sl6PkgSum ? Sl6PkgSum : "",
            Sl7PkgSum ? Sl7PkgSum : "",
            totalSlPkgSum
        ]);

        jsonArr.push([
            "",
            "",
            "% of Total",
            this.getPercentageWithoutZero(Sl1Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl2Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl3Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl4Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl5Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl6Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl7Sum, totalSlSum),
            this.getPercentageWithoutZero(totalSlSum, totalSlSum),
            this.getPercentageWithoutZero(Sl1PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl2PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl3PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl4PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl5PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl6PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl7PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(totalSlPkgSum, totalSlPkgSum),
        ]);

        return {
            jsonArr: jsonArr,
            mergeArr: styleOpts.mergeArr || mergeArr,
            columnCount: styleOpts.columnCount || columnCount,
            rowsCount: styleOpts.rowsCount || rowsCount,
            currencyColArr: styleOpts.currencyColArr || currencyColArr,
            boldRowArr: styleOpts.boldRowArr || boldRowArr,
            siteWiseRaterPkgArr: siteWiseRaterPkgArr,
            colorRowArr: styleOpts.colorRowArr || colorRowArr,
            centerAlignmentArr: styleOpts.centerAlignmentArr || centerAlignmentArr,
            headingSizeArray: styleOpts.headingSizeArray || headingSizeArray
        };
    }

    //================================ LTL Rater Process ======================================

    static async getLtlRaterMainDataJson(
        ltlRevenue,
        sumPopulation,
        actualAverageWeight,
        averageWeight,
        averagePCuFt,
        averageRetailPrice,
        siteArr,
        stateArr,
        weightUnits,
        trailerSizesList,
        ltLRatesList,
    ) {
        try {

            var finalOutput = [];

            let trailerSizeObj = trailerSizesList.find(obj => {
                return obj.Trailer == "TL" && obj.Type == "Feet";
            });

            var ltlUnits = Math.round(ltlRevenue / averageRetailPrice);
            var numberOfLoads = Math.round((ltlUnits * averagePCuFt) / (trailerSizeObj.Utilization * 0.3));
            var ltlWeight = Math.round(Math.ceil(ltlUnits / numberOfLoads) * actualAverageWeight);

            for (let i = 0; i < siteArr.length; i++) {

                for (let j = 0; j < stateArr.length; j++) {

                    var populationMultiplier = stateArr[j]["Population"] / sumPopulation;
                    var ltlLoads = Math.round(numberOfLoads * populationMultiplier);

                    var pUnit = 53.3 / (averageWeight * averagePCuFt)
                    var pWeight = Math.round(pUnit * averageWeight);

                    var weightUnitObj = null;

                    for (let k = 0; k < weightUnits.length; k++) {
                        if (weightUnits[k]["WeightNumber"] > ltlWeight) {
                            weightUnitObj = weightUnits[k];
                            break;
                        }
                    }

                    if (weightUnitObj == null) {
                        weightUnitObj = weightUnits[weightUnits.length - 1];
                    }

                    let ltlRatesObj = ltLRatesList.find(obj => {
                        return obj.SiteName == siteArr[i]["SiteName"] && obj.StateCode == stateArr[j]["StateCode"]
                    });
                    var ltlRate = ltlRatesObj ? ltlRatesObj[weightUnitObj["Name"]] : 0;
                    var ltlCost = pWeight / 100 * ltlRate * pUnit;

                    finalOutput.push({
                        siteName: siteArr[i]["SiteName"],
                        stateCode: stateArr[j]["StateCode"],
                        populationPercent: stateArr[j]["PopulationPercent"],
                        ltlRate: ltlRate,
                        ltlCost: ltlCost,
                        serviceLevel: 4,
                        numberOfLoads: numberOfLoads,
                        ltlLoads: ltlLoads,
                        totalCost: Math.round(ltlRate * ltlLoads)
                    });
                }
            }

            return finalOutput;

        } catch (err) {
            console.log(err);
        }
    }

    static async getLtlRaterExcelJson(ltlRaterMainJson) {

        var groupedLtlRaterMainJson = {
            siteWise: [],
            stateWise: []
        };
        var ltlRaterExcelJson = {
            siteWise: null,
            serviceLevelWise: null
        };

        if (ltlRaterMainJson.length > 0) {

            groupedLtlRaterMainJson["siteWise"] = treeLogicsController.groupByDataList(ltlRaterMainJson, "siteName");
            groupedLtlRaterMainJson["stateWise"] = treeLogicsController.groupByDataList(ltlRaterMainJson, "stateCode");

            ltlRaterExcelJson["siteWise"] = await treeLogicsController.getExcelJsonForLtlRaterSiteWise(groupedLtlRaterMainJson.siteWise);
            ltlRaterExcelJson["serviceLevelWise"] = await treeLogicsController.getExcelJsonForLtlRaterServiceLevelWise(groupedLtlRaterMainJson.stateWise);
        }

        return ltlRaterExcelJson;
    }

    static async getExcelJsonForLtlRaterSiteWise(ltlRaterMainJson, styleOpts = {}, userInfo = {}) {

        let siteWiseData = this.groupByDataList(ltlRaterMainJson, "siteName");
        const topThickBoarderRowArr = [];
        const leftThickBoarderColArr = [];
        const rightThickBoarderColArr = [];
        const bottomThickBoarderRowArr = [];
        const sixteenSizeFontArray = [];
        const topAndBottomBorderDashedColArray = [];
        const currencyColArr = [5, 6, 7];
        const percentageFormatColArr = [9, 10, 11, 12, 13, 14, 15];

        // Start to set Excel JSON
        const columnCount = 23;
        let mergeArr = [{
            s: {
                r: 2,
                c: 0
            },
            e: {
                r: 2,
                c: columnCount
            }
        }, ];

        let rowsCount = siteWiseData.length + 6;

        let boldRowArr = [];
        let colorRowArr = [];
        let jsonArr = [];

        let jsonLengthFromTitles;
        const type = 'LTL Rater Report';
        const titleMain = ['', 'Network', '', 'Demand', '', 'Cost Analysis', '', '', '', 'Percent Service Level Achievement', '', '', '', '', '', '', '', 'Service Level Achievement - Deliveries', '', '', '', '', '', ''];
        jsonArr.push(titleMain);
        jsonLengthFromTitles = jsonArr.length + 5;
        topThickBoarderRowArr.push(jsonArr.length + 5);
        const subTitle = ['', 'Site', 'Delivery State', 'No. of Loads', 'Loads Spread', 'Cost / Loads', 'Total Loads Cost', 'Total Scenario Cost', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day'];
        jsonArr.push(subTitle);
        const startRowForYellowColorSummary = jsonArr.length + 5;
        bottomThickBoarderRowArr.push(jsonArr.length + 5);
        rightThickBoarderColArr.push(2, 7, 15, columnCount);
        leftThickBoarderColArr.push(1, 9, 17);
        const yellowColorColArray = [];
        let firstIndex = 9,
            secondIndex = 17;
        this.setYellowColorColArr(userInfo.inputServiceLevel, firstIndex, secondIndex, yellowColorColArray);
        for (let m = 0; m < siteWiseData.length; m++) {
            const siteTotalCost = siteWiseData[m]["list"].reduce((total, obj) => obj.totalCost + total, 0);
            // const siteWiseServiceLevelDelivery = siteWiseData[m]["list"].reduce((total, obj) => obj.packageSpreed + total, 0);
            const costPerPackage = siteTotalCost / siteWiseData[m].list[0]["numberOfLoads"];
            const deliveryPercentage = (siteWiseData[m].list[0]["numberOfLoads"] / siteWiseData[m].list[0]["numberOfLoads"]) * 100;
            jsonArr.push([
                '',
                siteWiseData[m].list[0]["siteName"],
                '',
                String(siteWiseData[m].list[0]["numberOfLoads"]),
                '',
                Math.round((costPerPackage + Number.EPSILON) * 100) / 100,
                '',
                Number(siteTotalCost.toFixed(2)),
                '',
                siteWiseData[m].list[0]["serviceLevel"] == 1 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 2 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 3 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 4 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 5 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 6 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] > 6 ? (deliveryPercentage || '') : '',
                '',
                siteWiseData[m].list[0]["serviceLevel"] == 1 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 2 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 3 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 4 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 5 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 6 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] > 6 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
            ]);
        }
        const endRowForYellowColorSummary = jsonArr.length + 5;
        mergeArr.push(await this.prepareMergeRecord(jsonLengthFromTitles, 8, jsonArr.length + 5, 8));
        mergeArr.push(await this.prepareMergeRecord(jsonLengthFromTitles, 16, jsonArr.length + 5, 16));
        bottomThickBoarderRowArr.push(jsonArr.length + 5);
        jsonArr.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + 5, 0, jsonArr.length + 5, columnCount + 1))
        jsonArr.push(['', 'Scenario Details ', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + 5, 1, jsonArr.length + 5, columnCount + 1));
        const noBorderRowTitle = [jsonArr.length + 5];
        sixteenSizeFontArray.push(jsonArr.length + 5);
        jsonArr.push(titleMain);
        topThickBoarderRowArr.push(jsonArr.length + 5);
        boldRowArr.push(jsonArr.length + 5);
        const scenarioStartsFrom = jsonArr.length + 5;
        mergeArr.push(
            await this.prepareMergeRecord(jsonArr.length + 5, 1, jsonArr.length + 5, 2),
            await this.prepareMergeRecord(jsonArr.length + 5, 3, jsonArr.length + 5, 4),
            await this.prepareMergeRecord(jsonArr.length + 5, 5, jsonArr.length + 5, 7),
            await this.prepareMergeRecord(jsonArr.length + 5, 9, jsonArr.length + 5, 15),
            await this.prepareMergeRecord(jsonArr.length + 5, 17, jsonArr.length + 5, columnCount),
        )
        // Site	State	Cost / Load	No. of Loads	Loads Spread	Total Loads Cost	Total Site Cost	1 Day	2 Day	3 Day	4 Day	5 Day	6 Day	>6 Day

        const subTitleForDetail = ['', 'Site', 'Delivery State', 'No. of Loads', 'Loads Spread', 'Cost / Load', '$ By Delivery State', 'Total Scenario Cost', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day'];

        jsonArr.push(subTitleForDetail);
        const startRowForYellowColorDetail = jsonArr.length + 5;
        bottomThickBoarderRowArr.push(jsonArr.length + 5)

        for (let i = 0; i < siteWiseData.length; i++) {

            var siteTotalCost = siteWiseData[i]["list"].reduce((total, obj) => obj.totalCost + total, 0);
            let siteStartFrom = jsonArr.length + 5 + 1;
            for (let j = 0; j < siteWiseData[i].list.length; j++) {
                const deliveryPercentage = (siteWiseData[i].list[j]["ltlLoads"] / siteWiseData[i].list[j]["ltlLoads"]) * 100;
                jsonArr.push([
                    '',
                    j == 0 ? siteWiseData[i].list[j]["siteName"] : "",
                    siteWiseData[i].list[j]["stateCode"],
                    j == 0 ? String(siteWiseData[i].list[j]["numberOfLoads"]) : "",
                    String(siteWiseData[i].list[j]["ltlLoads"]),
                    siteWiseData[i].list[j]["ltlRate"],
                    siteWiseData[i].list[j]["totalCost"],
                    j == 0 ? Number(siteTotalCost.toFixed(2)) : "",
                    '',
                    siteWiseData[i].list[j]["serviceLevel"] == 1 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 2 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 3 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 4 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 5 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 6 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] > 6 ? (deliveryPercentage || '') : '',
                    '',
                    siteWiseData[i].list[j]["serviceLevel"] == 1 ? String(siteWiseData[i].list[j]["ltlLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 2 ? String(siteWiseData[i].list[j]["ltlLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 3 ? String(siteWiseData[i].list[j]["ltlLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 4 ? String(siteWiseData[i].list[j]["ltlLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 5 ? String(siteWiseData[i].list[j]["ltlLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 6 ? String(siteWiseData[i].list[j]["ltlLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] > 6 ? String(siteWiseData[i].list[j]["ltlLoads"]) : "",
                ]);
            }
            mergeArr.push(
                await this.prepareMergeRecord(siteStartFrom, 1, jsonArr.length + 5, 1),
                await this.prepareMergeRecord(siteStartFrom, 3, jsonArr.length + 5, 3),
                await this.prepareMergeRecord(siteStartFrom, 7, jsonArr.length + 5, 7)
            )
        }
        const endRowForYellowColorDetail = jsonArr.length + 5;
        mergeArr.push(
            await this.prepareMergeRecord(scenarioStartsFrom, 8, jsonArr.length + 5, 8),
            await this.prepareMergeRecord(scenarioStartsFrom, 16, jsonArr.length + 5, 16),
            await this.prepareMergeRecord(6, 0, jsonArr.length + 6, 0),
            await this.prepareMergeRecord(6, 8, jsonArr.length + 5, 8),
            await this.prepareMergeRecord(6, 16, jsonArr.length + 5, 16),
            await this.prepareMergeRecord(6, 1, 6, 2),
            await this.prepareMergeRecord(6, 3, 6, 4),
            await this.prepareMergeRecord(6, 5, 6, 7),
            await this.prepareMergeRecord(6, 9, 6, 15),
            await this.prepareMergeRecord(6, 17, 6, columnCount),
            // await this.prepareMergeRecord(6, 8, jsonArr.length + 5, 8),
        );
        boldRowArr.push(6);
        bottomThickBoarderRowArr.push(jsonArr.length + 5);
        topAndBottomBorderDashedColArray.push(8, 16);
        const getColSizeArr = await this.getColumnSizeArr(jsonArr);
        getColSizeArr[9].wch = 5;
        getColSizeArr[17].wch = 5;
        return {
            jsonArr: jsonArr,
            type,
            mergeArr: styleOpts.mergeArr || mergeArr,
            columnCount: styleOpts.columnCount || columnCount,
            rowsCount: styleOpts.rowsCount || rowsCount,
            currencyColArr: styleOpts.currencyColArr || currencyColArr,
            boldRowArr: styleOpts.boldRowArr || boldRowArr,
            colorRowArr: styleOpts.colorRowArr || colorRowArr,
            topThickBoarderRowArr: styleOpts.topThickBoarderRowArr || topThickBoarderRowArr,
            bottomThickBoarderRowArr: styleOpts.bottomThickBoarderRowArr || bottomThickBoarderRowArr,
            leftThickBoarderColArr: styleOpts.leftThickBoarderColArr || leftThickBoarderColArr,
            rightThickBoarderColArr: styleOpts.rightThickBoarderColArr || rightThickBoarderColArr,
            sixteenSizeFontArray: styleOpts.sixteenSizeFontArray || sixteenSizeFontArray,
            noBorderRowTitle: noBorderRowTitle,
            topAndBottomBorderDashedColArray: styleOpts.topAndBottomBorderDashedColArray || topAndBottomBorderDashedColArray,
            columSizeArr: styleOpts.getColSizeArr || getColSizeArr,
            percentageFormatColArr: styleOpts.percentageFormatColArr || percentageFormatColArr,
            yellowColorColArray: styleOpts.yellowColorColArray || yellowColorColArray,
            colorRowDetail: {
                startRowForYellowColorSummary,
                endRowForYellowColorSummary,
                startRowForYellowColorDetail,
                endRowForYellowColorDetail
            }
        };
    }

    static async getExcelJsonForLtlRaterServiceLevelWise(ltlRaterMainJson, styleOpts = {}) {

        let stateWiseData = treeLogicsController.groupByDataList(ltlRaterMainJson, "stateCode");
        const siteWiseRaterPkgArr = [];
        var minCostSitesArr = [];
        stateWiseData.forEach((stateItem) => {
            var minCostSite = stateItem["list"].reduce(function (prev, curr) {
                return prev.totalCost < curr.totalCost ? prev : curr;
            });
            minCostSitesArr.push(minCostSite);
        });

        let groupedMinCostSitesArr = treeLogicsController.groupByDataList(minCostSitesArr, "siteName");

        var inputSitesArr = stateWiseData[0]["list"].map(a => a.siteName);
        var groupedMinSitesArr = groupedMinCostSitesArr.map(a => a.siteName);
        var missingSitesArr = inputSitesArr.filter(x => !groupedMinSitesArr.includes(x));

        // Start to set Excel JSON
        let columnCount = 18;
        let mergeArr = [];
        let rowsCount = groupedMinCostSitesArr.length;
        let currencyColArr = [];
        let boldRowArr = [];
        let colorRowArr = [2];
        let jsonArr = [];

        let Sl1Sum = 0;
        let Sl2Sum = 0;
        let Sl3Sum = 0;
        let Sl4Sum = 0;
        let Sl5Sum = 0;
        let Sl6Sum = 0;
        let Sl7Sum = 0;
        let Sl1PkgSum = 0;
        let Sl2PkgSum = 0;
        let Sl3PkgSum = 0;
        let Sl4PkgSum = 0;
        let Sl5PkgSum = 0;
        let Sl6PkgSum = 0;
        let Sl7PkgSum = 0;

        // jsonArr.push(['Scenario', '', 'Cost ($M)', '', '', '', '', '', '', '', 'Deliveries', '', '', '', '', '', '', '']);
        // jsonArr.push(['Mode', 'Site', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total']);

        groupedMinCostSitesArr.forEach((siteItem) => {

            var groupedSlItemsArr = treeLogicsController.groupByServiceLevel(siteItem["list"]);

            let Sl1Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 1);
            let Sl2Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 2);
            let Sl3Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 3);
            let Sl4Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 4);
            let Sl5Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 5);
            let Sl6Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 6);
            let Sl7Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 7);

            let Sl1Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 1, "ltl");
            let Sl2Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 2, "ltl");
            let Sl3Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 3, "ltl");
            let Sl4Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 4, "ltl");
            let Sl5Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 5, "ltl");
            let Sl6Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 6, "ltl");
            let Sl7Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 7, "ltl");

            jsonArr.push([
                "",
                "LTL",
                siteItem["siteName"],
                Sl1Cost || "",
                Sl2Cost || "",
                Sl3Cost || "",
                Sl4Cost || "",
                Sl5Cost || "",
                Sl6Cost || "",
                Sl7Cost || "",
                (Sl1Cost + Sl2Cost + Sl3Cost + Sl4Cost + Sl5Cost + Sl6Cost + Sl7Cost),
                Sl1Pkg || "",
                Sl2Pkg || "",
                Sl3Pkg || "",
                Sl4Pkg || "",
                Sl5Pkg || "",
                Sl6Pkg || "",
                Sl7Pkg || "",
                (Sl1Pkg + Sl2Pkg + Sl3Pkg + Sl4Pkg + Sl5Pkg + Sl6Pkg + Sl7Pkg),
            ]);

            siteWiseRaterPkgArr.push({
                "siteName": siteItem["siteName"],
                "raterType": "ltl",
                "totalCost": (Sl1Cost + Sl2Cost + Sl3Cost + Sl4Cost + Sl5Cost + Sl6Cost + Sl7Cost),
                "totalPkg": (Sl1Pkg + Sl2Pkg + Sl3Pkg + Sl4Pkg + Sl5Pkg + Sl6Pkg + Sl7Pkg)
            })

            Sl1Sum += Sl1Cost;
            Sl2Sum += Sl2Cost;
            Sl3Sum += Sl3Cost;
            Sl4Sum += Sl4Cost;
            Sl5Sum += Sl5Cost;
            Sl6Sum += Sl6Cost;
            Sl7Sum += Sl7Cost;

            Sl1PkgSum += Sl1Pkg;
            Sl2PkgSum += Sl2Pkg;
            Sl3PkgSum += Sl3Pkg;
            Sl4PkgSum += Sl4Pkg;
            Sl5PkgSum += Sl5Pkg;
            Sl6PkgSum += Sl6Pkg;
            Sl7PkgSum += Sl7Pkg;
        });

        missingSitesArr.forEach((siteName) => {
            jsonArr.push(["", "LTL", siteName, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
        });

        var totalSlSum = Sl1Sum + Sl2Sum + Sl3Sum + Sl4Sum + Sl5Sum + Sl6Sum + Sl7Sum;
        var totalSlPkgSum = Sl1PkgSum + Sl2PkgSum + Sl3PkgSum + Sl4PkgSum + Sl5PkgSum + Sl6PkgSum + Sl7PkgSum;

        jsonArr.push([
            "",
            "",
            "Sub Total",
            Sl1Sum ? Sl1Sum : "",
            Sl2Sum ? Sl2Sum : "",
            Sl3Sum ? Sl3Sum : "",
            Sl4Sum ? Sl4Sum : "",
            Sl5Sum ? Sl5Sum : "",
            Sl6Sum ? Sl6Sum : "",
            Sl7Sum ? Sl7Sum : "",
            totalSlSum,
            Sl1PkgSum ? Sl1PkgSum : "",
            Sl2PkgSum ? Sl2PkgSum : "",
            Sl3PkgSum ? Sl3PkgSum : "",
            Sl4PkgSum ? Sl4PkgSum : "",
            Sl5PkgSum ? Sl5PkgSum : "",
            Sl6PkgSum ? Sl6PkgSum : "",
            Sl7PkgSum ? Sl7PkgSum : "",
            totalSlPkgSum
        ]);

        jsonArr.push([
            "",
            "",
            "% of Total",
            treeLogicsController.getPercentageWithoutZero(Sl1Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl2Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl3Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl4Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl5Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl6Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl7Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(totalSlSum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl1PkgSum, totalSlPkgSum),
            treeLogicsController.getPercentageWithoutZero(Sl2PkgSum, totalSlPkgSum),
            treeLogicsController.getPercentageWithoutZero(Sl3PkgSum, totalSlPkgSum),
            treeLogicsController.getPercentageWithoutZero(Sl4PkgSum, totalSlPkgSum),
            treeLogicsController.getPercentageWithoutZero(Sl5PkgSum, totalSlPkgSum),
            treeLogicsController.getPercentageWithoutZero(Sl6PkgSum, totalSlPkgSum),
            treeLogicsController.getPercentageWithoutZero(Sl7PkgSum, totalSlPkgSum),
            treeLogicsController.getPercentageWithoutZero(totalSlPkgSum, totalSlPkgSum),
        ]);

        return {
            jsonArr: jsonArr,
            siteWiseRaterPkgArr: siteWiseRaterPkgArr,
            mergeArr: styleOpts.mergeArr || mergeArr,
            columnCount: styleOpts.columnCount || columnCount,
            rowsCount: styleOpts.rowsCount || rowsCount,
            currencyColArr: styleOpts.currencyColArr || currencyColArr,
            boldRowArr: styleOpts.boldRowArr || boldRowArr,
            colorRowArr: styleOpts.colorRowArr || colorRowArr,
        };
    }

    //================================ TL Rater Process ======================================

    static async getTlRaterMainDataJson(
        tlRevenue,
        sumPopulation,
        averageRetailPrice,
        averagePCuFt,
        siteArr,
        stateArr,
        trailerSizesList,
        mileageList
    ) {
        try {

            var finalOutput = [];

            let trailerSizeObj = trailerSizesList.find(obj => {
                return obj.Trailer == "TL" && obj.Type == "Feet";
            });

            var tlUnits = Math.round(tlRevenue / averageRetailPrice);
            var numberOfLoads = Math.round((tlUnits * averagePCuFt) / trailerSizeObj.Utilization);

            for (let i = 0; i < siteArr.length; i++) {

                for (let j = 0; j < stateArr.length; j++) {

                    var populationMultiplier = stateArr[j]["Population"] / sumPopulation;
                    var tlLoads = Math.round(numberOfLoads * populationMultiplier);

                    let mileageObj = mileageList.find(obj => {
                        return obj.SiteName == siteArr[i]["SiteName"] && obj.StateCode == stateArr[j]["StateCode"]
                    });
                    let distance = mileageObj ? mileageObj.Mileage : 0;
                    let tlServiceLevel = Math.round(distance / 600);
                    let tlCost = Math.round(distance * 2.25);

                    if (tlServiceLevel > 0) {
                        finalOutput.push({
                            siteName: siteArr[i]["SiteName"],
                            stateCode: stateArr[j]["StateCode"],
                            populationPercent: stateArr[j]["PopulationPercent"],
                            serviceLevel: tlServiceLevel,
                            tlCost: tlCost,
                            numberOfLoads: numberOfLoads,
                            tlLoads: tlLoads,
                            totalCost: tlCost * tlLoads,
                        });
                    }
                }
            }

            return finalOutput;

        } catch (err) {
            console.log(err);
        }
    }

    static async getTlRaterExcelJson(tlRaterMainJson) {

        var groupedTlRaterMainJson = {
            siteWise: [],
            stateWise: []
        };
        var tlRaterExcelJson = {
            siteWise: null,
            serviceLevelWise: null
        };

        if (tlRaterMainJson.length > 0) {

            groupedTlRaterMainJson["siteWise"] = treeLogicsController.groupByDataList(tlRaterMainJson, "siteName");
            groupedTlRaterMainJson["stateWise"] = treeLogicsController.groupByDataList(tlRaterMainJson, "stateCode");

            tlRaterExcelJson["siteWise"] = await treeLogicsController.getExcelJsonForTlRaterSiteWise(groupedTlRaterMainJson.siteWise);
            tlRaterExcelJson["serviceLevelWise"] = await treeLogicsController.getExcelJsonForTlRaterServiceLevelWise(groupedTlRaterMainJson.stateWise);
        }

        return tlRaterExcelJson;
    }

    static async getExcelJsonForTlRaterSiteWise(tlRaterMainJson, styleOpts = {}, userInfo = {}) {

        let siteWiseData = this.groupByDataList(tlRaterMainJson, "siteName");
        const topThickBoarderRowArr = [];
        const leftThickBoarderColArr = [];
        const rightThickBoarderColArr = [];
        const bottomThickBoarderRowArr = [];
        const sixteenSizeFontArray = [];
        const topAndBottomBorderDashedColArray = [];
        const currencyColArr = [5, 6, 7];
        const percentageFormatColArr = [9, 10, 11, 12, 13, 14, 15];

        // Start to set Excel JSON
        const columnCount = 23;
        let mergeArr = [{
            s: {
                r: 2,
                c: 0
            },
            e: {
                r: 2,
                c: columnCount
            }
        }, ];

        let rowsCount = siteWiseData.length + 6;

        let boldRowArr = [];
        let colorRowArr = [];
        let jsonArr = [];

        let jsonLengthFromTitles;
        const type = 'TL Rater Report';
        const titleMain = ['', 'Network', '', 'Demand', '', 'Cost Analysis', '', '', '', 'Percent Service Level Achievement', '', '', '', '', '', '', '', 'Service Level Achievement - Deliveries', '', '', '', '', '', ''];
        jsonArr.push(titleMain);
        jsonLengthFromTitles = jsonArr.length + 5;
        topThickBoarderRowArr.push(jsonArr.length + 5);
        const subTitle = ['', 'Site', 'Delivery State', 'No. of Loads', 'Loads Spread', 'Cost / Loads', 'Total Loads Cost', 'Total Scenario Cost', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day'];
        jsonArr.push(subTitle);
        const startRowForYellowColorSummary = jsonArr.length + 5;
        bottomThickBoarderRowArr.push(jsonArr.length + 5);
        rightThickBoarderColArr.push(2, 7, 15, columnCount);
        leftThickBoarderColArr.push(1, 9, 17);
        const yellowColorColArray = [];
        let firstIndex = 9,
            secondIndex = 17;
        this.setYellowColorColArr(userInfo.inputServiceLevel, firstIndex, secondIndex, yellowColorColArray);
        for (let m = 0; m < siteWiseData.length; m++) {
            const siteTotalCost = siteWiseData[m]["list"].reduce((total, obj) => obj.totalCost + total, 0);
            const costPerPackage = siteTotalCost / siteWiseData[m].list[0]["numberOfLoads"];
            const deliveryPercentage = (siteWiseData[m].list[0]["numberOfLoads"] / siteWiseData[m].list[0]["numberOfLoads"]) * 100;

            jsonArr.push([
                '',
                siteWiseData[m].list[0]["siteName"],
                '',
                String(siteWiseData[m].list[0]["numberOfLoads"]),
                '',
                Math.round((costPerPackage + Number.EPSILON) * 100) / 100,
                '',
                Number(siteTotalCost.toFixed(2)),
                '',
                siteWiseData[m].list[0]["serviceLevel"] == 1 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 2 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 3 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 4 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 5 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 6 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] > 6 ? (deliveryPercentage || '') : '',
                '',
                siteWiseData[m].list[0]["serviceLevel"] == 1 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 2 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 3 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 4 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 5 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 6 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] > 6 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
            ]);
        }
        const endRowForYellowColorSummary = jsonArr.length + 5;
        mergeArr.push(await this.prepareMergeRecord(jsonLengthFromTitles, 8, jsonArr.length + 5, 8));
        mergeArr.push(await this.prepareMergeRecord(jsonLengthFromTitles, 16, jsonArr.length + 5, 16));
        bottomThickBoarderRowArr.push(jsonArr.length + 5);
        jsonArr.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + 5, 0, jsonArr.length + 5, columnCount + 1))
        jsonArr.push(['', 'Scenario Details ', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + 5, 1, jsonArr.length + 5, columnCount + 1));
        const noBorderRowTitle = [jsonArr.length + 5];
        sixteenSizeFontArray.push(jsonArr.length + 5);
        jsonArr.push(titleMain);
        topThickBoarderRowArr.push(jsonArr.length + 5);
        boldRowArr.push(jsonArr.length + 5);
        const scenarioStartsFrom = jsonArr.length + 5;
        mergeArr.push(
            await this.prepareMergeRecord(jsonArr.length + 5, 1, jsonArr.length + 5, 2),
            await this.prepareMergeRecord(jsonArr.length + 5, 3, jsonArr.length + 5, 4),
            await this.prepareMergeRecord(jsonArr.length + 5, 5, jsonArr.length + 5, 7),
            await this.prepareMergeRecord(jsonArr.length + 5, 9, jsonArr.length + 5, 15),
            await this.prepareMergeRecord(jsonArr.length + 5, 17, jsonArr.length + 5, columnCount),
        )
        const subTitleForDetail = ['', 'Site', 'Delivery State', 'No. of Loads', 'Loads Spread', 'Cost / Load', '$ By Delivery State', 'Total Scenario Cost', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day'];
        jsonArr.push(subTitleForDetail);
        const startRowForYellowColorDetail = jsonArr.length + 5;
        bottomThickBoarderRowArr.push(jsonArr.length + 5)

        for (let i = 0; i < siteWiseData.length; i++) {

            var siteTotalCost = siteWiseData[i]["list"].reduce((total, obj) => obj.totalCost + total, 0);
            let siteStartFrom = jsonArr.length + 5 + 1;
            for (let j = 0; j < siteWiseData[i].list.length; j++) {
                const deliveryPercentage = siteWiseData[i].list[j]["tlLoads"] ? ((siteWiseData[i].list[j]["tlLoads"] / siteWiseData[i].list[j]["tlLoads"]) * 100) : '';
                jsonArr.push([
                    '',
                    j == 0 ? siteWiseData[i].list[j]["siteName"] : "",
                    siteWiseData[i].list[j]["stateCode"],
                    j == 0 ? String(siteWiseData[i].list[j]["numberOfLoads"]) : "",
                    String(siteWiseData[i].list[j]["tlLoads"]),
                    siteWiseData[i].list[j]["tlCost"],
                    siteWiseData[i].list[j]["totalCost"],
                    j == 0 ? Number(siteTotalCost.toFixed(2)) : "",
                    '',
                    siteWiseData[i].list[j]["serviceLevel"] == 1 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 2 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 3 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 4 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 5 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 6 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] > 6 ? (deliveryPercentage || '') : '',
                    '',
                    siteWiseData[i].list[j]["serviceLevel"] == 1 ? String(siteWiseData[i].list[j]["tlLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 2 ? String(siteWiseData[i].list[j]["tlLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 3 ? String(siteWiseData[i].list[j]["tlLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 4 ? String(siteWiseData[i].list[j]["tlLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 5 ? String(siteWiseData[i].list[j]["tlLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 6 ? String(siteWiseData[i].list[j]["tlLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] > 6 ? String(siteWiseData[i].list[j]["tlLoads"]) : "",
                ]);
            }
            mergeArr.push(
                await this.prepareMergeRecord(siteStartFrom, 1, jsonArr.length + 5, 1),
                await this.prepareMergeRecord(siteStartFrom, 3, jsonArr.length + 5, 3),
                await this.prepareMergeRecord(siteStartFrom, 7, jsonArr.length + 5, 7)
            )
        }
        const endRowForYellowColorDetail = jsonArr.length + 5;
        mergeArr.push(
            await this.prepareMergeRecord(scenarioStartsFrom, 8, jsonArr.length + 5, 8),
            await this.prepareMergeRecord(scenarioStartsFrom, 16, jsonArr.length + 5, 16),
            await this.prepareMergeRecord(6, 0, jsonArr.length + 6, 0),
            await this.prepareMergeRecord(6, 8, jsonArr.length + 5, 8),
            await this.prepareMergeRecord(6, 16, jsonArr.length + 5, 16),
            await this.prepareMergeRecord(6, 1, 6, 2),
            await this.prepareMergeRecord(6, 3, 6, 4),
            await this.prepareMergeRecord(6, 5, 6, 7),
            await this.prepareMergeRecord(6, 9, 6, 15),
            await this.prepareMergeRecord(6, 17, 6, columnCount),
            // await this.prepareMergeRecord(6, 8, jsonArr.length + 5, 8),
        );
        boldRowArr.push(6);
        bottomThickBoarderRowArr.push(jsonArr.length + 5);
        topAndBottomBorderDashedColArray.push(8, 16);
        const getColSizeArr = await this.getColumnSizeArr(jsonArr);
        getColSizeArr[9].wch = 5;
        getColSizeArr[17].wch = 5;
        return {
            jsonArr: jsonArr,
            type,
            mergeArr: styleOpts.mergeArr || mergeArr,
            columnCount: styleOpts.columnCount || columnCount,
            rowsCount: styleOpts.rowsCount || rowsCount,
            currencyColArr: styleOpts.currencyColArr || currencyColArr,
            boldRowArr: styleOpts.boldRowArr || boldRowArr,
            colorRowArr: styleOpts.colorRowArr || colorRowArr,
            topThickBoarderRowArr: styleOpts.topThickBoarderRowArr || topThickBoarderRowArr,
            bottomThickBoarderRowArr: styleOpts.bottomThickBoarderRowArr || bottomThickBoarderRowArr,
            leftThickBoarderColArr: styleOpts.leftThickBoarderColArr || leftThickBoarderColArr,
            rightThickBoarderColArr: styleOpts.rightThickBoarderColArr || rightThickBoarderColArr,
            sixteenSizeFontArray: styleOpts.sixteenSizeFontArray || sixteenSizeFontArray,
            noBorderRowTitle: noBorderRowTitle,
            topAndBottomBorderDashedColArray: styleOpts.topAndBottomBorderDashedColArray || topAndBottomBorderDashedColArray,
            columSizeArr: styleOpts.getColSizeArr || getColSizeArr,
            percentageFormatColArr: styleOpts.percentageFormatColArr || percentageFormatColArr,
            yellowColorColArray: styleOpts.yellowColorColArray || yellowColorColArray,
            colorRowDetail: {
                startRowForYellowColorSummary,
                endRowForYellowColorSummary,
                startRowForYellowColorDetail,
                endRowForYellowColorDetail
            }
        };
    }

    static async getExcelJsonForTlRaterServiceLevelWise(tlRaterMainJson, styleOpts = {}) {

        let stateWiseData = this.groupByDataList(tlRaterMainJson, "stateCode");
        const siteWiseRaterPkgArr = [];
        var minCostSitesArr = [];
        stateWiseData.forEach((stateItem) => {
            var minCostSite = stateItem["list"].reduce(function (prev, curr) {
                return prev.totalCost < curr.totalCost ? prev : curr;
            });
            minCostSitesArr.push(minCostSite);
        });

        let groupedMinCostSitesArr = this.groupByDataList(minCostSitesArr, "siteName");

        var inputSitesArr = stateWiseData[0]["list"].map(a => a.siteName);
        var groupedMinSitesArr = groupedMinCostSitesArr.map(a => a.siteName);
        var missingSitesArr = inputSitesArr.filter(x => !groupedMinSitesArr.includes(x));

        // Start to set Excel JSON
        let columnCount = 18;
        let mergeArr = [];
        let rowsCount = groupedMinCostSitesArr.length;
        let currencyColArr = [];
        let boldRowArr = [];
        let colorRowArr = [2];
        let jsonArr = [];

        let Sl1Sum = 0;
        let Sl2Sum = 0;
        let Sl3Sum = 0;
        let Sl4Sum = 0;
        let Sl5Sum = 0;
        let Sl6Sum = 0;
        let Sl7Sum = 0;
        let Sl1PkgSum = 0;
        let Sl2PkgSum = 0;
        let Sl3PkgSum = 0;
        let Sl4PkgSum = 0;
        let Sl5PkgSum = 0;
        let Sl6PkgSum = 0;
        let Sl7PkgSum = 0;

        groupedMinCostSitesArr.forEach((siteItem) => {

            var groupedSlItemsArr = this.groupByServiceLevel(siteItem["list"]);

            let Sl1Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 1);
            let Sl2Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 2);
            let Sl3Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 3);
            let Sl4Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 4);
            let Sl5Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 5);
            let Sl6Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 6);
            let Sl7Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 7);

            let Sl1Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 1, "tl");
            let Sl2Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 2, "tl");
            let Sl3Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 3, "tl");
            let Sl4Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 4, "tl");
            let Sl5Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 5, "tl");
            let Sl6Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 6, "tl");
            let Sl7Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 7, "tl");

            jsonArr.push([
                "",
                "TL",
                siteItem["siteName"],
                Sl1Cost || "",
                Sl2Cost || "",
                Sl3Cost || "",
                Sl4Cost || "",
                Sl5Cost || "",
                Sl6Cost || "",
                Sl7Cost || "",
                (Sl1Cost + Sl2Cost + Sl3Cost + Sl4Cost + Sl5Cost + Sl6Cost + Sl7Cost),
                Sl1Pkg || "",
                Sl2Pkg || "",
                Sl3Pkg || "",
                Sl4Pkg || "",
                Sl5Pkg || "",
                Sl6Pkg || "",
                Sl7Pkg || "",
                (Sl1Pkg + Sl2Pkg + Sl3Pkg + Sl4Pkg + Sl5Pkg + Sl6Pkg + Sl7Pkg),
            ]);
            siteWiseRaterPkgArr.push({
                "siteName": siteItem["siteName"],
                "raterType": "tl",
                "totalCost": (Sl1Cost + Sl2Cost + Sl3Cost + Sl4Cost + Sl5Cost + Sl6Cost + Sl7Cost),
                "totalPkg": (Sl1Pkg + Sl2Pkg + Sl3Pkg + Sl4Pkg + Sl5Pkg + Sl6Pkg + Sl7Pkg)
            })
            Sl1Sum += Sl1Cost;
            Sl2Sum += Sl2Cost;
            Sl3Sum += Sl3Cost;
            Sl4Sum += Sl4Cost;
            Sl5Sum += Sl5Cost;
            Sl6Sum += Sl6Cost;
            Sl7Sum += Sl7Cost;

            Sl1PkgSum += Sl1Pkg;
            Sl2PkgSum += Sl2Pkg;
            Sl3PkgSum += Sl3Pkg;
            Sl4PkgSum += Sl4Pkg;
            Sl5PkgSum += Sl5Pkg;
            Sl6PkgSum += Sl6Pkg;
            Sl7PkgSum += Sl7Pkg;
        });

        missingSitesArr.forEach((siteName) => {
            jsonArr.push(["", "TL", siteName, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
        });

        var totalSlSum = Sl1Sum + Sl2Sum + Sl3Sum + Sl4Sum + Sl5Sum + Sl6Sum + Sl7Sum;
        var totalSlPkgSum = Sl1PkgSum + Sl2PkgSum + Sl3PkgSum + Sl4PkgSum + Sl5PkgSum + Sl6PkgSum + Sl7PkgSum;

        jsonArr.push([
            "", "",
            "Sub Total",
            Sl1Sum ? Sl1Sum : "",
            Sl2Sum ? Sl2Sum : "",
            Sl3Sum ? Sl3Sum : "",
            Sl4Sum ? Sl4Sum : "",
            Sl5Sum ? Sl5Sum : "",
            Sl6Sum ? Sl6Sum : "",
            Sl7Sum ? Sl7Sum : "",
            totalSlSum,
            Sl1PkgSum ? Sl1PkgSum : "",
            Sl2PkgSum ? Sl2PkgSum : "",
            Sl3PkgSum ? Sl3PkgSum : "",
            Sl4PkgSum ? Sl4PkgSum : "",
            Sl5PkgSum ? Sl5PkgSum : "",
            Sl6PkgSum ? Sl6PkgSum : "",
            Sl7PkgSum ? Sl7PkgSum : "",
            totalSlPkgSum
        ]);

        jsonArr.push([
            "", "",
            "% of Total",
            this.getPercentageWithoutZero(Sl1Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl2Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl3Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl4Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl5Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl6Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl7Sum, totalSlSum),
            this.getPercentageWithoutZero(totalSlSum, totalSlSum),
            this.getPercentageWithoutZero(Sl1PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl2PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl3PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl4PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl5PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl6PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl7PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(totalSlPkgSum, totalSlPkgSum),
        ]);

        return {
            jsonArr: jsonArr,
            siteWiseRaterPkgArr: siteWiseRaterPkgArr,
            mergeArr: styleOpts.mergeArr || mergeArr,
            columnCount: styleOpts.columnCount || columnCount,
            rowsCount: styleOpts.rowsCount || rowsCount,
            currencyColArr: styleOpts.currencyColArr || currencyColArr,
            boldRowArr: styleOpts.boldRowArr || boldRowArr,
            colorRowArr: styleOpts.colorRowArr || colorRowArr,
        };
    }

    //================================ Fleet Rater Process ======================================

    static async getFleetRaterMainDataJson(
        fleetRevenue,
        sumPopulation,
        averageRetailPrice,
        averagePCuFt,
        siteArr,
        stateArr,
        trailerSizesList,
        mileageList
    ) {
        try {

            var finalOutput = [];

            let trailerSizeObj = trailerSizesList.find(obj => {
                return obj.Trailer == "Box Truck" && obj.Type == "Feet";
            });

            var fleetUnits = Math.round(fleetRevenue / averageRetailPrice);
            var numberOfLoads = Math.round((fleetUnits * averagePCuFt) / trailerSizeObj.Utilization);

            for (let i = 0; i < siteArr.length; i++) {

                for (let j = 0; j < stateArr.length; j++) {

                    var populationMultiplier = stateArr[j]["Population"] / sumPopulation;
                    var fleetLoads = Math.round(numberOfLoads * populationMultiplier);

                    let mileageObj = mileageList.find(obj => {
                        return obj.SiteName == siteArr[i]["SiteName"] && obj.StateCode == stateArr[j]["StateCode"]
                    });
                    let distance = mileageObj ? mileageObj.Mileage : 0;
                    let fleetServiceLevel = Math.round(distance / 250);
                    let fleetCost = (distance * 1.75 * 2);

                    if (fleetServiceLevel > 0) {
                        finalOutput.push({
                            siteName: siteArr[i]["SiteName"],
                            stateCode: stateArr[j]["StateCode"],
                            populationPercent: stateArr[j]["PopulationPercent"],
                            serviceLevel: fleetServiceLevel,
                            fleetCost: fleetCost,
                            numberOfLoads: numberOfLoads,
                            fleetLoads: fleetLoads,
                            totalCost: fleetCost * fleetLoads,
                        });
                    }
                }
            }

            return finalOutput;

        } catch (err) {
            console.log(err);
        }
    }

    static async getFleetRaterExcelJson(fleetRaterMainJson) {

        var groupedFleetRaterMainJson = {
            siteWise: [],
            stateWise: []
        };
        var fleetRaterExcelJson = {
            siteWise: null,
            serviceLevelWise: null
        };

        if (fleetRaterMainJson.length > 0) {

            groupedFleetRaterMainJson["siteWise"] = treeLogicsController.groupByDataList(fleetRaterMainJson, "siteName");
            groupedFleetRaterMainJson["stateWise"] = treeLogicsController.groupByDataList(fleetRaterMainJson, "stateCode");

            fleetRaterExcelJson["siteWise"] = await treeLogicsController.getExcelJsonForFleetRaterSiteWise(groupedFleetRaterMainJson.siteWise);
            fleetRaterExcelJson["serviceLevelWise"] = await treeLogicsController.getExcelJsonForFleetRaterServiceLevelWise(groupedFleetRaterMainJson.stateWise);
        }

        return fleetRaterExcelJson;
    }

    static async getExcelJsonForFleetRaterSiteWise(fleetRaterMainJson, styleOpts = {}, userInfo = {}) {

        let siteWiseData = this.groupByDataList(fleetRaterMainJson, "siteName");
        const topThickBoarderRowArr = [];
        const leftThickBoarderColArr = [];
        const rightThickBoarderColArr = [];
        const bottomThickBoarderRowArr = [];
        const sixteenSizeFontArray = [];
        const topAndBottomBorderDashedColArray = [];
        const currencyColArr = [5, 6, 7];
        const percentageFormatColArr = [9, 10, 11, 12, 13, 14, 15];

        // Start to set Excel JSON
        const columnCount = 23;
        let mergeArr = [{
            s: {
                r: 2,
                c: 0
            },
            e: {
                r: 2,
                c: columnCount
            }
        }, ];

        let rowsCount = siteWiseData.length + 6;

        let boldRowArr = [];
        let colorRowArr = [];
        let jsonArr = [];

        let jsonLengthFromTitles;
        const type = 'Private Fleet Rater Report';
        const titleMain = ['', 'Network', '', 'Demand', '', 'Cost Analysis', '', '', '', 'Percent Service Level Achievement', '', '', '', '', '', '', '', 'Service Level Achievement - Deliveries', '', '', '', '', '', ''];
        jsonArr.push(titleMain);
        jsonLengthFromTitles = jsonArr.length + 5;
        topThickBoarderRowArr.push(jsonArr.length + 5);
        const subTitle = ['', 'Site', 'Delivery State', 'No. of Loads', 'Loads Spread', 'Cost / Loads', 'Total Loads Cost', 'Total Scenario Cost', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day'];
        jsonArr.push(subTitle);
        const startRowForYellowColorSummary = jsonArr.length + 5;
        bottomThickBoarderRowArr.push(jsonArr.length + 5);
        rightThickBoarderColArr.push(2, 7, 15, columnCount);
        leftThickBoarderColArr.push(1, 9, 17);
        const yellowColorColArray = [];
        let firstIndex = 9,
            secondIndex = 17;
        this.setYellowColorColArr(userInfo.inputServiceLevel, firstIndex, secondIndex, yellowColorColArray);
        for (let m = 0; m < siteWiseData.length; m++) {
            const siteTotalCost = siteWiseData[m]["list"].reduce((total, obj) => obj.totalCost + total, 0);
            // const siteWiseServiceLevelDelivery = siteWiseData[m]["list"].reduce((total, obj) => obj.packageSpreed + total, 0);
            const costPerPackage = siteTotalCost / siteWiseData[m].list[0]["numberOfLoads"];
            const deliveryPercentage = (siteWiseData[m].list[0]["numberOfLoads"] / siteWiseData[m].list[0]["numberOfLoads"]) * 100;
            jsonArr.push([
                '',
                siteWiseData[m].list[0]["siteName"],
                '',
                String(siteWiseData[m].list[0]["numberOfLoads"]),
                '',
                Math.round((costPerPackage + Number.EPSILON) * 100) / 100,
                '',
                Number(siteTotalCost.toFixed(2)),
                '',
                siteWiseData[m].list[0]["serviceLevel"] == 1 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 2 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 3 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 4 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 5 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] == 6 ? (deliveryPercentage || '') : '',
                siteWiseData[m].list[0]["serviceLevel"] > 6 ? (deliveryPercentage || '') : '',
                '',
                siteWiseData[m].list[0]["serviceLevel"] == 1 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 2 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 3 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 4 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 5 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] == 6 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
                siteWiseData[m].list[0]["serviceLevel"] > 6 ? String(siteWiseData[m].list[0]["numberOfLoads"]) : "",
            ]);
        }
        const endRowForYellowColorSummary = jsonArr.length + 5;
        mergeArr.push(await this.prepareMergeRecord(jsonLengthFromTitles, 8, jsonArr.length + 5, 8));
        mergeArr.push(await this.prepareMergeRecord(jsonLengthFromTitles, 16, jsonArr.length + 5, 16));
        bottomThickBoarderRowArr.push(jsonArr.length + 5);
        jsonArr.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + 5, 0, jsonArr.length + 5, columnCount + 1))
        jsonArr.push(['', 'Scenario Details ', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + 5, 1, jsonArr.length + 5, columnCount + 1));
        const noBorderRowTitle = [jsonArr.length + 5];
        sixteenSizeFontArray.push(jsonArr.length + 5);
        jsonArr.push(titleMain);
        topThickBoarderRowArr.push(jsonArr.length + 5);
        boldRowArr.push(jsonArr.length + 5);
        const scenarioStartsFrom = jsonArr.length + 5;
        mergeArr.push(
            await this.prepareMergeRecord(jsonArr.length + 5, 1, jsonArr.length + 5, 2),
            await this.prepareMergeRecord(jsonArr.length + 5, 3, jsonArr.length + 5, 4),
            await this.prepareMergeRecord(jsonArr.length + 5, 5, jsonArr.length + 5, 7),
            await this.prepareMergeRecord(jsonArr.length + 5, 9, jsonArr.length + 5, 15),
            await this.prepareMergeRecord(jsonArr.length + 5, 17, jsonArr.length + 5, columnCount),
        )
        const subTitleForDetail = ['', 'Site', 'Delivery State', 'No. of Loads', 'Loads Spread', 'Cost / Load', '$ By Delivery State', 'Total Scenario Cost', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day'];

        jsonArr.push(subTitleForDetail);
        const startRowForYellowColorDetail = jsonArr.length + 5;
        bottomThickBoarderRowArr.push(jsonArr.length + 5)

        for (let i = 0; i < siteWiseData.length; i++) {

            var siteTotalCost = siteWiseData[i]["list"].reduce((total, obj) => obj.totalCost + total, 0);
            let siteStartFrom = jsonArr.length + 5 + 1;
            for (let j = 0; j < siteWiseData[i].list.length; j++) {
                const deliveryPercentage = (siteWiseData[i].list[j]["fleetLoads"] / siteWiseData[i].list[j]["fleetLoads"]) * 100;
                jsonArr.push([
                    '',
                    j == 0 ? siteWiseData[i].list[j]["siteName"] : "",
                    siteWiseData[i].list[j]["stateCode"],
                    j == 0 ? String(siteWiseData[i].list[j]["numberOfLoads"]) : "",
                    String(siteWiseData[i].list[j]["fleetLoads"]),
                    siteWiseData[i].list[j]["fleetCost"],
                    siteWiseData[i].list[j]["totalCost"],
                    j == 0 ? Number(siteTotalCost.toFixed(2)) : "",
                    '',
                    siteWiseData[i].list[j]["serviceLevel"] == 1 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 2 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 3 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 4 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 5 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] == 6 ? (deliveryPercentage || '') : '',
                    siteWiseData[i].list[j]["serviceLevel"] > 6 ? (deliveryPercentage || '') : '',
                    '',
                    siteWiseData[i].list[j]["serviceLevel"] == 1 ? String(siteWiseData[i].list[j]["fleetLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 2 ? String(siteWiseData[i].list[j]["fleetLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 3 ? String(siteWiseData[i].list[j]["fleetLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 4 ? String(siteWiseData[i].list[j]["fleetLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 5 ? String(siteWiseData[i].list[j]["fleetLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 6 ? String(siteWiseData[i].list[j]["fleetLoads"]) : "",
                    siteWiseData[i].list[j]["serviceLevel"] > 6 ? String(siteWiseData[i].list[j]["fleetLoads"]) : "",
                ]);
            }
            mergeArr.push(
                await this.prepareMergeRecord(siteStartFrom, 1, jsonArr.length + 5, 1),
                await this.prepareMergeRecord(siteStartFrom, 3, jsonArr.length + 5, 3),
                await this.prepareMergeRecord(siteStartFrom, 7, jsonArr.length + 5, 7)
            )
        }
        const endRowForYellowColorDetail = jsonArr.length + 5;
        mergeArr.push(
            await this.prepareMergeRecord(scenarioStartsFrom, 8, jsonArr.length + 5, 8),
            await this.prepareMergeRecord(scenarioStartsFrom, 16, jsonArr.length + 5, 16),
            await this.prepareMergeRecord(6, 0, jsonArr.length + 6, 0),
            await this.prepareMergeRecord(6, 8, jsonArr.length + 5, 8),
            await this.prepareMergeRecord(6, 16, jsonArr.length + 5, 16),
            await this.prepareMergeRecord(6, 1, 6, 2),
            await this.prepareMergeRecord(6, 3, 6, 4),
            await this.prepareMergeRecord(6, 5, 6, 7),
            await this.prepareMergeRecord(6, 9, 6, 15),
            await this.prepareMergeRecord(6, 17, 6, columnCount),
            // await this.prepareMergeRecord(6, 8, jsonArr.length + 5, 8),
        );
        boldRowArr.push(6);
        bottomThickBoarderRowArr.push(jsonArr.length + 5);
        topAndBottomBorderDashedColArray.push(8, 16);
        const getColSizeArr = await this.getColumnSizeArr(jsonArr);
        getColSizeArr[9].wch = 5;
        getColSizeArr[17].wch = 5;
        return {
            jsonArr: jsonArr,
            type,
            mergeArr: styleOpts.mergeArr || mergeArr,
            columnCount: styleOpts.columnCount || columnCount,
            rowsCount: styleOpts.rowsCount || rowsCount,
            currencyColArr: styleOpts.currencyColArr || currencyColArr,
            boldRowArr: styleOpts.boldRowArr || boldRowArr,
            colorRowArr: styleOpts.colorRowArr || colorRowArr,
            topThickBoarderRowArr: styleOpts.topThickBoarderRowArr || topThickBoarderRowArr,
            bottomThickBoarderRowArr: styleOpts.bottomThickBoarderRowArr || bottomThickBoarderRowArr,
            leftThickBoarderColArr: styleOpts.leftThickBoarderColArr || leftThickBoarderColArr,
            rightThickBoarderColArr: styleOpts.rightThickBoarderColArr || rightThickBoarderColArr,
            sixteenSizeFontArray: styleOpts.sixteenSizeFontArray || sixteenSizeFontArray,
            noBorderRowTitle: noBorderRowTitle,
            topAndBottomBorderDashedColArray: styleOpts.topAndBottomBorderDashedColArray || topAndBottomBorderDashedColArray,
            columSizeArr: styleOpts.getColSizeArr || getColSizeArr,
            percentageFormatColArr: styleOpts.percentageFormatColArr || percentageFormatColArr,
            yellowColorColArray: styleOpts.yellowColorColArray || yellowColorColArray,
            colorRowDetail: {
                startRowForYellowColorSummary,
                endRowForYellowColorSummary,
                startRowForYellowColorDetail,
                endRowForYellowColorDetail
            }
        };
    }

    static async getExcelJsonForFleetRaterServiceLevelWise(fleetRaterMainJson, styleOpts = {}) {

        let stateWiseData = this.groupByDataList(fleetRaterMainJson, "stateCode");

        var minCostSitesArr = [];
        stateWiseData.forEach((stateItem) => {
            var minCostSite = stateItem["list"].reduce(function (prev, curr) {
                return prev.totalCost < curr.totalCost ? prev : curr;
            });
            minCostSitesArr.push(minCostSite);
        });

        let groupedMinCostSitesArr = this.groupByDataList(minCostSitesArr, "siteName");
        const siteWiseRaterPkgArr = [];
        var inputSitesArr = stateWiseData[0]["list"].map(a => a.siteName);
        var groupedMinSitesArr = groupedMinCostSitesArr.map(a => a.siteName);
        var missingSitesArr = inputSitesArr.filter(x => !groupedMinSitesArr.includes(x));

        // Start to set Excel JSON
        let columnCount = 18;
        let mergeArr = [];
        let rowsCount = groupedMinCostSitesArr.length;
        let currencyColArr = [];
        let boldRowArr = [];
        let colorRowArr = [2];
        let jsonArr = [];

        let Sl1Sum = 0;
        let Sl2Sum = 0;
        let Sl3Sum = 0;
        let Sl4Sum = 0;
        let Sl5Sum = 0;
        let Sl6Sum = 0;
        let Sl7Sum = 0;
        let Sl1PkgSum = 0;
        let Sl2PkgSum = 0;
        let Sl3PkgSum = 0;
        let Sl4PkgSum = 0;
        let Sl5PkgSum = 0;
        let Sl6PkgSum = 0;
        let Sl7PkgSum = 0;

        // jsonArr.push(['Scenario', '', 'Cost ($M)', '', '', '', '', '', '', '', 'Deliveries', '', '', '', '', '', '', '']);
        // jsonArr.push(['Mode', 'Site', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total']);

        groupedMinCostSitesArr.forEach((siteItem) => {

            var groupedSlItemsArr = this.groupByServiceLevel(siteItem["list"]);

            let Sl1Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 1);
            let Sl2Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 2);
            let Sl3Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 3);
            let Sl4Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 4);
            let Sl5Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 5);
            let Sl6Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 6);
            let Sl7Cost = this.getTotalCostServiceLevelWise(groupedSlItemsArr, 7);

            let Sl1Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 1, "fleet");
            let Sl2Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 2, "fleet");
            let Sl3Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 3, "fleet");
            let Sl4Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 4, "fleet");
            let Sl5Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 5, "fleet");
            let Sl6Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 6, "fleet");
            let Sl7Pkg = this.getTotalPkgServiceLevelWise(groupedSlItemsArr, 7, "fleet");

            jsonArr.push([
                '',
                "Fleet",
                siteItem["siteName"],
                Sl1Cost || "",
                Sl2Cost || "",
                Sl3Cost || "",
                Sl4Cost || "",
                Sl5Cost || "",
                Sl6Cost || "",
                Sl7Cost || "",
                (Sl1Cost + Sl2Cost + Sl3Cost + Sl4Cost + Sl5Cost + Sl6Cost + Sl7Cost),
                Sl1Pkg || "",
                Sl2Pkg || "",
                Sl3Pkg || "",
                Sl4Pkg || "",
                Sl5Pkg || "",
                Sl6Pkg || "",
                Sl7Pkg || "",
                (Sl1Pkg + Sl2Pkg + Sl3Pkg + Sl4Pkg + Sl5Pkg + Sl6Pkg + Sl7Pkg),
            ]);

            siteWiseRaterPkgArr.push({
                "siteName": siteItem["siteName"],
                "raterType": "fleet",
                "totalCost": Sl1Cost + Sl2Cost + Sl3Cost + Sl4Cost + Sl5Cost + Sl6Cost + Sl7Cost,
                "totalPkg": Sl1Pkg + Sl2Pkg + Sl3Pkg + Sl4Pkg + Sl5Pkg + Sl6Pkg + Sl7Pkg
            });

            Sl1Sum += Sl1Cost;
            Sl2Sum += Sl2Cost;
            Sl3Sum += Sl3Cost;
            Sl4Sum += Sl4Cost;
            Sl5Sum += Sl5Cost;
            Sl6Sum += Sl6Cost;
            Sl7Sum += Sl7Cost;

            Sl1PkgSum += Sl1Pkg;
            Sl2PkgSum += Sl2Pkg;
            Sl3PkgSum += Sl3Pkg;
            Sl4PkgSum += Sl4Pkg;
            Sl5PkgSum += Sl5Pkg;
            Sl6PkgSum += Sl6Pkg;
            Sl7PkgSum += Sl7Pkg;
        });

        missingSitesArr.forEach((siteName) => {
            jsonArr.push(["", "Fleet", siteName, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
        });

        var totalSlSum = Sl1Sum + Sl2Sum + Sl3Sum + Sl4Sum + Sl5Sum + Sl6Sum + Sl7Sum;
        var totalSlPkgSum = Sl1PkgSum + Sl2PkgSum + Sl3PkgSum + Sl4PkgSum + Sl5PkgSum + Sl6PkgSum + Sl7PkgSum;

        jsonArr.push([
            "",
            "",
            "Sub Total",
            Sl1Sum ? Sl1Sum : "",
            Sl2Sum ? Sl2Sum : "",
            Sl3Sum ? Sl3Sum : "",
            Sl4Sum ? Sl4Sum : "",
            Sl5Sum ? Sl5Sum : "",
            Sl6Sum ? Sl6Sum : "",
            Sl7Sum ? Sl7Sum : "",
            totalSlSum,
            Sl1PkgSum ? Sl1PkgSum : "",
            Sl2PkgSum ? Sl2PkgSum : "",
            Sl3PkgSum ? Sl3PkgSum : "",
            Sl4PkgSum ? Sl4PkgSum : "",
            Sl5PkgSum ? Sl5PkgSum : "",
            Sl6PkgSum ? Sl6PkgSum : "",
            Sl7PkgSum ? Sl7PkgSum : "",
            totalSlPkgSum
        ]);

        jsonArr.push([
            "",
            "",
            "% of Total",
            this.getPercentageWithoutZero(Sl1Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl2Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl3Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl4Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl5Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl6Sum, totalSlSum),
            this.getPercentageWithoutZero(Sl7Sum, totalSlSum),
            this.getPercentageWithoutZero(totalSlSum, totalSlSum),
            this.getPercentageWithoutZero(Sl1PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl2PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl3PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl4PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl5PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl6PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(Sl7PkgSum, totalSlPkgSum),
            this.getPercentageWithoutZero(totalSlPkgSum, totalSlPkgSum),
        ]);

        return {
            jsonArr: jsonArr,
            siteWiseRaterPkgArr: siteWiseRaterPkgArr,
            mergeArr: styleOpts.mergeArr || mergeArr,
            columnCount: styleOpts.columnCount || columnCount,
            rowsCount: styleOpts.rowsCount || rowsCount,
            currencyColArr: styleOpts.currencyColArr || currencyColArr,
            boldRowArr: styleOpts.boldRowArr || boldRowArr,
            colorRowArr: styleOpts.colorRowArr || colorRowArr,
        };
    }

    //================================ Multi Site Summary ======================================

    static async getMultiSiteSummaryExcelJson(parcelRaterMainJson, ltlRaterMainJson, tlRaterMainJson, fleetRaterMainJson, styleOpts = {}, userInfo = {}) {
        var sitesArr = [];

        const topThickBoarderRowArr = [];
        const leftThickBoarderColArr = [1, 3, 8];
        const rightThickBoarderColArr = [8, 14];
        const bottomThickBoarderRowArr = [];
        const leftAlignmentRow = [];
        const sixteenSizeFontArray = [];
        const topAndBottomBorderDashedColArray = [];
        const currencyColArr = [3, 4, 5, 6, 7, 8, 9, 10];
        const percentageFormatColArr = [];

        // Start to set Excel JSON
        const columnCount = 23,
            headerRowCount = 5;
        let mergeArr = [await this.prepareMergeRecord(2, 0, 2, columnCount)];
        let rowsCount = 6;
        let boldRowArr = [];
        let colorRowArr = [];
        let jsonArr = [];
        const reportJsonCount = {
            summaryReport: {
                s: jsonArr.length + 5 + 1,
                e: jsonArr.length + 5
            },
            multiSiteDetail: {
                s: jsonArr.length + 5,
                e: jsonArr.length + 5
            },
            detailedReport: {
                s: jsonArr.length + 5,
                e: jsonArr.length + 5
            }
        };
        const type = 'Multi-Node Summary';
        // ------------------------------------------------------------------------------scenario single and multi site----------------------------------------------------------------------------------
        const titleMain = ['', 'Network', '', 'Mode Cost ($M)', '', '', '', '', '', 'Site', 'Deliveries', '', '', '', ''];
        jsonArr.push(titleMain);
        boldRowArr.push(jsonArr.length + headerRowCount);
        topThickBoarderRowArr.push(jsonArr.length + headerRowCount)
        mergeArr.push((await this.prepareMergeRecord(6, 1, 6, 2))); // 'Network' Merge in title
        mergeArr.push((await this.prepareMergeRecord(6, 3, 6, 7))); // 'Mode Cost ($M)' Merge in title
        mergeArr.push((await this.prepareMergeRecord(6, 9, 7, 9))); // 'Site' Merge in title
        mergeArr.push((await this.prepareMergeRecord(6, 10, 6, 14))); // 'Deliveries' Merge in title
        const subTitle = ['', 'Scenario', 'Site', 'Parcel', 'LTL', 'TL', 'Private Fleet', 'Total', '', 'Site', 'Parcel', 'LTL', 'TL', 'Private Fleet', 'Total'];
        jsonArr.push(subTitle);
        bottomThickBoarderRowArr.push(jsonArr.length + headerRowCount);
        const yellowColorColArray = [];
        var sitesArr = [];
        this.getSiteDataByType(parcelRaterMainJson, 'parcel', sitesArr);
        this.getSiteDataByType(ltlRaterMainJson, 'ltl', sitesArr);
        this.getSiteDataByType(tlRaterMainJson, 'tl', sitesArr);
        this.getSiteDataByType(fleetRaterMainJson, 'fleet', sitesArr);
        let groupedSites = this.groupByDataList(sitesArr, "siteName");
        groupedSites.map(siteItem => {
            siteItem.sumTotalCost = siteItem["list"].reduce((total, obj) => obj.siteTotalCost + total, 0);
            siteItem.sumTotalPackages = siteItem["list"].reduce((acc, item) => {
                return acc + item.numberOfPackages;
            }, 0);
        });

        groupedSites.forEach(groupedSite => {
            let parcelSiteObj = groupedSite["list"].find(o => o.raterType == "parcel");
            let ltlSiteObj = groupedSite["list"].find(o => o.raterType == "ltl");
            let tlSiteObj = groupedSite["list"].find(o => o.raterType == "tl");
            let fleetSiteObj = groupedSite["list"].find(o => o.raterType == "fleet");
            jsonArr.push([
                '',
                'Single Site',
                groupedSite.siteName,
                parcelSiteObj ? (parcelSiteObj.siteTotalCost / 1000000) : "",
                ltlSiteObj ? (ltlSiteObj.siteTotalCost / 1000000) : "",
                tlSiteObj ? (tlSiteObj.siteTotalCost / 1000000) : "",
                fleetSiteObj ? (fleetSiteObj.siteTotalCost / 1000000) : "",
                (groupedSite.sumTotalCost / 1000000),
                '',
                groupedSite.siteName,
                parcelSiteObj ? (parcelSiteObj.numberOfPackages).toFixed(0) : "",
                ltlSiteObj ? (ltlSiteObj.numberOfPackages).toFixed(0) : "",
                tlSiteObj ? (tlSiteObj.numberOfPackages).toFixed(0) : "",
                fleetSiteObj ? (fleetSiteObj.numberOfPackages).toFixed(0) : "",
                groupedSite.sumTotalPackages.toFixed(0)
            ]);
        });

        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + headerRowCount - groupedSites.length + 1, 1, jsonArr.length + headerRowCount, 1))
        bottomThickBoarderRowArr.push(jsonArr.length + headerRowCount);

        let siteWiseRaterPkgArr = [],
            serviceLevelJsonArr = [];

        if (parcelRaterMainJson.length > 0) {
            const parcelRaterMultiSiteExcelJson = await this.getExcelJsonForParcelRaterServiceLevelWise(parcelRaterMainJson);
            serviceLevelJsonArr = serviceLevelJsonArr.concat(parcelRaterMultiSiteExcelJson.jsonArr);
            siteWiseRaterPkgArr = siteWiseRaterPkgArr.concat(parcelRaterMultiSiteExcelJson.siteWiseRaterPkgArr);
        }
        if (ltlRaterMainJson.length > 0) {
            const ltlRaterMultiSiteExcelJson = await this.getExcelJsonForLtlRaterServiceLevelWise(ltlRaterMainJson);
            serviceLevelJsonArr = serviceLevelJsonArr.concat(ltlRaterMultiSiteExcelJson.jsonArr);
            siteWiseRaterPkgArr = siteWiseRaterPkgArr.concat(ltlRaterMultiSiteExcelJson.siteWiseRaterPkgArr);
        }
        if (tlRaterMainJson.length > 0) {
            const tlRaterMultiSiteExcelJson = await this.getExcelJsonForTlRaterServiceLevelWise(tlRaterMainJson);
            serviceLevelJsonArr = serviceLevelJsonArr.concat(tlRaterMultiSiteExcelJson.jsonArr);
            siteWiseRaterPkgArr = siteWiseRaterPkgArr.concat(tlRaterMultiSiteExcelJson.siteWiseRaterPkgArr);
        }
        if (fleetRaterMainJson.length > 0) {
            const fleetRaterMultiSiteExcelJson = await this.getExcelJsonForFleetRaterServiceLevelWise(fleetRaterMainJson);
            serviceLevelJsonArr = serviceLevelJsonArr.concat(fleetRaterMultiSiteExcelJson.jsonArr);
            siteWiseRaterPkgArr = siteWiseRaterPkgArr.concat(fleetRaterMultiSiteExcelJson.siteWiseRaterPkgArr);
        }
        const groupedsiteWiseRaterPkgArr = this.groupByDataList(siteWiseRaterPkgArr, 'siteName');
        let totalObj = {
                'parcel': {
                    totalCost: 0,
                    totalPkg: 0
                },
                'ltl': {
                    totalCost: 0,
                    totalPkg: 0
                },
                'tl': {
                    totalCost: 0,
                    totalPkg: 0
                },
                'fleet': {
                    totalCost: 0,
                    totalPkg: 0
                }
            },
            finalTotalCost = 0,
            finalTotalPkg = 0;
        groupedsiteWiseRaterPkgArr.forEach(dataObj => {
            let parcelSiteObj = dataObj["list"].find(o => o.raterType == "parcel") || {
                totalCost: '',
                totalPkg: ''
            };
            let ltlSiteObj = dataObj["list"].find(o => o.raterType == "ltl") || {
                totalCost: '',
                totalPkg: ''
            };
            let tlSiteObj = dataObj["list"].find(o => o.raterType == "tl") || {
                totalCost: '',
                totalPkg: ''
            };
            let fleetSiteObj = dataObj["list"].find(o => o.raterType == "fleet") || {
                totalCost: '',
                totalPkg: ''
            };
            totalObj.parcel.totalCost += parcelSiteObj.totalCost || 0;
            totalObj.ltl.totalCost += ltlSiteObj.totalCost || 0;
            totalObj.tl.totalCost += tlSiteObj.totalCost || 0;
            totalObj.fleet.totalCost += fleetSiteObj.totalCost || 0;
            const totalAmt = (parcelSiteObj.totalCost || 0) + (ltlSiteObj.totalCost || 0) + (tlSiteObj.totalCost || 0) + (fleetSiteObj.totalCost || 0);
            finalTotalCost += totalAmt;
            totalObj.parcel.totalPkg += parcelSiteObj.totalPkg || 0;
            totalObj.ltl.totalPkg += ltlSiteObj.totalPkg || 0;
            totalObj.tl.totalPkg += tlSiteObj.totalPkg || 0;
            totalObj.fleet.totalPkg += fleetSiteObj.totalPkg || 0;
            const totalPkg = (parcelSiteObj.totalPkg || 0) + (ltlSiteObj.totalPkg || 0) + (tlSiteObj.totalPkg || 0) + (fleetSiteObj.totalPkg || 0);
            finalTotalPkg += totalPkg;
            jsonArr.push(['', 'Multi-Site', dataObj.siteName, (parcelSiteObj.totalCost || 0), (ltlSiteObj.totalCost || 0), (tlSiteObj.totalCost || 0), (fleetSiteObj.totalCost || 0), totalAmt / totalPkg, '', dataObj.siteName, parcelSiteObj.totalPkg ? parcelSiteObj.totalPkg.toFixed(0) : '', ltlSiteObj.totalPkg, tlSiteObj.totalPkg, fleetSiteObj.totalPkg, totalPkg]);
        });
        jsonArr.push(['', 'Multi-Site', 'Total', totalObj.parcel.totalCost, totalObj.ltl.totalCost, totalObj.tl.totalCost, totalObj.fleet.totalCost, finalTotalCost, '', 'Total', totalObj.parcel.totalPkg.toFixed(0), totalObj.ltl.totalPkg, totalObj.tl.totalPkg, totalObj.fleet.totalPkg, finalTotalPkg]);
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + headerRowCount - groupedsiteWiseRaterPkgArr.length, 1, jsonArr.length + headerRowCount, 1))
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + headerRowCount - groupedsiteWiseRaterPkgArr.length - groupedSites.length - 2, 8, jsonArr.length + headerRowCount, 8))
        bottomThickBoarderRowArr.push(jsonArr.length + headerRowCount);
        reportJsonCount.summaryReport.e = jsonArr.length + 5;
        //--------------------------------------------------------------------------------Multi-site Analysis--------------------------------------------------------------------------------------
        jsonArr.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        reportJsonCount.multiSiteDetail.s = jsonArr.length + 5 + 1;
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + headerRowCount, 0, jsonArr.length + headerRowCount, 15))
        bottomThickBoarderRowArr.push(jsonArr.length + headerRowCount);
        topThickBoarderRowArr.push(jsonArr.length + headerRowCount);
        let totalAnalaysisObj = {
                'parcel': {
                    costPer: 0,
                    pkgPer: 0
                },
                'ltl': {
                    costPer: 0,
                    pkgPer: 0
                },
                'tl': {
                    costPer: 0,
                    pkgPer: 0
                },
                'fleet': {
                    costPer: 0,
                    pkgPer: 0
                }
            },
            finalCostPer = 0,
            finalPkgPer = 0;
        groupedsiteWiseRaterPkgArr.forEach(dataObj => {
            let parcelSiteObj = dataObj["list"].find(o => o.raterType == "parcel") || {
                totalCost: '',
                totalPkg: ''
            };
            let ltlSiteObj = dataObj["list"].find(o => o.raterType == "ltl") || {
                totalCost: '',
                totalPkg: ''
            };
            let tlSiteObj = dataObj["list"].find(o => o.raterType == "tl") || {
                totalCost: '',
                totalPkg: ''
            };
            let fleetSiteObj = dataObj["list"].find(o => o.raterType == "fleet") || {
                totalCost: '',
                totalPkg: ''
            };
            totalAnalaysisObj.parcel.costPer += ((parcelSiteObj.totalCost || 0) / finalTotalCost) * 100;
            totalAnalaysisObj.ltl.costPer += ((ltlSiteObj.totalCost || 0) / finalTotalCost) * 100;
            totalAnalaysisObj.tl.costPer += ((tlSiteObj.totalCost || 0) / finalTotalCost) * 100;
            totalAnalaysisObj.fleet.costPer += ((fleetSiteObj.totalCost || 0) / finalTotalCost) * 100;
            const totalAmt = (((parcelSiteObj.totalCost || 0) / finalTotalCost) * 100) +
                (((ltlSiteObj.totalCost || 0) / finalTotalCost) * 100) +
                (((tlSiteObj.totalCost || 0) / finalTotalCost) * 100) + (((fleetSiteObj.totalCost || 0) / finalTotalCost) * 100);
            finalCostPer += totalAmt;
            totalAnalaysisObj.parcel.pkgPer += (parcelSiteObj.totalPkg || 0) / finalTotalPkg;
            totalAnalaysisObj.ltl.pkgPer += (ltlSiteObj.totalPkg || 0) / finalTotalPkg;
            totalAnalaysisObj.tl.pkgPer += (tlSiteObj.totalPkg || 0) / finalTotalPkg;
            totalAnalaysisObj.fleet.pkgPer += (fleetSiteObj.totalPkg || 0) / finalTotalPkg;
            const totalPkg = (((parcelSiteObj.totalPkg || 0) / finalTotalPkg) * 100) +
                (((ltlSiteObj.totalPkg || 0) / finalTotalPkg) * 100) +
                (((tlSiteObj.totalPkg || 0) / finalTotalPkg) * 100) +
                (((fleetSiteObj.totalPkg || 0) / finalTotalPkg) * 100);
            finalPkgPer += totalPkg;
            jsonArr.push(['', 'Mutli-Site Analaysis', dataObj.siteName, this.getPercentageWithZero(parcelSiteObj.totalCost || 0, finalTotalCost), this.getPercentageWithZero(ltlSiteObj.totalCost || 0, finalTotalCost), this.getPercentageWithZero(tlSiteObj.totalCost || 0, finalTotalCost), this.getPercentageWithZero(fleetSiteObj.totalCost || 0, finalTotalCost), this.getPercentageWithZero(totalAmt, finalTotalCost), '', dataObj.siteName, this.getPercentageWithZero(parcelSiteObj.totalPkg, finalTotalPkg), this.getPercentageWithZero(ltlSiteObj.totalPkg, finalTotalPkg), this.getPercentageWithZero(tlSiteObj.totalPkg, finalTotalPkg), this.getPercentageWithZero(fleetSiteObj.totalPkg, finalTotalPkg), this.getPercentageWithZero(totalPkg, finalTotalPkg)]);
        });
        totalAnalaysisObj.parcel.pkgPer = (totalAnalaysisObj.parcel.pkgPer * 100).toFixed(2).concat('%');
        totalAnalaysisObj.ltl.pkgPer = (totalAnalaysisObj.ltl.pkgPer * 100).toFixed(2).concat('%');
        totalAnalaysisObj.tl.pkgPer = (totalAnalaysisObj.tl.pkgPer * 100).toFixed(2).concat('%');
        totalAnalaysisObj.fleet.pkgPer = (totalAnalaysisObj.fleet.pkgPer * 100).toFixed(2).concat('%');
        jsonArr.push(['', 'Multi-Site Analaysis', 'Total', totalAnalaysisObj.parcel.costPer.toFixed(2).concat('%'), totalAnalaysisObj.ltl.costPer.toFixed(2).concat('%'),
            totalAnalaysisObj.tl.costPer.toFixed(2).concat('%'), totalAnalaysisObj.fleet.costPer.toFixed(2).concat('%'), finalCostPer.toFixed(2).concat('%'), '', 'Total', totalAnalaysisObj.parcel.pkgPer, totalAnalaysisObj.ltl.pkgPer, totalAnalaysisObj.tl.pkgPer, totalAnalaysisObj.fleet.pkgPer, finalPkgPer.toFixed(2).concat('%')
        ]);
        bottomThickBoarderRowArr.push(jsonArr.length + headerRowCount);
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + headerRowCount - groupedsiteWiseRaterPkgArr.length, 1, jsonArr.length + headerRowCount, 1))
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + headerRowCount - groupedsiteWiseRaterPkgArr.length, 8, jsonArr.length + headerRowCount, 8))
        reportJsonCount.multiSiteDetail.e = jsonArr.length + 5;
        jsonArr.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

        //-----------------------------------------------------------------------------------Detailed multi-site summary-------------------------------------------------------------------------------------
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + headerRowCount, 0, jsonArr.length + headerRowCount, 15))
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length + headerRowCount, 1, jsonArr.length + headerRowCount, 14))
        jsonArr.push(['', 'Detailed Multi-Node Performance by Mode', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        sixteenSizeFontArray.push(jsonArr.length + headerRowCount);
        reportJsonCount.detailedReport.s = jsonArr.length + 5;
        mergeArr.push((await this.prepareMergeRecord(jsonArr.length + headerRowCount, 1, jsonArr.length + headerRowCount, 19))); // 'Detailed Multi-Node Performance by Mode' Merge in title
        leftAlignmentRow.push(jsonArr.length + headerRowCount);
        boldRowArr.push(jsonArr.length + headerRowCount);
        jsonArr.push(['', 'Scenario', '', 'Delivery Cost ($M)', '', '', '', '', '', '', '', 'Total Deliveries', '', '', '', '', '', '', '']);
        const secondTblStartRow = jsonArr.length + headerRowCount;
        boldRowArr.push(jsonArr.length + headerRowCount);
        topThickBoarderRowArr.push(jsonArr.length + headerRowCount);
        mergeArr.push((await this.prepareMergeRecord(secondTblStartRow, 1, secondTblStartRow, 2))); // 'Scenario' Merge in title
        mergeArr.push((await this.prepareMergeRecord(secondTblStartRow, 3, secondTblStartRow, 10))); // 'Delivery  Cost ($M)' Merge in title
        mergeArr.push((await this.prepareMergeRecord(secondTblStartRow, 11, secondTblStartRow, 18))); // 'Total Deliveries Network' Merge in title
        mergeArr.push((await this.prepareMergeRecord(secondTblStartRow - 1, 1, secondTblStartRow - 1, 18))); // 'Detailed Multi-Node Performance by Mode' Merge in title
        jsonArr.push(['', 'Mode', 'Site', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total']);
        bottomThickBoarderRowArr.push(jsonArr.length + headerRowCount);
        leftThickBoarderColArr.push(3, 11);
        rightThickBoarderColArr.push(18);
        let firstIndex = 3,
            secondIndex = 11;
        this.setYellowColorColArr(userInfo.inputServiceLevel, firstIndex, secondIndex, yellowColorColArray);
        const startRowForYellowColorDetail = jsonArr.length + headerRowCount;
        const startRowForYellowColorSummary = jsonArr.length + headerRowCount;
        jsonArr = jsonArr.concat(serviceLevelJsonArr);
        const endRowForYellowColorDetail = jsonArr.length + headerRowCount;
        const endRowForYellowColorSummary = jsonArr.length + headerRowCount;
        let parcelStart = 0,
            ltlStart = 0,
            ltStart = 0,
            fleetStart = 0;
        let parcelEnd = 0,
            ltlEnd = 0,
            ltEnd = 0,
            fleetEnd = 0;
        jsonArr.forEach((rowData, index) => {
            if (rowData[1] === 'Parcel') {
                parcelStart = parcelStart || (index + headerRowCount);
            } else if (rowData[1] === 'LTL') {
                ltlStart = ltlStart || (index + headerRowCount);
            } else if (rowData[1] === 'TL') {
                ltStart = ltStart || (index + headerRowCount);
            } else if (rowData[1] === 'Fleet') {
                fleetStart = fleetStart || (index + headerRowCount);
            }
            if (rowData[2] === 'Sub Total') {
                boldRowArr.push(index + headerRowCount + 1);
                bottomThickBoarderRowArr.push(index + headerRowCount + 2);
                if (jsonArr[index - 1][1] == 'Parcel') {
                    parcelEnd = index + headerRowCount + 1;
                } else if (jsonArr[index - 1][1] == 'LTL') {
                    ltlEnd = index + headerRowCount + 1;
                } else if (jsonArr[index - 1][1] == 'TL') {
                    ltEnd = index + headerRowCount + 1;
                } else if (jsonArr[index - 1][1] == 'Fleet') {
                    fleetEnd = index + headerRowCount + 1;
                }
            }
        })
        mergeArr.push(await this.prepareMergeRecord(parcelStart + 1, 1, parcelEnd + 1, 1));
        mergeArr.push(await this.prepareMergeRecord(ltlStart + 1, 1, ltlEnd + 1, 1));
        mergeArr.push(await this.prepareMergeRecord(ltStart + 1, 1, ltEnd + 1, 1));
        mergeArr.push(await this.prepareMergeRecord(fleetStart + 1, 1, fleetEnd + 1, 1));
        reportJsonCount.detailedReport.e = jsonArr.length + 5;

        const getColSizeArr = await this.getColumnSizeArr(jsonArr);
        getColSizeArr[1].wch = 20;
        return {
            jsonArr: jsonArr,
            type,
            mergeArr: styleOpts.mergeArr || mergeArr,
            columnCount: styleOpts.columnCount || columnCount,
            rowsCount: styleOpts.rowsCount || rowsCount,
            currencyColArr: styleOpts.currencyColArr || currencyColArr,
            boldRowArr: styleOpts.boldRowArr || boldRowArr,
            colorRowArr: styleOpts.colorRowArr || colorRowArr,
            leftAlignmentRow: styleOpts.leftAlignmentRow || leftAlignmentRow,
            topThickBoarderRowArr: styleOpts.topThickBoarderRowArr || topThickBoarderRowArr,
            bottomThickBoarderRowArr: styleOpts.bottomThickBoarderRowArr || bottomThickBoarderRowArr,
            leftThickBoarderColArr: styleOpts.leftThickBoarderColArr || leftThickBoarderColArr,
            rightThickBoarderColArr: styleOpts.rightThickBoarderColArr || rightThickBoarderColArr,
            sixteenSizeFontArray: styleOpts.sixteenSizeFontArray || sixteenSizeFontArray,
            noBorderRowTitle: [],
            topAndBottomBorderDashedColArray: styleOpts.topAndBottomBorderDashedColArray || topAndBottomBorderDashedColArray,
            columSizeArr: styleOpts.getColSizeArr || getColSizeArr,
            percentageFormatColArr: styleOpts.percentageFormatColArr || percentageFormatColArr,
            yellowColorColArray: styleOpts.yellowColorColArray || yellowColorColArray,
            reportJsonCount: styleOpts.reportJsonCount || reportJsonCount,
            colorRowDetail: {
                startRowForYellowColorSummary,
                endRowForYellowColorSummary,
                startRowForYellowColorDetail,
                endRowForYellowColorDetail
            }
        };
    }

    //================================ Single Site Summary ======================================

    static async getSingleSiteSummaryExcelJson(parcelRaterMainJson, ltlRaterMainJson, tlRaterMainJson, fleetRaterMainJson, styleOpts = {}, userInfo = {}) {
        var sitesArr = [];
        this.getSiteDataByType(parcelRaterMainJson, 'parcel', sitesArr);
        this.getSiteDataByType(ltlRaterMainJson, 'ltl', sitesArr);
        this.getSiteDataByType(tlRaterMainJson, 'tl', sitesArr);
        this.getSiteDataByType(fleetRaterMainJson, 'fleet', sitesArr);

        // Grouped sites
        let groupedSites = this.groupByDataList(sitesArr, "siteName");
        groupedSites.map(siteItem => {
            siteItem.sumTotalCost = siteItem["list"].reduce((total, obj) => obj.siteTotalCost + total, 0);
            siteItem.sumTotalPackages = siteItem["list"].reduce((acc, item) => {
                return acc + item.numberOfPackages;
            }, 0);
        });

        const topThickBoarderRowArr = [];
        const leftThickBoarderColArr = [];
        const rightThickBoarderColArr = [];
        const bottomThickBoarderRowArr = [];
        const sixteenSizeFontArray = [];
        const topAndBottomBorderDashedColArray = [];
        const currencyColArr = [3, 4, 6, 7, 8, 9, 10, 11, 12, 13];
        const percentageFormatColArr = [];

        // Start to set Excel JSON
        const columnCount = 23;
        let mergeArr = [await this.prepareMergeRecord(2, 0, 2, columnCount)];
        let rowsCount = groupedSites.length + 6;
        let boldRowArr = [];
        let colorRowArr = [];
        let jsonArr = [];
        const headerRows = 5;
        let jsonLengthFromTitles;
        const type = 'Single Site Performance';
        const titleMain = ['', 'Network', 'Demand', 'Delivery Cost', '', '', '', 'Delivery Cost ($M)', '', '', '', '', '', '', '', '', 'Deliveries', '', '', '', '', '', '', ''];
        jsonArr.push(titleMain);
        const reportJsonCount = {
            costing: {
                s: jsonArr.length + 5,
                e: jsonArr.length + 5
            },
            percentageReport: {
                s: jsonArr.length + 5,
                e: jsonArr.length + 5
            }
        }
        boldRowArr.push(jsonArr.length - 1 + 6);
        topThickBoarderRowArr.push(jsonArr.length - 1 + 6);
        mergeArr.push((await this.prepareMergeRecord(jsonArr.length + headerRows, 3, jsonArr.length + headerRows, 4))); // Delivery Cost Merge in title
        mergeArr.push((await this.prepareMergeRecord(jsonArr.length + headerRows, 7, jsonArr.length + headerRows, 14))); // Delivery Cost ($M) Merge in title
        mergeArr.push((await this.prepareMergeRecord(jsonArr.length + headerRows, 16, jsonArr.length + headerRows, 23))); // Deliveries Merge in title
        mergeArr.push((await this.prepareMergeRecord(jsonArr.length + headerRows, 5, jsonArr.length + groupedSites.length + headerRows + 1, 6)));
        mergeArr.push((await this.prepareMergeRecord(jsonArr.length + headerRows, 15, jsonArr.length + groupedSites.length + headerRows + 1, 15)));
        jsonLengthFromTitles = jsonArr.length + 5;
        const subTitle = ['', 'Site', 'No. Packages', 'Total Scenario Cost', 'Cost / Delivery', '', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total'];
        jsonArr.push(subTitle);
        let firstIndex = 7,
            secondIndex = 16,
            yellowColorColArray = [];
        this.setYellowColorColArr(userInfo.inputServiceLevel, firstIndex, secondIndex, yellowColorColArray);
        const startRowForYellowColorSummary = jsonArr.length + 6; //
        bottomThickBoarderRowArr.push(jsonArr.length - 1 + 6);


        groupedSites.forEach(siteItem => {
            var mergeSiteListArr = [];
            siteItem["list"].forEach(raterItems => {
                mergeSiteListArr = mergeSiteListArr.concat(raterItems["list"]);
            });
            var groupedServiceLevels = this.groupByDataList(mergeSiteListArr, "serviceLevel");
            const serviceLevelData = {
                '1': {
                    totalPkg: 0,
                    totalCost: 0
                },
                '2': {
                    totalPkg: 0,
                    totalCost: 0
                },
                '3': {
                    totalPkg: 0,
                    totalCost: 0
                },
                '4': {
                    totalPkg: 0,
                    totalCost: 0
                },
                '5': {
                    totalPkg: 0,
                    totalCost: 0
                },
                '6': {
                    totalPkg: 0,
                    totalCost: 0
                },
                '7': {
                    totalPkg: 0,
                    totalCost: 0
                }
            };
            let serviceLevelTotalPkg = 0,
                serviceLevelTotalCost = 0;
            groupedServiceLevels.forEach(item => {
                const level = item.serviceLevel <= 6 ? `${item.serviceLevel}` : '7';
                item["list"].forEach(valueObj => {
                    serviceLevelData[level].totalPkg += this.getTotalLoadedValue(valueObj);
                    serviceLevelData[level].totalCost += valueObj.totalCost || 0;
                });
                serviceLevelTotalPkg += serviceLevelData[level].totalPkg;
                serviceLevelTotalCost += serviceLevelData[level].totalCost;
            });
            jsonArr.push(['', siteItem["siteName"], siteItem["sumTotalPackages"], siteItem["sumTotalCost"], siteItem["sumTotalCost"] / siteItem["sumTotalPackages"], '', '', serviceLevelData['1'].totalCost / 1000000, serviceLevelData['2'].totalCost / 1000000, serviceLevelData['3'].totalCost / 1000000, serviceLevelData['4'].totalCost / 1000000, serviceLevelData['5'].totalCost / 1000000, serviceLevelData['6'].totalCost / 1000000, serviceLevelData['7'].totalCost / 1000000, (serviceLevelTotalCost / 1000000).toFixed(2), '', serviceLevelData['1'].totalPkg, serviceLevelData['2'].totalPkg, serviceLevelData['3'].totalPkg, serviceLevelData['4'].totalPkg, serviceLevelData['5'].totalPkg, serviceLevelData['6'].totalPkg, serviceLevelData['7'].totalPkg, serviceLevelTotalPkg]);
        });
        reportJsonCount.costing.e = jsonArr.length + 5;
        const endRowForYellowColorSummary = jsonArr.length - 1 + 6;
        jsonArr.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        bottomThickBoarderRowArr.push(jsonArr.length - 1 + 6);
        topThickBoarderRowArr.push(jsonArr.length - 1 + 6);
        reportJsonCount.percentageReport.s = jsonArr.length + 5 + 1;
        const startRowForYellowColorDetail = jsonArr.length - 1 + 6 - 1; // -1 add extra due to before add jsonArr
        mergeArr.push((await this.prepareMergeRecord(jsonArr.length - 1 + 6, 0, jsonArr.length - 1 + 6, columnCount)));
        groupedSites.forEach(siteItem => {
            var mergeSiteListArr = [];
            siteItem["list"].forEach(raterItems => {
                mergeSiteListArr = mergeSiteListArr.concat(raterItems["list"]);
            });
            var groupedServiceLevels = this.groupByDataList(mergeSiteListArr, "serviceLevel");
            const serviceLevelData = {
                '1': {
                    totalPkg: 0,
                    totalCost: 0
                },
                '2': {
                    totalPkg: 0,
                    totalCost: 0
                },
                '3': {
                    totalPkg: 0,
                    totalCost: 0
                },
                '4': {
                    totalPkg: 0,
                    totalCost: 0
                },
                '5': {
                    totalPkg: 0,
                    totalCost: 0
                },
                '6': {
                    totalPkg: 0,
                    totalCost: 0
                },
                '7': {
                    totalPkg: 0,
                    totalCost: 0
                }
            };
            let serviceLevelTotalPkg = 0,
                serviceLevelTotalCost = 0;
            groupedServiceLevels.forEach(item => {
                const level = item.serviceLevel <= 6 ? `${item.serviceLevel}` : '7';
                item["list"].forEach(valueObj => {
                    serviceLevelData[level].totalPkg += this.getTotalLoadedValue(valueObj);
                    serviceLevelData[level].totalCost += valueObj.totalCost || 0;
                });
                serviceLevelTotalPkg += serviceLevelData[level].totalPkg;
                serviceLevelTotalCost += serviceLevelData[level].totalCost;
            });
            jsonArr.push(['', '', '', '', '', '', '', this.getPercentageWithZero(serviceLevelData['1'].totalCost, serviceLevelTotalCost), this.getPercentageWithZero(serviceLevelData['2'].totalCost, serviceLevelTotalCost), this.getPercentageWithZero(serviceLevelData['3'].totalCost, serviceLevelTotalCost), this.getPercentageWithZero(serviceLevelData['4'].totalCost, serviceLevelTotalCost), this.getPercentageWithZero(serviceLevelData['5'].totalCost, serviceLevelTotalCost), this.getPercentageWithZero(serviceLevelData['6'].totalCost, serviceLevelTotalCost), this.getPercentageWithZero(serviceLevelData['7'].totalCost, serviceLevelTotalCost), this.getPercentageWithZero(serviceLevelTotalCost, serviceLevelTotalCost), '', this.getPercentageWithZero(serviceLevelData['1'].totalPkg, serviceLevelTotalPkg), this.getPercentageWithZero(serviceLevelData['2'].totalPkg, serviceLevelTotalPkg), this.getPercentageWithZero(serviceLevelData['3'].totalPkg, serviceLevelTotalPkg), this.getPercentageWithZero(serviceLevelData['4'].totalPkg, serviceLevelTotalPkg), this.getPercentageWithZero(serviceLevelData['5'].totalPkg, serviceLevelTotalPkg), this.getPercentageWithZero(serviceLevelData['6'].totalPkg, serviceLevelTotalPkg), this.getPercentageWithZero(serviceLevelData['7'].totalPkg, serviceLevelTotalPkg), this.getPercentageWithZero(serviceLevelTotalPkg, serviceLevelTotalPkg)]);
        });
        reportJsonCount.percentageReport.e = jsonArr.length + 5;
        const endRowForYellowColorDetail = jsonArr.length - 1 + 6;
        bottomThickBoarderRowArr.push(jsonArr.length - 1 + 6);
        leftThickBoarderColArr.push(1, 7, 15);
        rightThickBoarderColArr.push(4, 15, 23);
        mergeArr.push((await this.prepareMergeRecord(jsonLengthFromTitles, 5, jsonArr.length - 1 + 6, 6)));
        mergeArr.push((await this.prepareMergeRecord(jsonLengthFromTitles, 15, jsonArr.length - 1 + 6, 15)));
        const getColSizeArr = await this.getColumnSizeArr(jsonArr);
        getColSizeArr[9].wch = 5;
        getColSizeArr[17].wch = 5;
        return {
            jsonArr: jsonArr,
            type,
            mergeArr: styleOpts.mergeArr || mergeArr,
            columnCount: styleOpts.columnCount || columnCount,
            rowsCount: styleOpts.rowsCount || rowsCount,
            currencyColArr: styleOpts.currencyColArr || currencyColArr,
            boldRowArr: styleOpts.boldRowArr || boldRowArr,
            colorRowArr: styleOpts.colorRowArr || colorRowArr,
            topThickBoarderRowArr: styleOpts.topThickBoarderRowArr || topThickBoarderRowArr,
            bottomThickBoarderRowArr: styleOpts.bottomThickBoarderRowArr || bottomThickBoarderRowArr,
            leftThickBoarderColArr: styleOpts.leftThickBoarderColArr || leftThickBoarderColArr,
            rightThickBoarderColArr: styleOpts.rightThickBoarderColArr || rightThickBoarderColArr,
            sixteenSizeFontArray: styleOpts.sixteenSizeFontArray || sixteenSizeFontArray,
            noBorderRowTitle: [],
            topAndBottomBorderDashedColArray: styleOpts.topAndBottomBorderDashedColArray || topAndBottomBorderDashedColArray,
            columSizeArr: styleOpts.getColSizeArr || getColSizeArr,
            percentageFormatColArr: styleOpts.percentageFormatColArr || percentageFormatColArr,
            yellowColorColArray: styleOpts.yellowColorColArray || yellowColorColArray,
            reportJsonCount: styleOpts.reportJsonCount || reportJsonCount,
            colorRowDetail: {
                startRowForYellowColorSummary,
                endRowForYellowColorSummary,
                startRowForYellowColorDetail,
                endRowForYellowColorDetail
            }
        };
    }

    //================================ Final Summary ==============================================

    static async getFinalSummaryExcelJson(parcelRaterMainJson, ltlRaterMainJson, tlRaterMainJson, fleetRaterMainJson, styleOpts = {}, userInfo = {}) {

        // Start to set Excel JSON
        const columnCount = 23;
        let mergeArr = [await this.prepareMergeRecord(2, 0, 2, columnCount)];
        let rowsCount = 6;
        let headerRows = 5;
        let boldRowArr = [];
        let colorRowArr = [];
        let jsonArr = [],
            currencyColArr = [];

        let startRowForYellowColorSummary = 0,
            endRowForYellowColorSummary = 0,
            startRowForYellowColorDetail = 0,
            endRowForYellowColorDetail = 0;
        const topThickBoarderRowArr = [],
            bottomThickBoarderRowArr = [],
            leftThickBoarderColArr = [1, 3, 6, 14],
            rightThickBoarderColArr = [6, 16];
        const sixteenSizeFontArray = [],
            topAndBottomBorderDashedColArray = [],
            percentageFormatColArr = [],
            yellowColorColArray = [];

        const type = 'Analysis Summary';
        jsonArr.push(['', 'Scenario', '', 'Delivery Cost', '', '', '', 'Service Level', '', '', '', '', '', '', '', '', '']);
        const reportJsonCount = {
            serviceLevelWiseData: {
                s: jsonArr.length + 5,
                e: jsonArr.length + 5
            },
            overallData: {
                s: jsonArr.length + 5,
                e: jsonArr.length + 5
            }
        }
        topThickBoarderRowArr.push(jsonArr.length + headerRows);
        jsonArr.push(['', 'No. Sites', 'Location', '$(M)', '% Total', '$/Load', '', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', `X ≤  ${userInfo.inputServiceLevel} Days`, `${userInfo.inputServiceLevel} X ≤ 5 Days`, 'X ≥ 6 Days']);
        let mergeStartFrom = jsonArr.length - 1 + 5;
        this.setYellowColorColArr(userInfo.inputServiceLevel, 7, null, yellowColorColArray);
        yellowColorColArray.push(14)
        startRowForYellowColorSummary = 7;
        startRowForYellowColorDetail = 7;
        bottomThickBoarderRowArr.push(jsonArr.length + headerRows);
        mergeArr.push((await this.prepareMergeRecord(mergeStartFrom, 1, mergeStartFrom, 2)));
        mergeArr.push((await this.prepareMergeRecord(mergeStartFrom, 3, mergeStartFrom, 5)));
        mergeArr.push((await this.prepareMergeRecord(mergeStartFrom, 7, mergeStartFrom, 16)));
        boldRowArr.push(mergeStartFrom);
        let parcelRaterSiteWise = [],
            parcelRaterStateWise = [];
        let ltlRaterSiteWise = [],
            ltlRaterStateWise = [];
        let tlRaterSiteWise = [],
            tlRaterStateWise = [];
        let fleetRaterSiteWise = [],
            fleetRaterStateWise = [];
        let inputServiceLevel = userInfo.inputServiceLevel;
        if (parcelRaterMainJson.length > 0) {
            parcelRaterSiteWise = this.groupByDataList(parcelRaterMainJson, "siteName");
            parcelRaterStateWise = this.groupByDataList(parcelRaterMainJson, "stateCode");
        }
        if (ltlRaterMainJson.length > 0) {
            ltlRaterSiteWise = this.groupByDataList(ltlRaterMainJson, "siteName");
            ltlRaterStateWise = this.groupByDataList(ltlRaterMainJson, "stateCode");
        }
        if (tlRaterMainJson.length > 0) {
            tlRaterSiteWise = this.groupByDataList(tlRaterMainJson, "siteName");
            tlRaterStateWise = this.groupByDataList(tlRaterMainJson, "stateCode");
        }
        if (fleetRaterMainJson.length > 0) {
            fleetRaterSiteWise = this.groupByDataList(fleetRaterMainJson, "siteName");
            fleetRaterStateWise = this.groupByDataList(fleetRaterMainJson, "stateCode");
        }
        await this.calculateFinalSummaryScenarioWise(parcelRaterSiteWise, ltlRaterSiteWise, tlRaterSiteWise, fleetRaterSiteWise, "single", inputServiceLevel, jsonArr, mergeArr);
        currencyColArr.push(3, 5);

        //----------------------------------------- Multi Sites Scenario ------------------------------------------------------

        let parcelMinSiteWise = this.getMinSiteWiseItems(parcelRaterStateWise);
        let ltlMinSiteWise = this.getMinSiteWiseItems(ltlRaterStateWise);
        let tlMinSiteWise = this.getMinSiteWiseItems(tlRaterStateWise);
        let fleetMinSiteWise = this.getMinSiteWiseItems(fleetRaterStateWise);

        await this.calculateFinalSummaryScenarioWise(parcelMinSiteWise, ltlMinSiteWise, tlMinSiteWise, fleetMinSiteWise, "multi", inputServiceLevel, jsonArr, mergeArr);
        bottomThickBoarderRowArr.push(jsonArr.length + headerRows);
        topThickBoarderRowArr.push(jsonArr.length + headerRows);
        endRowForYellowColorDetail = jsonArr.length + headerRows - 1;
        endRowForYellowColorSummary = jsonArr.length + headerRows - 1;
        reportJsonCount.serviceLevelWiseData.e = jsonArr.length + 5;
        //----------------------------------------- Delivery by Mode Scenario ------------------------------------------------------
        jsonArr.push([]);
        reportJsonCount.overallData.s = jsonArr.length + 5;
        topThickBoarderRowArr.push(jsonArr.length + headerRows);
        topThickBoarderRowArr.push(jsonArr.length + 1 + headerRows);
        boldRowArr.push(jsonArr.length + rowsCount);
        bottomThickBoarderRowArr.push(jsonArr.length + 2 + headerRows);
        await this.calculateFinalSummaryDeliveryModeWise(parcelRaterStateWise, ltlRaterStateWise, tlRaterStateWise, fleetRaterStateWise, jsonArr, mergeArr);
        reportJsonCount.overallData.e = jsonArr.length + 5;
        bottomThickBoarderRowArr.push(jsonArr.length + headerRows);
        const getColSizeArr = await this.getColumnSizeArr(jsonArr);
        getColSizeArr[9].wch = 5;
        // getColSizeArr[17].wch = 5;
        return {
            jsonArr: jsonArr,
            type,
            mergeArr: styleOpts.mergeArr || mergeArr,
            columnCount: styleOpts.columnCount || columnCount,
            rowsCount: styleOpts.rowsCount || rowsCount,
            currencyColArr: styleOpts.currencyColArr || currencyColArr || [],
            boldRowArr: styleOpts.boldRowArr || boldRowArr || [],
            colorRowArr: styleOpts.colorRowArr || colorRowArr || [],
            topThickBoarderRowArr: styleOpts.topThickBoarderRowArr || topThickBoarderRowArr || [],
            bottomThickBoarderRowArr: styleOpts.bottomThickBoarderRowArr || bottomThickBoarderRowArr || [],
            leftThickBoarderColArr: styleOpts.leftThickBoarderColArr || leftThickBoarderColArr || [],
            rightThickBoarderColArr: styleOpts.rightThickBoarderColArr || rightThickBoarderColArr || [],
            sixteenSizeFontArray: styleOpts.sixteenSizeFontArray || sixteenSizeFontArray || [],
            noBorderRowTitle: [],
            topAndBottomBorderDashedColArray: styleOpts.topAndBottomBorderDashedColArray || topAndBottomBorderDashedColArray || [],
            columSizeArr: styleOpts.getColSizeArr || getColSizeArr || [],
            percentageFormatColArr: styleOpts.percentageFormatColArr || percentageFormatColArr || [],
            yellowColorColArray: styleOpts.yellowColorColArray || yellowColorColArray || [],
            reportJsonCount: styleOpts.reportJsonCount || reportJsonCount,
            colorRowDetail: {
                startRowForYellowColorSummary,
                endRowForYellowColorSummary,
                startRowForYellowColorDetail,
                endRowForYellowColorDetail
            }
        };
    }

    static getMinSiteWiseItems(stateWiseItems) {

        let minSiteWiseItems = [];
        stateWiseItems.forEach((stateItem) => {

            let minCostSite = stateItem["list"].reduce(function (prev, curr) {
                return prev.totalCost < curr.totalCost ? prev : curr;
            });
            minSiteWiseItems.push({
                siteName: minCostSite.siteName,
                list: [minCostSite],
            });
        });
        return minSiteWiseItems;
    }

    static getMinCostSitesItems(stateWiseItems, raterType) {

        let minCostSitesArr = [];
        stateWiseItems.forEach((stateItem) => {
            let minCostSite = stateItem["list"].reduce(function (prev, curr) {
                return prev.totalCost < curr.totalCost ? prev : curr;
            });
            minCostSitesArr.push(minCostSite);
        });

        let groupedMinCostSitesArr = treeLogicsController.groupByDataList(minCostSitesArr, "siteName");
        let pkgKey = "";

        switch (raterType) {
            case "parcel":
                pkgKey = "packageSpreed";
                break;
            case "ltl":
                pkgKey = "ltlLoads";
                break;
            case "tl":
                pkgKey = "tlLoads";
                break;
            case "fleet":
                pkgKey = "fleetLoads";
                break;
        }

        groupedMinCostSitesArr = groupedMinCostSitesArr.map((siteItem) => {
            return {
                siteName: siteItem["siteName"],
                totalCostSum: siteItem["list"].reduce((acc, item) => {
                    return acc + (item.totalCost);
                }, 0),
                totalPkgSum: siteItem["list"].reduce((acc, item) => {
                    return acc + (item[pkgKey]);
                }, 0),
                raterType: raterType,
            }
        });

        return groupedMinCostSitesArr;
    }

    static getSitesItemsWithTotals(siteWiseItems, raterType) {

        let sitesItemsArr = [];
        let pkgKey = "";

        switch (raterType) {
            case "parcel":
                pkgKey = "packageSpreed";
                break;
            case "ltl":
                pkgKey = "ltlLoads";
                break;
            case "tl":
                pkgKey = "tlLoads";
                break;
            case "fleet":
                pkgKey = "fleetLoads";
                break;
        }

        for (let i = 0; i < siteWiseItems.length; i++) {

            let siteTotalCost = siteWiseItems[i]["list"].reduce((total, item) => item.totalCost + total, 0);
            let siteTotalPackages = siteWiseItems[i]["list"].reduce((total, item) => item[pkgKey] + total, 0);

            sitesItemsArr.push({
                siteName: siteWiseItems[i]["siteName"],
                raterType: raterType,
                list: siteWiseItems[i]["list"],
                numberOfPackages: siteTotalPackages,
                siteTotalCost: siteTotalCost,
            });
        }

        return sitesItemsArr;
    }

    static async calculateFinalSummaryScenarioWise(parcelRaterSiteWise, ltlRaterSiteWise, tlRaterSiteWise, fleetRaterSiteWise, scenarioType, inputServiceLevel, jsonArr, mergeArr) {
        var sitesArr = [];

        if (parcelRaterSiteWise.length > 0) {
            let siteWiseItems = treeLogicsController.getSitesItemsWithTotals(parcelRaterSiteWise, "parcel");
            sitesArr = [...sitesArr, ...siteWiseItems];
        }

        if (ltlRaterSiteWise.length > 0) {
            let siteWiseItems = treeLogicsController.getSitesItemsWithTotals(ltlRaterSiteWise, "ltl");
            sitesArr = [...sitesArr, ...siteWiseItems];
        }

        if (tlRaterSiteWise.length > 0) {
            let siteWiseItems = treeLogicsController.getSitesItemsWithTotals(tlRaterSiteWise, "tl");
            sitesArr = [...sitesArr, ...siteWiseItems];
        }

        if (fleetRaterSiteWise.length > 0) {
            let siteWiseItems = treeLogicsController.getSitesItemsWithTotals(fleetRaterSiteWise, "fleet");
            sitesArr = [...sitesArr, ...siteWiseItems];
        }

        // Grouped sites
        let groupedSites = treeLogicsController.groupByDataList(sitesArr, "siteName");

        groupedSites.map((siteItem) => {
            siteItem.sumTotalCost = siteItem["list"].reduce((total, obj) => obj.siteTotalCost + total, 0);
            siteItem.sumTotalPackages = (siteItem["list"].reduce((acc, item) => {
                return acc + (item.numberOfPackages);
            }, 0));
        });

        // Generate JSON
        let Sl1Sum = 0;
        let Sl2Sum = 0;
        let Sl3Sum = 0;
        let Sl4Sum = 0;
        let Sl5Sum = 0;
        let Sl6Sum = 0;
        let Sl7Sum = 0;
        let Sl1PkgSum = 0;
        let Sl2PkgSum = 0;
        let Sl3PkgSum = 0;
        let Sl4PkgSum = 0;
        let Sl5PkgSum = 0;
        let Sl6PkgSum = 0;
        let Sl7PkgSum = 0;
        let sitesCount = groupedSites.length;

        var scenarioSitesTotalCostSum = groupedSites.reduce((total, obj) => obj.sumTotalCost + total, 0);
        // mergeArr.push(await treeLogicsController.prepareMergeRecord(1, jsonArr.length -1, 1 , scenarioType == "single" ? groupedSites.length - 1 : groupedSites.length));

        const subTotalObj = {
            totalCostValue: 0,
            totalPerValue: 0,
            totalLoadValue: 0
        }
        // Single Site
        groupedSites.forEach((siteItem, index) => {
            let gt6DaysSLPkgSum = 0,
                uptoInputSlPkgSum = 0,
                outOfInputSlPkgSum = 0;
            var mergeSiteListArr = [];
            siteItem["list"].forEach((raterItems) => {
                mergeSiteListArr = mergeSiteListArr.concat(raterItems["list"])
            });

            let groupedServiceLevels = treeLogicsController.groupByDataList(mergeSiteListArr, "serviceLevel");

            groupedServiceLevels.forEach((item) => {
                if (item.serviceLevel == 1) {
                    item["list"].forEach((valueObj) => {
                        Sl1PkgSum += valueObj.packageSpreed ? valueObj.packageSpreed : 0;
                        Sl1PkgSum += valueObj.ltlLoads ? valueObj.ltlLoads : 0;
                        Sl1PkgSum += valueObj.tlLoads ? valueObj.tlLoads : 0;
                        Sl1PkgSum += valueObj.fleetLoads ? valueObj.fleetLoads : 0;
                        Sl1Sum += valueObj.totalCost ? valueObj.totalCost : 0;
                    });

                    // Calculate greater than service level sum
                    if (item.serviceLevel <= inputServiceLevel) {
                        uptoInputSlPkgSum += Sl1PkgSum;
                    } else {
                        outOfInputSlPkgSum += Sl1PkgSum;
                    }
                }
                if (item.serviceLevel == 2) {
                    item["list"].forEach((valueObj) => {
                        Sl2PkgSum += valueObj.packageSpreed ? valueObj.packageSpreed : 0;
                        Sl2PkgSum += valueObj.ltlLoads ? valueObj.ltlLoads : 0;
                        Sl2PkgSum += valueObj.tlLoads ? valueObj.tlLoads : 0;
                        Sl2PkgSum += valueObj.fleetLoads ? valueObj.fleetLoads : 0;
                        Sl2Sum += valueObj.totalCost ? valueObj.totalCost : 0;
                    });

                    // Calculate greater than service level sum
                    if (item.serviceLevel <= inputServiceLevel) {
                        uptoInputSlPkgSum += Sl2PkgSum;
                    } else {
                        outOfInputSlPkgSum += Sl2PkgSum;
                    }
                }
                if (item.serviceLevel == 3) {
                    item["list"].forEach((valueObj) => {
                        Sl3PkgSum += valueObj.packageSpreed ? valueObj.packageSpreed : 0;
                        Sl3PkgSum += valueObj.ltlLoads ? valueObj.ltlLoads : 0;
                        Sl3PkgSum += valueObj.tlLoads ? valueObj.tlLoads : 0;
                        Sl3PkgSum += valueObj.fleetLoads ? valueObj.fleetLoads : 0;
                        Sl3Sum += valueObj.totalCost ? valueObj.totalCost : 0;
                    });

                    // Calculate greater than service level sum
                    if (item.serviceLevel <= inputServiceLevel) {
                        uptoInputSlPkgSum += Sl3PkgSum;
                    } else {
                        outOfInputSlPkgSum += Sl3PkgSum;
                    }
                }
                if (item.serviceLevel == 4) {
                    item["list"].forEach((valueObj) => {
                        Sl4PkgSum += valueObj.packageSpreed ? valueObj.packageSpreed : 0;
                        Sl4PkgSum += valueObj.ltlLoads ? valueObj.ltlLoads : 0;
                        Sl4PkgSum += valueObj.tlLoads ? valueObj.tlLoads : 0;
                        Sl4PkgSum += valueObj.fleetLoads ? valueObj.fleetLoads : 0;
                        Sl4Sum += valueObj.totalCost ? valueObj.totalCost : 0;
                    });

                    // Calculate greater than service level sum
                    if (item.serviceLevel <= inputServiceLevel) {
                        uptoInputSlPkgSum += Sl4PkgSum;
                    } else {
                        outOfInputSlPkgSum += Sl4PkgSum;
                    }
                }
                if (item.serviceLevel == 5) {
                    item["list"].forEach((valueObj) => {
                        Sl5PkgSum += valueObj.packageSpreed ? valueObj.packageSpreed : 0;
                        Sl5PkgSum += valueObj.ltlLoads ? valueObj.ltlLoads : 0;
                        Sl5PkgSum += valueObj.tlLoads ? valueObj.tlLoads : 0;
                        Sl5PkgSum += valueObj.fleetLoads ? valueObj.fleetLoads : 0;
                        Sl5Sum += valueObj.totalCost ? valueObj.totalCost : 0;
                    });

                    // Calculate greater than service level sum
                    if (item.serviceLevel <= inputServiceLevel) {
                        uptoInputSlPkgSum += Sl5PkgSum;
                    } else {
                        outOfInputSlPkgSum += Sl5PkgSum;
                    }
                }
                if (item.serviceLevel == 6) {
                    item["list"].forEach((valueObj) => {
                        Sl6PkgSum += valueObj.packageSpreed ? valueObj.packageSpreed : 0;
                        Sl6PkgSum += valueObj.ltlLoads ? valueObj.ltlLoads : 0;
                        Sl6PkgSum += valueObj.tlLoads ? valueObj.tlLoads : 0;
                        Sl6PkgSum += valueObj.fleetLoads ? valueObj.fleetLoads : 0;
                        Sl6Sum += valueObj.totalCost ? valueObj.totalCost : 0;
                    });

                    // Calculate greater than service level sum
                    // if (item.serviceLevel <= inputServiceLevel) {
                    //     gtInputSlPKgSum += Sl6PkgSum;
                    // }
                    gt6DaysSLPkgSum += Sl6PkgSum;
                }
                if (item.serviceLevel > 6) {
                    item["list"].forEach((valueObj) => {
                        Sl7PkgSum += valueObj.packageSpreed ? valueObj.packageSpreed : 0;
                        Sl7PkgSum += valueObj.ltlLoads ? valueObj.ltlLoads : 0;
                        Sl7PkgSum += valueObj.tlLoads ? valueObj.tlLoads : 0;
                        Sl7PkgSum += valueObj.fleetLoads ? valueObj.fleetLoads : 0;
                        Sl7Sum += valueObj.totalCost ? valueObj.totalCost : 0;
                    });

                    // Calculate greater than service level sum
                    // if (item.serviceLevel <= inputServiceLevel) {
                    //     gtInputSlPKgSum += Sl7PkgSum;
                    // }
                    gt6DaysSLPkgSum += Sl7PkgSum;
                }
            });

            var totalSlPkgSum = Sl1PkgSum + Sl2PkgSum + Sl3PkgSum + Sl4PkgSum + Sl5PkgSum + Sl6PkgSum + Sl7PkgSum;

            jsonArr.push([
                '',
                index == 0 ? scenarioType == "single" ? "Single Site" : sitesCount + " Sites" : "",
                siteItem["siteName"],
                siteItem["sumTotalCost"] / 1000000,
                scenarioType == "single" ? "100%" : treeLogicsController.getPercentageWithoutZero(siteItem["sumTotalCost"], scenarioSitesTotalCostSum),
                (siteItem["sumTotalCost"] / siteItem["sumTotalPackages"]),
                '',
                this.getPercentageWithoutZero(Sl1PkgSum, totalSlPkgSum),
                this.getPercentageWithoutZero(Sl2PkgSum, totalSlPkgSum),
                this.getPercentageWithoutZero(Sl3PkgSum, totalSlPkgSum),
                this.getPercentageWithoutZero(Sl4PkgSum, totalSlPkgSum),
                this.getPercentageWithoutZero(Sl5PkgSum, totalSlPkgSum),
                this.getPercentageWithoutZero(Sl6PkgSum, totalSlPkgSum),
                this.getPercentageWithoutZero(Sl7PkgSum, totalSlPkgSum),

                this.getPercentageWithoutZero(uptoInputSlPkgSum, totalSlPkgSum),
                this.getPercentageWithoutZero(outOfInputSlPkgSum, totalSlPkgSum),
                this.getPercentageWithoutZero(gt6DaysSLPkgSum, totalSlPkgSum)
            ]);
            if (scenarioType !== "single") {
                subTotalObj.totalCostValue += siteItem["sumTotalCost"] / 1000000;
                subTotalObj.totalPerValue += (siteItem["sumTotalCost"] * 100) / scenarioSitesTotalCostSum;
                subTotalObj.totalLoadValue += (siteItem["sumTotalCost"] / siteItem["sumTotalPackages"]);
                if (index === (groupedSites.length - 1)) {
                    jsonArr.push([
                        '',
                        sitesCount + " Sites",
                        'Subtotal',
                        subTotalObj.totalCostValue,
                        subTotalObj.totalPerValue,
                        subTotalObj.totalLoadValue,
                    ]);
                }
            }
        });
        let startRow = jsonArr.length - groupedSites.length + 6;
        if (scenarioType !== "single") {
            startRow--;
        }
        mergeArr.push((await this.prepareMergeRecord(startRow, 1, jsonArr.length - 1 + 6, 1)));
        return jsonArr;
    }

    static async calculateFinalSummaryDeliveryModeWise(parcelRaterStateWise, ltlRaterStateWise, tlRaterStateWise, fleetRaterStateWise, jsonArr, mergeArr) {

        var finalDeliveryModeArr = [];
        let raterProcessCount = 0;

        if (parcelRaterStateWise.length > 0) {
            let minCostSitesArr = treeLogicsController.getMinCostSitesItems(parcelRaterStateWise, "parcel");
            finalDeliveryModeArr = [...finalDeliveryModeArr, ...minCostSitesArr];
            raterProcessCount++;
        }

        if (ltlRaterStateWise.length > 0) {
            let minCostSitesArr = treeLogicsController.getMinCostSitesItems(ltlRaterStateWise, "ltl");
            finalDeliveryModeArr = [...finalDeliveryModeArr, ...minCostSitesArr];
            raterProcessCount++;
        }

        if (tlRaterStateWise.length > 0) {
            let minCostSitesArr = treeLogicsController.getMinCostSitesItems(tlRaterStateWise, "tl");
            finalDeliveryModeArr = [...finalDeliveryModeArr, ...minCostSitesArr];
            raterProcessCount++;
        }

        if (fleetRaterStateWise.length > 0) {
            let minCostSitesArr = treeLogicsController.getMinCostSitesItems(fleetRaterStateWise, "fleet");
            finalDeliveryModeArr = [...finalDeliveryModeArr, ...minCostSitesArr];
            raterProcessCount++;
        }

        let groupedSites = treeLogicsController.groupByDataList(finalDeliveryModeArr, "siteName");

        // Generate JSON
        let titleColunms = ['', 'Scenario', '', 'Delivery by Mode'];
        let subTitleColunms = ['', 'No. Sites', 'Location', ];

        let mergeStartFrom = jsonArr.length - 1 + 6; //rowsCount = 6;
        mergeArr.push(await this.prepareMergeRecord(mergeStartFrom + 1, 1, mergeStartFrom + 1, 2))


        if (parcelRaterStateWise.length > 0) {
            subTitleColunms.push('Parcel');
            titleColunms.push('');
        }
        if (ltlRaterStateWise.length > 0) {
            subTitleColunms.push('LTL');
            titleColunms.push('');
        }
        if (tlRaterStateWise.length > 0) {
            subTitleColunms.push('TL');
            titleColunms.push('');
        }
        if (fleetRaterStateWise.length > 0) {
            subTitleColunms.push('Fleet');
            titleColunms.push('');
        }
        subTitleColunms.push('Total');
        jsonArr.push(titleColunms);
        jsonArr.push(subTitleColunms);
        mergeArr.push(await this.prepareMergeRecord(mergeStartFrom + 1, 3, mergeStartFrom + 1, titleColunms.length - 1));
        let parcelTotalPkgSum = 0;
        let ltlTotalPkgSum = 0;
        let tlTotalPkgSum = 0;
        let fleetTotalPkgSum = 0;

        // Calculate total
        groupedSites.forEach((siteItem, index) => {

            let parcelSiteObj = siteItem["list"].find(o => o.raterType == "parcel");
            let ltlSiteObj = siteItem["list"].find(o => o.raterType == "ltl");
            let tlSiteObj = siteItem["list"].find(o => o.raterType == "tl");
            let fleetSiteObj = siteItem["list"].find(o => o.raterType == "fleet");

            parcelTotalPkgSum += parcelSiteObj ? parcelSiteObj.totalPkgSum : 0;
            ltlTotalPkgSum += ltlSiteObj ? ltlSiteObj.totalPkgSum : 0;
            tlTotalPkgSum += tlSiteObj ? tlSiteObj.totalPkgSum : 0;
            fleetTotalPkgSum += fleetSiteObj ? fleetSiteObj.totalPkgSum : 0;
        });

        groupedSites.forEach((siteItem, index) => {

            let parcelSiteObj = siteItem["list"].find(o => o.raterType == "parcel");
            let ltlSiteObj = siteItem["list"].find(o => o.raterType == "ltl");
            let tlSiteObj = siteItem["list"].find(o => o.raterType == "tl");
            let fleetSiteObj = siteItem["list"].find(o => o.raterType == "fleet");

            let valuesColunms = ['', groupedSites.length + ' Sites', siteItem["siteName"]],
                total = 0;
            if (parcelRaterStateWise.length > 0) {
                valuesColunms.push(parcelSiteObj ? treeLogicsController.getPercentageWithoutZero(parcelSiteObj.totalPkgSum, parcelTotalPkgSum) : "");
                total += parcelSiteObj ? ((parcelSiteObj.totalPkgSum / parcelTotalPkgSum) * 100) : 0;
            }
            if (ltlRaterStateWise.length > 0) {
                valuesColunms.push(ltlSiteObj ? treeLogicsController.getPercentageWithoutZero(ltlSiteObj.totalPkgSum, ltlTotalPkgSum) : "");
                total += ltlSiteObj ? ((ltlSiteObj.totalPkgSum / ltlTotalPkgSum) * 100) : 0;
            }
            if (tlRaterStateWise.length > 0) {
                valuesColunms.push(tlSiteObj ? treeLogicsController.getPercentageWithoutZero(tlSiteObj.totalPkgSum, tlTotalPkgSum) : "");
                total += tlSiteObj ? ((tlSiteObj.totalPkgSum / tlTotalPkgSum) * 100) : 0;
            }
            if (fleetRaterStateWise.length > 0) {
                valuesColunms.push(fleetSiteObj ? treeLogicsController.getPercentageWithoutZero(fleetSiteObj.totalPkgSum, fleetTotalPkgSum) : "");
                total += fleetSiteObj ? ((fleetSiteObj.totalPkgSum / fleetTotalPkgSum) * 100) : 0;
            }
            valuesColunms.push(total.toFixed(2).concat('%'));
            jsonArr.push(valuesColunms);
        });
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length - groupedSites.length + 6, 1, jsonArr.length - 1 + 6, 1))
        return jsonArr;
    }

    //==================================== Port Process =============================================

    // this will calculate corffOfVar
    static async calculateCorffOf(portData) {
        const actualTotalArray = [];
        portData.map((port) => {
            const maidenDayAnchor = port.MedianDaysAnchor != "" && port.MedianDaysAnchor ? Number(port.MedianDaysAnchor) : 0;
            const medianDaysPort = port.MedianDaysPort != "" && port.MedianDaysPort ? Number(port.MedianDaysPort) : 0;
            const sum = maidenDayAnchor + medianDaysPort
            port.actualTotalAfterSum = sum;
            actualTotalArray.push(sum);
            return port;
        });
        const removedZeroFromActualTotalArray = actualTotalArray.filter(function (a) {
            return a != 0
        });
        const mean = await this.getMean(removedZeroFromActualTotalArray);
        const standardDeviation = await this.getStandardDeviation(removedZeroFromActualTotalArray, mean)
        const CorffOfVar = standardDeviation / mean;
        return Math.round((CorffOfVar + Number.EPSILON) * 100) / 100;
    }

    // this will calculate mean
    static async getMean(removedZeroFromActualTotalArray) {
        const sumOfArr = removedZeroFromActualTotalArray.reduce((a, b) => a + b, 0);
        const avg = (sumOfArr / removedZeroFromActualTotalArray.length) || 0;
        return avg;
    }

    // this will calculate standard deviation
    static async getStandardDeviation(removedZeroFromActualTotalArray, mean) {

        let n = removedZeroFromActualTotalArray.length;

        removedZeroFromActualTotalArray.forEach((number, index) => {
            let squareOfTheDistanceFromMean = Math.pow((number - mean), 2);
            removedZeroFromActualTotalArray[index] = squareOfTheDistanceFromMean;
        });

        let sigmaOfSquareOfTheDistanceFromMean = removedZeroFromActualTotalArray.reduce((a, b) => a + b, 0);

        return Math.sqrt(sigmaOfSquareOfTheDistanceFromMean / n);
    }

    static async getReliability(cov) {
        if (cov <= 0.1) {
            return 10;
        } else if (cov > 0.1 && cov <= 0.2) {
            return 9;
        } else if (cov > 0.2 && cov <= 0.3) {
            return 8;
        } else if (cov > 0.3 && cov <= 0.4) {
            return 7;
        } else if (cov > 0.4 && cov <= 0.5) {
            return 6;
        } else if (cov > 0.5 && cov <= 0.6) {
            return 5;
        } else if (cov > 0.6 && cov <= 0.7) {
            return 4;
        } else if (cov > 0.7 && cov <= 0.8) {
            return 3;
        } else if (cov > 0.8 && cov <= 0.9) {
            return 2;
        } else if (cov > 0.9 && cov <= 1) {
            return 1;
        } else {
            return 0;
        }
    }

    static async swapDates(requiredDaysData) {
        let tempArr = requiredDaysData[0] ? requiredDaysData[0] : "";
        requiredDaysData[0] = requiredDaysData[1] ? requiredDaysData[1] : "";
        requiredDaysData[1] = tempArr;
        return requiredDaysData;
    }

    static async getLastTwoWeekSaturdayDates(currentDate) {
        const currentDay = currentDate.getDay();
        const dateArray = [];
        if (currentDay === 6) {
            dateArray.push(currentDate);
            dateArray.push(new Date(currentDate.getTime() - 60 * 60 * 24 * 7 * 1000));
        } else {
            const getPreviousWeekDate = new Date(currentDate.getTime() - 60 * 60 * 24 * 7 * 1000);
            const dayDifference = 6 - getPreviousWeekDate.getDay();
            const lastSaturdayDate = new Date(getPreviousWeekDate.getTime() + 60 * 60 * 24 * dayDifference * 1000);
            dateArray.push(lastSaturdayDate);
            dateArray.push(new Date(lastSaturdayDate.getTime() - 60 * 60 * 24 * 7 * 1000))
        }
        return dateArray;
    }

    static async getLastWeekSaturdayDate(currentDate) {
        const currentDay = currentDate.getDay();
        if (currentDay === 6) {
            return currentDate;
        } else {
            const getPreviousWeekDate = new Date(currentDate.getTime() - 60 * 60 * 24 * 7 * 1000);
            const dayDifference = 6 - getPreviousWeekDate.getDay();
            return new Date(getPreviousWeekDate.getTime() + 60 * 60 * 24 * dayDifference * 1000);
        }
    }

    static async calculateRegionReliability(portDataList, Region) {
        const RegionPortData = this.filterItemsInDataList(portDataList, "Region", Region);
        const groupDataByPortName = this.groupByDataList(RegionPortData, 'SheetName');

        let totalCorffOfVar = 0;
        for (let i = 0; i < groupDataByPortName.length; i++) {
            const calculateCorffOfVarActualTotalForPort = await this.calculateCorffOf(groupDataByPortName[i].list);
            totalCorffOfVar += calculateCorffOfVarActualTotalForPort;
        }
        return totalCorffOfVar / groupDataByPortName.length;
    }

    static async calculateWeekFromDate(thisDate) {
        const currentDate = new Date(thisDate)
        const date = new Date(currentDate.getTime());
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const year = date.getFullYear();
        const weekOne = new Date(date.getFullYear(), 0, 4);
        const weekNumber = 1 + Math.round(((date.getTime() - weekOne.getTime()) / 86400000 - 3 + (weekOne.getDay() + 6) % 7) / 7);

        return {
            weekNumber,
            year
        };
    }

    static async getWeeksForDates(weekDates) {
        return [await this.calculateWeekFromDate(weekDates[0]), await this.calculateWeekFromDate(weekDates[1])];
    }

    static async getWeekData(portData, getWeeks) {
        const weekData = [];
        for (let i = 0; i < portData.length; i++) {
            for (let j = 0; j < getWeeks.length; j++) {
                if (Number(portData[i].Week) === Number(getWeeks[j].weekNumber) && Number(portData[i].Year) === Number(getWeeks[j].year)) {
                    weekData.push(portData[i])
                }
            }
        }
        return weekData;
    }

    static async getBondedDatesForData(portData, selectedPorts) {
        const filterSinglePortData = this.filterItemsInDataList(portData, "SheetName", selectedPorts[0]);
        return {
            startDate: filterSinglePortData[0].Date,
            endDate: filterSinglePortData[filterSinglePortData.length - 1].Date
        };
    }

    static async getReportDates(params) {
        const {
            startAndEndDateOfData,
        } = params;
        let {
            selectedDate,
            comparisonDate
        } = params;
        selectedDate = this.getRealDate(selectedDate);
        const currentDate = new Date(selectedDate);
        const currentPortDate = this.getPortFormattedDate(moment(currentDate).format('M/D/YY'));
        const currentPortYear = currentDate.getFullYear();
        let vesselOffloadDates;
        comparisonDate = this.getRealDate(comparisonDate);
        const currentComparisonDate = new Date(comparisonDate);
        const currentComparisonPortDate = this.getPortFormattedDate(moment(currentComparisonDate).format('M/D/YY'));

        if (currentDate.getTime() < new Date(startAndEndDateOfData.startDate).getTime()) {
            selectedDate = new Date(startAndEndDateOfData.startDate);
            const vesselOffloadSelectedDate = this.getPortFormattedDate(moment(selectedDate).format('M/D/YY'));
            // vesselOffloadDates = new Date(vesselOffloadSelectedDate).getTime > new Date(currentComparisonPortDate).getTime() ?
            //     [vesselOffloadSelectedDate, currentComparisonPortDate] : [currentComparisonPortDate, vesselOffloadSelectedDate];
            vesselOffloadDates = [vesselOffloadSelectedDate, currentComparisonPortDate];
        }
        if (currentDate.getTime() >= new Date(startAndEndDateOfData.startDate).getTime() && currentDate.getTime() <= new Date(startAndEndDateOfData.endDate).getTime()) {
            // vesselOffloadDates = new Date(currentPortDate).getTime > new Date(currentComparisonPortDate).getTime() ?
            //     [currentPortDate, currentComparisonPortDate] : [currentComparisonPortDate, currentPortDate];
            vesselOffloadDates = [currentPortDate, currentComparisonPortDate];
        }
        if (currentDate.getTime() > new Date(startAndEndDateOfData.endDate).getTime()) {
            selectedDate = new Date(startAndEndDateOfData.endDate);
            const vesselOffloadSelectedDate = this.getPortFormattedDate(moment(selectedDate).format('M/D/YY'));
            // vesselOffloadDates = new Date(vesselOffloadSelectedDate).getTime > new Date(currentComparisonPortDate).getTime() ?
            //     [vesselOffloadSelectedDate, currentComparisonPortDate] : [currentComparisonPortDate, vesselOffloadSelectedDate];
            vesselOffloadDates = [vesselOffloadSelectedDate, currentComparisonPortDate];
        }

        const getLastTwoWeekDates = await this.getLastTwoWeekSaturdayDates(new Date(vesselOffloadDates[0]));
        const getLastTwoWeekDatesForComparisonDate = await this.getLastTwoWeekSaturdayDates(new Date(vesselOffloadDates[1]));
        const lastSaturdayForSelectedDateWeek = this.getPortFormattedDate(moment(getLastTwoWeekDates[0]).format('M/D/YY'));
        const lastSaturdayForPreviousWeekFromLastWeek = this.getPortFormattedDate(moment(getLastTwoWeekDatesForComparisonDate[0]).format('M/D/YY'));
        const WeekDates = [lastSaturdayForSelectedDateWeek, lastSaturdayForPreviousWeekFromLastWeek];
        const threeDaysDatesForSelectedDate = [
            this.getPortFormattedDate(moment(new Date(new Date(vesselOffloadDates[0]).getTime() - 2 * 24 * 60 * 60 * 1000)).format('M/D/YY')),
            this.getPortFormattedDate(moment(new Date(new Date(vesselOffloadDates[0]).getTime() - 24 * 60 * 60 * 1000)).format('M/D/YY')),
            vesselOffloadDates[0]
        ];
        const threeDaysDatesForComparisonDate = [
            this.getPortFormattedDate(moment(new Date(new Date(vesselOffloadDates[1]).getTime() - 2 * 24 * 60 * 60 * 1000)).format('M/D/YY')),
            this.getPortFormattedDate(moment(new Date(new Date(vesselOffloadDates[1]).getTime() - 24 * 60 * 60 * 1000)).format('M/D/YY')),
            vesselOffloadDates[1]
        ];

        const getWeeks = await this.getWeeksForDates(WeekDates);
        return {
            DayDates: vesselOffloadDates,
            WeekDates,
            getWeeks,
            threeDayDatesForCurrentDate: threeDaysDatesForSelectedDate,
            threeDayDatesForOtherDate: threeDaysDatesForComparisonDate,
            currentPortYear
        }

    }

    static async getPortRaterMainDataJson(
        portRegionsList = [],
        selectedLoCodes = [],
        comparisonDate,
        selectedDate,
        portDataList,
    ) {
        try {
            const startAndEndDateOfData = await this.getBondedDatesForData(portDataList, selectedLoCodes);
            //---------------------------------------------------------------------Date Selection---------------------------------------------------------------------------------------

            const params = {
                selectedDate: JSON.parse(selectedDate),
                startAndEndDateOfData,
                comparisonDate: comparisonDate ? JSON.parse(comparisonDate) : ""
            };

            const {
                DayDates,
                WeekDates,
                getWeeks,
                threeDayDatesForCurrentDate,
                threeDayDatesForOtherDate,
                currentPortYear
            } = await this.getReportDates(params);

            //--------------------------------------------------------------------Prepareing Main Json for Port Summary Report---------------------------------------------------------------------------------
            const finalOutput = [];
            // Run loop to calculate data
            for (const portLoCode of selectedLoCodes) {
                const findPortRegion = portRegionsList.find(portRegionData => portRegionData.LoCode === portLoCode);
                let portData = this.filterItemsInDataList(portDataList, "SheetName", portLoCode);

                if (portData.length > 0) {
                    // this will calculate COV and standard deviation
                    const calculateCorffOfVarActualTotalForPort = await this.calculateCorffOf(portData);

                    // this will calculate reliability
                    const reliability = await this.getReliability(calculateCorffOfVarActualTotalForPort);

                    let requiredDaysDataForDay = portData.filter(obj => DayDates.includes(obj.Date));
                    let requiredDaysDataForWeek = portData.filter(obj => WeekDates.includes(obj.Date));
                    const weekData = await this.getWeekData(portData, getWeeks);

                    if (requiredDaysDataForWeek.length < 2) {
                        if (requiredDaysDataForWeek.length === 1) {
                            if (WeekDates[1] == requiredDaysDataForWeek[0].Date) {
                                requiredDaysDataForWeek.push({
                                    Date: WeekDates[0],
                                    Year: currentPortYear
                                })
                            }
                            if (WeekDates[0] == requiredDaysDataForWeek[0].Date) {
                                requiredDaysDataForWeek.splice(0, 0, {
                                    Date: WeekDates[1],
                                    Year: currentPortYear
                                })
                            }
                        }
                        if (requiredDaysDataForWeek.length === 0) {
                            requiredDaysDataForWeek.push({
                                Date: WeekDates[1],
                                Year: currentPortYear
                            }, {
                                Date: WeekDates[0],
                                Year: currentPortYear
                            })
                        }
                    }

                    if (requiredDaysDataForDay.length < 2) {
                        if (requiredDaysDataForDay.length === 1) {
                            if (DayDates[1] == requiredDaysDataForDay[0].Date) {
                                requiredDaysDataForDay.push({
                                    Date: DayDates[0],
                                    Year: currentPortYear
                                })
                            }
                            if (DayDates[0] == requiredDaysDataForDay[0].Date) {
                                requiredDaysDataForDay.splice(0, 0, {
                                    Date: DayDates[1],
                                    Year: currentPortYear
                                })
                            }
                        }
                        if (requiredDaysDataForDay.length === 0) {
                            requiredDaysDataForDay.push({
                                Date: DayDates[1],
                                Year: currentPortYear
                            }, {
                                Date: DayDates[0],
                                Year: currentPortYear
                            })
                        }
                    }

                    //swaping dates
                    const swappedDayDate = await this.swapDates(requiredDaysDataForDay);
                    const swappedWeekDate = await this.swapDates(requiredDaysDataForWeek);
                    const swappedWeekData = await this.swapDates(weekData);

                    let DatesList = [];
                    let DatesWeekList = [];
                    // Run the loop for dates
                    for (let i = 0; i < DayDates.length; i++) {
                        let threeDateAverageCalculatingDates = (threeDayDatesForCurrentDate[threeDayDatesForCurrentDate.length - 1] == swappedDayDate[i]["Date"]) ? threeDayDatesForCurrentDate : threeDayDatesForOtherDate;
                        let threeDatePortRequiredData = portData.filter(obj => threeDateAverageCalculatingDates.includes(obj.Date));

                        let threeDayTotal = "0";
                        if (threeDatePortRequiredData.length > 0) {
                            for (let j = 0; j < threeDatePortRequiredData.length; j++) {
                                const sum = this.sumTotalContainersOfDate(threeDatePortRequiredData[j])
                                if (typeof sum === "number") {
                                    threeDayTotal = Number(threeDayTotal) + sum;
                                }
                            }
                        }

                        DatesList.push({
                            Date: swappedDayDate[i] ? swappedDayDate[i]["Date"] : DayDates[i],
                            Year: swappedDayDate[i] ? swappedDayDate[i]["Year"] : currentPortYear,
                            Containers: swappedDayDate[i] ? swappedDayDate[i]["Containers"] || swappedDayDate[i]["Containers"] === 0 ? parseFloat(swappedDayDate[i]["Containers"]) : "0" : "0",
                            Total: typeof this.sumTotalContainersOfDate(swappedDayDate[i]) === "number" ? this.sumTotalContainersOfDate(swappedDayDate[i]) : "0",
                            ThreeDaysAverage: typeof threeDayTotal === "number" ? Number((threeDayTotal / threeDatePortRequiredData.length).toFixed(2)) : "0",
                            type: 'VesselOffloads'
                        });

                        const MedianDaysAnchor = swappedWeekData[i] ? swappedWeekData[i]["MedianDaysAnchor"] || swappedWeekData[i]["MedianDaysAnchor"] === 0 ? swappedWeekData[i]["MedianDaysAnchor"] : "0" : "0";
                        const MedianDaysPort = swappedWeekData[i] ? swappedWeekData[i]["MedianDaysPort"] || swappedWeekData[i]["MedianDaysPort"] === 0 ? swappedWeekData[i]["MedianDaysPort"] : "0" : "0";

                        DatesWeekList.push({
                            Date: swappedWeekDate[i] ? swappedWeekDate[i]["Date"] : WeekDates[i],
                            Year: swappedWeekDate[i] ? swappedWeekDate[i]["Year"] : currentPortYear,
                            MedianDaysAnchor,
                            MedianDaysPort,
                            ActualTotal: MedianDaysAnchor === "0" && MedianDaysPort === "0" ? "0" : Number(MedianDaysAnchor) + Number(MedianDaysPort),
                            type: 'WeeklyPortEfficiency'
                        });
                    }

                    // Prepare final output
                    finalOutput.push({
                        Region: findPortRegion.Region,
                        Country: findPortRegion.Country,
                        PortName: findPortRegion.PortName,
                        LoCode: portData[0].LoCode,
                        COVarActualTotal: calculateCorffOfVarActualTotalForPort,
                        reliability,
                        DatesList: DatesList,
                        DatesWeekList
                    });
                }
            }
            const groupByRegion = this.groupByDataList(finalOutput, 'Region');
            // console.log(JSON.stringify(groupByRegion))

            return groupByRegion;

        } catch (err) {
            return err;
        }
    }

    static async prepareMergeRecord(startRow, startColumn, endRow, endColumn) {
        let mergeRec = {
            s: {
                r: startRow,
                c: startColumn
            },
            e: {
                r: endRow,
                c: endColumn
            }
        }
        return mergeRec;
    }

    static async getColorForReliability(reliability) {
        switch (reliability) {
            case 10:
                return '004d00';
                break;
            case 9:
                return '008000';
                break;
            case 8:
                return 'b3ffb3';
                break;
            case 7:
                return 'ccffcc';
                break;
            case 6:
                return 'ccff33';
                break;
            case 5:
                return 'ffff00';
                break;
            case 4:
                return 'ffcc00';
                break;
            case 3:
                return 'ffb3b3';
                break;
            case 2:
                return 'ff8080';
                break;
            case 1:
                return 'ff0000';
                break;
            default:
                return 'ffffff'
        }
    }

    static async getExcelJsonForPortRater(portRaterMainJson, styleOpts = {}) {

        const DatesList = portRaterMainJson[0].list[0]["DatesList"];
        const DatesWeekList = portRaterMainJson[0].list[0]["DatesWeekList"];

        const trendPercent = 2 / 100;
        const datesCount = DatesList.length;


        const dateColCount = DatesList.length;
        const trendColCount = 1;
        const vesselOffloadFieldDateAndTrendCount = 3;
        const weeklyPortEfficiencyFieldDateAndTrendCount = 3;
        const reliabilityFieldCount = 1;
        const actualTotalFieldCount = 1;
        const singleSpaceCount = 1;
        const totalPortDetailsFieldCount = 4;
        const totalOfVesselAndWeekCountFields = vesselOffloadFieldDateAndTrendCount + weeklyPortEfficiencyFieldDateAndTrendCount;
        const datesCountInc = datesCount + 1;

        // Start to set Excel JSON
        const columnCount = ((dateColCount + trendColCount) * totalOfVesselAndWeekCountFields) + singleSpaceCount + singleSpaceCount + totalPortDetailsFieldCount + reliabilityFieldCount + actualTotalFieldCount;
        const mergeArr = [];
        const rowsCount = portRaterMainJson.length + 6;
        const currencyColArr = [];
        const boldRowArr = [0];
        const colorRowArr = [];
        const jsonArr = [];
        const centerAlignmentArr = [];
        const headingSizeArray = [0];
        const leftThickBoarderColArr = [1, singleSpaceCount + totalPortDetailsFieldCount + (vesselOffloadFieldDateAndTrendCount * datesCountInc) + 1];
        const blankBoarderArrayCol = [0, 14];
        const topThickBoarderRowArr = [2];
        const rightThickBoarderColArr = [columnCount - 1, singleSpaceCount + totalPortDetailsFieldCount + (vesselOffloadFieldDateAndTrendCount * datesCountInc) - 1, singleSpaceCount + totalPortDetailsFieldCount + datesCountInc - 1, , singleSpaceCount + totalPortDetailsFieldCount - 1];
        const bottomThickBorderRowArr = [4];
        const rightThinBoarderColArr = [singleSpaceCount + totalPortDetailsFieldCount + (datesCountInc * 2) - 1, (singleSpaceCount * 4) + totalPortDetailsFieldCount + (datesCountInc * 4) - 1]
        const rightDoubleBoarderColArr = [(singleSpaceCount * 4) + totalPortDetailsFieldCount + (datesCountInc * 5) - 1];
        const bottomDoubleBoarderColArr = [];
        const yellowColorArray = [];
        const overAllSummaryStyleArray = [];
        const textRotationField = [16];
        const columnLengthArray = [];
        const fontSizeEightArray = [];
        const fontSizeElevenArray = [];

        // prepare header for and merge cols
        // row 1
        mergeArr.push(await this.prepareMergeRecord(0, 0, 1, columnCount))
        jsonArr.push(['Port Analysis Scorecard']);

        mergeArr.push(await this.prepareMergeRecord(2, 1, 2, totalPortDetailsFieldCount));
        mergeArr.push(await this.prepareMergeRecord(2, totalPortDetailsFieldCount + 1, 2, (totalPortDetailsFieldCount + 1) + (vesselOffloadFieldDateAndTrendCount * (dateColCount + trendColCount)) - 1));
        mergeArr.push(await this.prepareMergeRecord(2, (totalPortDetailsFieldCount + 1) + (vesselOffloadFieldDateAndTrendCount * (dateColCount + trendColCount)) + 1, 2, columnCount - 1));
        jsonArr.push(['', 'Port Detail', '', '', '', 'Vessel Offloads', '', '', '', '', '', '', '', '', '', 'Weekly Port Efficiency (Days)', '', '', '', '', '', '', '', '', '', '']);
        boldRowArr.push(2);

        // row 2 and row 3
        var headRow1 = ['', 'Focus', 'Country', 'Port', 'Locode'];
        var headRow2 = ['', '', '', '', ''];
        mergeArr.push(await this.prepareMergeRecord(3, 1, 4, 1));
        mergeArr.push(await this.prepareMergeRecord(3, 2, 4, 2));
        mergeArr.push(await this.prepareMergeRecord(3, 3, 4, 3));
        mergeArr.push(await this.prepareMergeRecord(3, 4, 4, 4));

        DatesList.forEach(item => {
            headRow1.push('Container');
            headRow2.push(item.Date);
        });
        headRow1.push('Container');
        headRow2.push("Trend");
        mergeArr.push(await this.prepareMergeRecord(3, (datesCountInc * 0 + 5), 3, (datesCountInc * 0 + 5) + datesCount));

        DatesList.forEach(item => {
            headRow1.push('Commercial');
            headRow2.push(item.Date);
        });
        headRow1.push('Commercial');
        headRow2.push("Trend");
        mergeArr.push(await this.prepareMergeRecord(3, (datesCountInc * 1 + 5), 3, (datesCountInc * 1 + 5) + datesCount));

        DatesList.forEach(item => {
            headRow1.push('3 Day Average');
            headRow2.push(item.Date);
        });
        headRow1.push('3 Day Average');
        headRow2.push("Trend");
        mergeArr.push(await this.prepareMergeRecord(3, (datesCountInc * 2 + 5), 3, (datesCountInc * 2 + 5) + datesCount));

        headRow1.push('', 'Actual\nTotal', 'Reliability');
        fontSizeEightArray.push(15, 16)
        leftThickBoarderColArr.push(16);
        rightThickBoarderColArr.push(16);
        headRow2.push('', '', '');
        mergeArr.push(await this.prepareMergeRecord(3, (datesCountInc * 3 + 6), 4, (datesCountInc * 3 + 6)));
        mergeArr.push(await this.prepareMergeRecord(3, (datesCountInc * 3 + 7), 4, (datesCountInc * 3 + 7)));

        DatesWeekList.forEach(item => {
            headRow1.push('Anchor (Days)');
            headRow2.push(item.Date);
        });
        headRow1.push('Anchor (Days)');
        headRow2.push("Trend");
        mergeArr.push(await this.prepareMergeRecord(3, (datesCountInc * 3 + 8), 3, (datesCountInc * 3 + 8) + datesCount));

        DatesWeekList.forEach(item => {
            headRow1.push('Port (Days)');
            headRow2.push(item.Date);
        });
        headRow1.push('Port (Days)');
        headRow2.push("Trend");
        mergeArr.push(await this.prepareMergeRecord(3, (datesCountInc * 4 + 8), 3, (datesCountInc * 4 + 8) + datesCount));

        DatesWeekList.forEach(item => {
            headRow1.push('Total (Days)');
            headRow2.push(item.Date);
        });
        headRow1.push('Total Days)');
        headRow2.push("Trend");
        mergeArr.push(await this.prepareMergeRecord(3, (datesCountInc * 5 + 8), 3, (datesCountInc * 5 + 8) + datesCount));

        jsonArr.push(headRow1);
        jsonArr.push(headRow2);
        fontSizeElevenArray.push(4);

        //----------------------------------------------------------------Find overall report for multi region sites-------------------------------------------------------------------------------
        let isOverAllTotalFound;
        let overAllUSTotal = ['', 'US Overall', '', '', ''];
        const usRegionData = portRaterMainJson.filter(port => port.Region.split("-")[0] === 'US');
        let overAllAverage;
        if (usRegionData.length > 1) {

            isOverAllTotalFound = true;
            let usRegionWiseOverAllTotalForDay = [];
            let usRegionWiseOverAllTotalForWeek = [];
            let avgOfSubTotal = [];

            for (let i = 0; i < usRegionData.length; i++) {
                let sumOfSubTotal = 0;
                let nOfSubTotal = 0;
                for (let k = 0; k < usRegionData[i].list.length; k++) {
                    nOfSubTotal += 1;
                    sumOfSubTotal += usRegionData[i].list[k].COVarActualTotal;
                    usRegionWiseOverAllTotalForDay = [...usRegionWiseOverAllTotalForDay, ...usRegionData[i].list[k]["DatesList"]];
                    usRegionWiseOverAllTotalForWeek = [...usRegionWiseOverAllTotalForWeek, ...usRegionData[i].list[k]["DatesWeekList"]];
                }
                avgOfSubTotal.push(Math.round(((sumOfSubTotal / nOfSubTotal) + Number.EPSILON) * 100) / 100);
            }

            overAllAverage = await this.averageCalculate(avgOfSubTotal)
            const groupedDatesForOverAllTotalList = this.groupByDataList(usRegionWiseOverAllTotalForDay, "Date");
            const groupedDatesForOverAllTotalListForWeek = this.groupByDataList(usRegionWiseOverAllTotalForWeek, "Date");

            const containersOverAllTotalArr = [];
            let hideTrendForOverAllRegions = false;
            await groupedDatesForOverAllTotalList.forEach(async item => {
                const sumOfContainer = this.sumNonZeroArrayItems(item.list, "Containers");
                if (sumOfContainer === "N/A") {
                    hideTrendForOverAllRegions = true;
                }
                overAllUSTotal.push(sumOfContainer);
                containersOverAllTotalArr.push(sumOfContainer);
            });
            overAllUSTotal.push(hideTrendForOverAllRegions ? "N/A" : (containersOverAllTotalArr[0] > (containersOverAllTotalArr[1] * (1 + trendPercent))) ? "⬆" : (containersOverAllTotalArr[0] < (containersOverAllTotalArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
            hideTrendForOverAllRegions = false;

            const totalOverAllTotalArr = [];
            await groupedDatesForOverAllTotalList.forEach(async item => {
                const sumOfTotal = this.sumNonZeroArrayItems(item.list, "Total");
                if (sumOfTotal === "N/A") {
                    hideTrendForOverAllRegions = true;
                }
                overAllUSTotal.push(sumOfTotal);
                totalOverAllTotalArr.push(sumOfTotal);
            });
            overAllUSTotal.push(hideTrendForOverAllRegions ? "N/A" : (totalOverAllTotalArr[0] > (totalOverAllTotalArr[1] * (1 + trendPercent))) ? "⬆" : (totalOverAllTotalArr[0] < (totalOverAllTotalArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
            hideTrendForOverAllRegions = false;

            const threeDayAvgOverAllTotalArr = [];
            await groupedDatesForOverAllTotalList.forEach(async item => {
                const sumOfThreeDaysAvg = this.sumNonZeroArrayItems(item.list, "ThreeDaysAverage");
                if (sumOfThreeDaysAvg === "N/A") {
                    hideTrendForOverAllRegions = true;
                }
                overAllUSTotal.push(sumOfThreeDaysAvg);
                threeDayAvgOverAllTotalArr.push(sumOfThreeDaysAvg);
            });
            overAllUSTotal.push(hideTrendForOverAllRegions ? "N/A" : (threeDayAvgOverAllTotalArr[0] > (threeDayAvgOverAllTotalArr[1] * (1 + trendPercent))) ? "⬆" : (threeDayAvgOverAllTotalArr[0] < (threeDayAvgOverAllTotalArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
            hideTrendForOverAllRegions = false;

            overAllUSTotal.push('');
            overAllUSTotal.push(Math.round((overAllAverage + Number.EPSILON) * 100) / 100);
            overAllUSTotal.push(await this.getReliability(overAllAverage));

            const medianDayAnchorOverAllTotalArr = [];
            await groupedDatesForOverAllTotalListForWeek.forEach(async item => {
                const medianDaysAnchor = this.averageNonZeroArrayItems(item.list, "MedianDaysAnchor");
                const sumOfAnchor = medianDaysAnchor === "N/A" ? medianDaysAnchor : Math.round((medianDaysAnchor + Number.EPSILON) * 100) / 100;
                if (sumOfAnchor === "N/A") {
                    hideTrendForOverAllRegions = true;
                }
                overAllUSTotal.push(sumOfAnchor);
                medianDayAnchorOverAllTotalArr.push(sumOfAnchor);
            });
            overAllUSTotal.push(hideTrendForOverAllRegions ? "N/A" : (medianDayAnchorOverAllTotalArr[0] > (medianDayAnchorOverAllTotalArr[1] * (1 + trendPercent))) ? "⬆" : (medianDayAnchorOverAllTotalArr[0] < (medianDayAnchorOverAllTotalArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
            hideTrendForOverAllRegions = false;

            const medianDaysPortOverAllTotalArr = [];
            await groupedDatesForOverAllTotalListForWeek.forEach(async item => {
                const medianDayPort = this.averageNonZeroArrayItems(item.list, "MedianDaysPort");
                const sumOfMedianDaysPort = medianDayPort === "N/A" ? medianDayPort : Math.round((medianDayPort + Number.EPSILON) * 100) / 100;
                if (sumOfMedianDaysPort === "N/A") {
                    hideTrendForOverAllRegions = true;
                }
                overAllUSTotal.push(sumOfMedianDaysPort);
                medianDaysPortOverAllTotalArr.push(sumOfMedianDaysPort);
            });
            overAllUSTotal.push(hideTrendForOverAllRegions ? "N/A" : (medianDaysPortOverAllTotalArr[0] > (medianDaysPortOverAllTotalArr[1] * (1 + trendPercent))) ? "⬆" : (medianDaysPortOverAllTotalArr[0] < (medianDaysPortOverAllTotalArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
            hideTrendForOverAllRegions = false;

            const actualTotalOverAllTotalArr = [];
            await groupedDatesForOverAllTotalListForWeek.forEach(async item => {
                const actualTotal = this.averageNonZeroArrayItems(item.list, "ActualTotal");
                const sumOfActualTotal = actualTotal === "N/A" ? actualTotal : Math.round((actualTotal + Number.EPSILON) * 100) / 100;
                if (sumOfActualTotal === "N/A") {
                    hideTrendForOverAllRegions = true;
                }
                overAllUSTotal.push(sumOfActualTotal);
                actualTotalOverAllTotalArr.push(sumOfActualTotal);
            });
            overAllUSTotal.push(hideTrendForOverAllRegions ? "N/A" : (actualTotalOverAllTotalArr[0] > (actualTotalOverAllTotalArr[1] * (1 + trendPercent))) ? "⬆" : (actualTotalOverAllTotalArr[0] < (actualTotalOverAllTotalArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
        }
        // console.log(overAllUSTotal);
        //--------------------------------------------------------------------------find subtotal of region----------------------------------------------------------------------------------------
        let totalRegionDataStartLength = 0;
        let totalRegionDataEndLength = 0;
        let isUsRegion;
        let topBoarderAddedForUs = false;
        let allDatesItems = [];
        let allDatesItemsForWeek = [];
        let subTotalAverageOfActualTotalArray = [];
        for (let i = 0; i < portRaterMainJson.length; i++) {
            let regionWiseSubTotal = [];
            let regionWiseSubTotalForWeek = [];

            if (portRaterMainJson[i].Region.split('-')[0] === 'US') {
                if (isOverAllTotalFound) {
                    isOverAllTotalFound = false;
                    jsonArr.push(overAllUSTotal);
                    bottomDoubleBoarderColArr.push(jsonArr.length);
                    overAllSummaryStyleArray.push(jsonArr.length);
                    topThickBoarderRowArr.push(jsonArr.length);
                    topBoarderAddedForUs = true;
                    mergeArr.push(await this.prepareMergeRecord(jsonArr.length, 1, jsonArr.length, 4));
                }
                isUsRegion = true;
            } else {
                isUsRegion = false;
            }
            totalRegionDataStartLength = jsonArr.length + 1;
            if (portRaterMainJson[i].list.length > 1) {
                let subTotalSumOfActualTotal = 0;
                let incNum = 0;
                for (let k = 0; k < portRaterMainJson[i].list.length; k++) {
                    subTotalSumOfActualTotal += portRaterMainJson[i].list[k].COVarActualTotal;
                    incNum += 1;
                    regionWiseSubTotal = [...regionWiseSubTotal, ...portRaterMainJson[i].list[k]["DatesList"]];
                    regionWiseSubTotalForWeek = [...regionWiseSubTotalForWeek, ...portRaterMainJson[i].list[k]["DatesWeekList"]];
                }

                const groupedDatesForSubTotalList = this.groupByDataList(regionWiseSubTotal, "Date");
                const groupedDatesForSubTotalListForWeek = this.groupByDataList(regionWiseSubTotalForWeek, "Date");
                let subTotalField = ['', portRaterMainJson[i].Region, `${portRaterMainJson[i].Region} Subtotal`, '', ''];
                // calculate SubTotal
                let hideSubTotalTrend = false;
                const containersSubTotalArr = [];
                await groupedDatesForSubTotalList.forEach(async item => {
                    const sumOfContainer = this.sumNonZeroArrayItems(item.list, "Containers");
                    if (sumOfContainer === "N/A") {
                        hideSubTotalTrend = true;
                    }
                    subTotalField.push(sumOfContainer);
                    containersSubTotalArr.push(sumOfContainer);
                });
                subTotalField.push(hideSubTotalTrend ? "N/A" : (containersSubTotalArr[0] > (containersSubTotalArr[1] * (1 + trendPercent))) ? "⬆" : (containersSubTotalArr[0] < (containersSubTotalArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
                hideSubTotalTrend = false;

                const totalSubTotalArr = [];
                await groupedDatesForSubTotalList.forEach(async item => {
                    const sumOfTotal = this.sumNonZeroArrayItems(item.list, "Total");
                    if (sumOfTotal === "N/A") {
                        hideSubTotalTrend = true;
                    }
                    subTotalField.push(sumOfTotal);
                    totalSubTotalArr.push(sumOfTotal);
                });
                subTotalField.push(hideSubTotalTrend ? "N/A" : (totalSubTotalArr[0] > (totalSubTotalArr[1] * (1 + trendPercent))) ? "⬆" : (totalSubTotalArr[0] < (totalSubTotalArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
                hideSubTotalTrend = false;

                const threeDayAvgSubTotalArr = [];
                await groupedDatesForSubTotalList.forEach(async item => {
                    const sumOfThreeDaysAvg = this.sumNonZeroArrayItems(item.list, "ThreeDaysAverage");
                    if (sumOfThreeDaysAvg === "N/A") {
                        hideSubTotalTrend = true;
                    }
                    subTotalField.push(sumOfThreeDaysAvg);
                    threeDayAvgSubTotalArr.push(sumOfThreeDaysAvg);
                });
                subTotalField.push(hideSubTotalTrend ? "N/A" : (threeDayAvgSubTotalArr[0] > (threeDayAvgSubTotalArr[1] * (1 + trendPercent))) ? "⬆" : (threeDayAvgSubTotalArr[0] < (threeDayAvgSubTotalArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
                hideSubTotalTrend = false;

                const subTotalAverageOfActualTotal = subTotalSumOfActualTotal / incNum;
                subTotalAverageOfActualTotalArray.push(subTotalAverageOfActualTotal)
                subTotalField.push('');
                subTotalField.push(Math.round((subTotalAverageOfActualTotal + Number.EPSILON) * 100) / 100);
                subTotalField.push(await this.getReliability(subTotalAverageOfActualTotal));

                const medianDayAnchorSubTotalArr = [];
                await groupedDatesForSubTotalListForWeek.forEach(async item => {
                    const medianDayAvg = this.averageNonZeroArrayItems(item.list, "MedianDaysAnchor");
                    const sumOfAnchor = medianDayAvg === "N/A" ? medianDayAvg : Math.round((medianDayAvg + Number.EPSILON) * 100) / 100;
                    if (sumOfAnchor === "N/A") {
                        hideSubTotalTrend = true;
                    }
                    subTotalField.push(sumOfAnchor);
                    medianDayAnchorSubTotalArr.push(sumOfAnchor);
                });
                subTotalField.push(hideSubTotalTrend ? "N/A" : (medianDayAnchorSubTotalArr[0] > (medianDayAnchorSubTotalArr[1] * (1 + trendPercent))) ? "⬆" : (medianDayAnchorSubTotalArr[0] < (medianDayAnchorSubTotalArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
                hideSubTotalTrend = false;

                const medianDaysPortSubTotalArr = [];
                await groupedDatesForSubTotalListForWeek.forEach(async item => {
                    const medianDayAvgPort = this.averageNonZeroArrayItems(item.list, "MedianDaysPort")
                    const sumOfMedianDaysPort = medianDayAvgPort === "N/A" ? medianDayAvgPort : Math.round((medianDayAvgPort + Number.EPSILON) * 100) / 100;
                    if (sumOfMedianDaysPort === "N/A") {
                        hideSubTotalTrend = true;
                    }
                    subTotalField.push(sumOfMedianDaysPort);
                    medianDaysPortSubTotalArr.push(sumOfMedianDaysPort);
                });
                subTotalField.push(hideSubTotalTrend ? "N/A" : (medianDaysPortSubTotalArr[0] > (medianDaysPortSubTotalArr[1] * (1 + trendPercent))) ? "⬆" : (medianDaysPortSubTotalArr[0] < (medianDaysPortSubTotalArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
                hideSubTotalTrend = false;

                const actualTotalSubTotalArr = [];
                await groupedDatesForSubTotalListForWeek.forEach(async item => {
                    const actualTotalAvg = this.averageNonZeroArrayItems(item.list, "ActualTotal")
                    const sumOfActualTotal = actualTotalAvg === "N/A" ? actualTotalAvg : Math.round((actualTotalAvg + Number.EPSILON) * 100) / 100;
                    if (sumOfActualTotal === "N/A") {
                        hideSubTotalTrend = true;
                    }
                    subTotalField.push(sumOfActualTotal);
                    actualTotalSubTotalArr.push(sumOfActualTotal);
                });
                subTotalField.push(hideSubTotalTrend ? "N/A" : (actualTotalSubTotalArr[0] > (actualTotalSubTotalArr[1] * (1 + trendPercent))) ? "⬆" : (actualTotalSubTotalArr[0] < (actualTotalSubTotalArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
                jsonArr.push(subTotalField);
                mergeArr.push(await this.prepareMergeRecord(jsonArr.length, 2, jsonArr.length, 4));
                yellowColorArray.push(jsonArr.length)
                bottomDoubleBoarderColArr.push(jsonArr.length);
                if ((isUsRegion && !topBoarderAddedForUs) || !isUsRegion) {
                    topThickBoarderRowArr.push(jsonArr.length);
                }
            } else {
                if ((isUsRegion && !topBoarderAddedForUs) || !isUsRegion) {
                    topThickBoarderRowArr.push(jsonArr.length + 1);
                }
                subTotalAverageOfActualTotalArray.push(portRaterMainJson[i].list[0].COVarActualTotal)
            }

            //-------------------------------------------------------------------------------single port calculations-----------------------------------------------------------------------------------------
            for (let j = 0; j < portRaterMainJson[i].list.length; j++) {
                allDatesItems = [...allDatesItems, ...portRaterMainJson[i].list[j]["DatesList"]];
                allDatesItemsForWeek = [...allDatesItemsForWeek, ...portRaterMainJson[i].list[j]["DatesWeekList"]];

                let valueRow = [
                    '',
                    portRaterMainJson[i].list[j]["Region"],
                    portRaterMainJson[i].list[j]["Country"],
                    portRaterMainJson[i].list[j]["PortName"],
                    portRaterMainJson[i].list[j]["LoCode"],
                ];

                let lastDateItem = portRaterMainJson[i].list[j]["DatesList"][datesCount - 1]; //27
                let last2DateItem = portRaterMainJson[i].list[j]["DatesList"][datesCount - 2]; //28
                let lastDateItemForWeek = portRaterMainJson[i].list[j]["DatesWeekList"][datesCount - 1];
                let last2DateItemForWeek = portRaterMainJson[i].list[j]["DatesWeekList"][datesCount - 2];

                let ContainersTrend = "";
                let TotalTrend = "";
                let ThreeDaysAverageTrend = "";
                let MedianDaysAnchorTrend = "";
                let MedianDaysPortTrend = "";
                let ActualTotalTrend = "";

                if (last2DateItem && last2DateItemForWeek) {
                    ContainersTrend = (last2DateItem.Containers > (lastDateItem.Containers * (1 + trendPercent))) ? "⬆" : (last2DateItem.Containers < (lastDateItem.Containers * (1 - trendPercent))) ? "⬇" : "➡";
                    TotalTrend = (last2DateItem.Total > (lastDateItem.Total * (1 + trendPercent))) ? "⬆" : (last2DateItem.Total < (lastDateItem.Total * (1 - trendPercent))) ? "⬇" : "➡";
                    ThreeDaysAverageTrend = (last2DateItem.ThreeDaysAverage > (lastDateItem.ThreeDaysAverage * (1 + trendPercent))) ? "⬆" : (last2DateItem.ThreeDaysAverage < (lastDateItem.ThreeDaysAverage * (1 - trendPercent))) ? "⬇" : "➡";
                    MedianDaysAnchorTrend = (last2DateItemForWeek.MedianDaysAnchor > (lastDateItemForWeek.MedianDaysAnchor * (1 + trendPercent))) ? "⬆" : (last2DateItemForWeek.MedianDaysAnchor < (lastDateItemForWeek.MedianDaysAnchor * (1 - trendPercent))) ? "⬇" : "➡";
                    MedianDaysPortTrend = (last2DateItemForWeek.MedianDaysPort > (lastDateItemForWeek.MedianDaysPort * (1 + trendPercent))) ? "⬆" : (last2DateItemForWeek.MedianDaysPort < (lastDateItemForWeek.MedianDaysPort * (1 - trendPercent))) ? "⬇" : "➡";
                    ActualTotalTrend = (last2DateItemForWeek.ActualTotal > (lastDateItemForWeek.ActualTotal * (1 + trendPercent))) ? "⬆" : (last2DateItemForWeek.ActualTotal < (lastDateItemForWeek.ActualTotal * (1 - trendPercent))) ? "⬇" : "➡";
                }

                let hideSingleRecordTrend = false;
                portRaterMainJson[i].list[j]["DatesList"].forEach(item => {
                    if (item.Containers === "0") {
                        valueRow.push("N/A");
                        hideSingleRecordTrend = true;
                    } else {
                        valueRow.push(item.Containers);
                    }
                });
                valueRow.push(!hideSingleRecordTrend ? ContainersTrend : "N/A");
                hideSingleRecordTrend = false;

                portRaterMainJson[i].list[j]["DatesList"].forEach(item => {
                    if (item.Total === "0") {
                        valueRow.push("N/A");
                        hideSingleRecordTrend = true;
                    } else {
                        valueRow.push(item.Total);
                    }
                });
                valueRow.push(!hideSingleRecordTrend ? TotalTrend : "N/A");
                hideSingleRecordTrend = false;

                portRaterMainJson[i].list[j]["DatesList"].forEach(item => {
                    if (item.ThreeDaysAverage === "0") {
                        valueRow.push("N/A");
                        hideSingleRecordTrend = true;
                    } else {
                        valueRow.push(item.ThreeDaysAverage);
                    }
                });
                valueRow.push(!hideSingleRecordTrend ? ThreeDaysAverageTrend : "N/A");
                hideSingleRecordTrend = false;

                valueRow.push('')
                valueRow.push(portRaterMainJson[i].list[j].COVarActualTotal);
                valueRow.push(portRaterMainJson[i].list[j].reliability);

                portRaterMainJson[i].list[j]["DatesWeekList"].forEach(item => {
                    if (item.MedianDaysAnchor === "0") {
                        valueRow.push("N/A");
                        hideSingleRecordTrend = true;
                    } else {
                        valueRow.push(item.MedianDaysAnchor);
                    }
                });
                valueRow.push(!hideSingleRecordTrend ? MedianDaysAnchorTrend : "N/A");
                hideSingleRecordTrend = false;

                portRaterMainJson[i].list[j]["DatesWeekList"].forEach(item => {
                    if (item.MedianDaysPort === "0") {
                        valueRow.push("N/A");
                        hideSingleRecordTrend = true;
                    } else {
                        valueRow.push(item.MedianDaysPort);
                    }
                });
                valueRow.push(!hideSingleRecordTrend ? MedianDaysPortTrend : "N/A");
                hideSingleRecordTrend = false;

                portRaterMainJson[i].list[j]["DatesWeekList"].forEach(item => {
                    if (item.ActualTotal === "0") {
                        valueRow.push("N/A");
                        hideSingleRecordTrend = true;
                    } else {
                        valueRow.push(item.ActualTotal);
                    }
                });
                valueRow.push(!hideSingleRecordTrend ? ActualTotalTrend : "N/A");
                hideSingleRecordTrend = false;

                jsonArr.push(valueRow);
            }
            totalRegionDataEndLength = jsonArr.length;
            if (totalRegionDataStartLength < totalRegionDataEndLength) {
                mergeArr.push(await this.prepareMergeRecord(totalRegionDataStartLength, 1, totalRegionDataEndLength, 1))
            }
        }

        // prints last row
        const groupedDatesList = this.groupByDataList(allDatesItems, "Date");
        const groupedDatesListForWeek = this.groupByDataList(allDatesItemsForWeek, "Date");

        let lastRow = ['', 'Overall', '', '', ''];

        let hideLastRowTrend = false;
        const containersArr = [];
        await groupedDatesList.forEach(async item => {
            const sumOfContainer = this.sumNonZeroArrayItems(item.list, "Containers");
            if (sumOfContainer === "N/A") {
                hideLastRowTrend = true;
            }
            lastRow.push(sumOfContainer);
            containersArr.push(sumOfContainer);
        });
        lastRow.push(hideLastRowTrend ? "N/A" : (containersArr[0] > (containersArr[1] * (1 + trendPercent))) ? "⬆" : (containersArr[0] < (containersArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
        hideLastRowTrend = false;

        const totalArr = [];
        await groupedDatesList.forEach(async item => {
            const sumOfTotal = this.sumNonZeroArrayItems(item.list, "Total");
            if (sumOfTotal === "N/A") {
                hideLastRowTrend = true;
            }
            lastRow.push(sumOfTotal);
            totalArr.push(sumOfTotal);
        });
        lastRow.push(hideLastRowTrend ? "N/A" : (totalArr[0] > (totalArr[1] * (1 + trendPercent))) ? "⬆" : (totalArr[0] < (totalArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
        hideLastRowTrend = false;

        const threeDayAvgArr = [];
        await groupedDatesList.forEach(async item => {
            const sumOfThreeDaysAvg = this.sumNonZeroArrayItems(item.list, "ThreeDaysAverage");
            if (sumOfThreeDaysAvg === "N/A") {
                hideLastRowTrend = true;
            }
            lastRow.push(sumOfThreeDaysAvg);
            threeDayAvgArr.push(sumOfThreeDaysAvg);
        });
        lastRow.push(hideLastRowTrend ? "N/A" : (threeDayAvgArr[0] > (threeDayAvgArr[1] * (1 + trendPercent))) ? "⬆" : (threeDayAvgArr[0] < (threeDayAvgArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
        hideLastRowTrend = false;

        lastRow.push('');
        lastRow.push(Math.round((await this.averageCalculate(subTotalAverageOfActualTotalArray) + Number.EPSILON) * 100) / 100);
        lastRow.push(await this.getReliability(Math.round((await this.averageCalculate(subTotalAverageOfActualTotalArray) + Number.EPSILON) * 100) / 100));

        const medianDayAnchorArr = [];
        await groupedDatesListForWeek.forEach(async item => {
            const medianDayAvg = this.averageNonZeroArrayItems(item.list, "MedianDaysAnchor");
            const sumOfAnchor = medianDayAvg === "N/A" ? medianDayAvg : Math.round((medianDayAvg + Number.EPSILON) * 100) / 100;
            if (sumOfAnchor === "N/A") {
                hideLastRowTrend = true;
            }
            lastRow.push(sumOfAnchor);
            medianDayAnchorArr.push(sumOfAnchor);
        });
        lastRow.push(hideLastRowTrend ? "N/A" : (medianDayAnchorArr[0] > (medianDayAnchorArr[1] * (1 + trendPercent))) ? "⬆" : (medianDayAnchorArr[0] < (medianDayAnchorArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
        hideLastRowTrend = false;

        const medianDaysPortArr = [];
        await groupedDatesListForWeek.forEach(async item => {
            const medianDayAvgPort = this.averageNonZeroArrayItems(item.list, "MedianDaysPort");
            const sumOfMedianDaysPort = medianDayAvgPort === "N/A" ? medianDayAvgPort : Math.round((medianDayAvgPort + Number.EPSILON) * 100) / 100;
            if (sumOfMedianDaysPort === "N/A") {
                hideLastRowTrend = true;
            }
            lastRow.push(sumOfMedianDaysPort);
            medianDaysPortArr.push(sumOfMedianDaysPort);
        });
        lastRow.push(hideLastRowTrend ? "N/A" : (medianDaysPortArr[0] > (medianDaysPortArr[1] * (1 + trendPercent))) ? "⬆" : (medianDaysPortArr[0] < (medianDaysPortArr[1] * (1 - trendPercent))) ? "⬇" : "➡");
        hideLastRowTrend = false;

        const actualTotalArr = [];
        await groupedDatesListForWeek.forEach(async item => {
            const actualTotalAvg = this.averageNonZeroArrayItems(item.list, "ActualTotal")
            const sumOfActualTotal = actualTotalAvg === "N/A" ? actualTotalAvg : Math.round((actualTotalAvg + Number.EPSILON) * 100) / 100;
            if (sumOfActualTotal === "N/A") {
                hideLastRowTrend = true;
            }
            lastRow.push(sumOfActualTotal);
            actualTotalArr.push(sumOfActualTotal);
        });
        lastRow.push(hideLastRowTrend ? "N/A" : (actualTotalArr[0] > (actualTotalArr[1] * (1 + trendPercent))) ? "⬆" : (actualTotalArr[0] < (actualTotalArr[1] * (1 - trendPercent))) ? "⬇" : "➡");

        jsonArr.push(lastRow);
        boldRowArr.push(jsonArr.length);
        bottomThickBorderRowArr.push(jsonArr.length, jsonArr.length - 1);
        mergeArr.push(await this.prepareMergeRecord(3, 0, jsonArr.length, 0));
        mergeArr.push(await this.prepareMergeRecord(3, 14, jsonArr.length, 14));
        mergeArr.push(await this.prepareMergeRecord(jsonArr.length, 1, jsonArr.length, 4));

        //column length
        columnLengthArray.push({
            wch: 0.7
        }, {
            wch: 8
        }, {
            wch: 12.50
        }, {
            wch: 12.50
        }, {
            wch: 8
        }, {
            wch: 8.50
        }, {
            wch: 8.50
        }, {
            wch: 4
        }, {
            wch: 8.50
        }, {
            wch: 8.50
        }, {
            wch: 4
        }, {
            wch: 8.50
        }, {
            wch: 8.50
        }, {
            wch: 4
        }, {
            wch: 0.7
        }, {
            wch: 4
        }, {
            wch: 2
        }, {
            wch: 8.50
        }, {
            wch: 8.50
        }, {
            wch: 4
        }, {
            wch: 8.50
        }, {
            wch: 8.50
        }, {
            wch: 4
        }, {
            wch: 8.50
        }, {
            wch: 8.50
        }, {
            wch: 4
        })

        return {
            jsonArr: jsonArr,
            headingSizeArray: styleOpts.headingSizeArray || headingSizeArray,
            centerAlignmentArr: styleOpts.centerAlignmentArr || centerAlignmentArr,
            mergeArr: styleOpts.mergeArr || mergeArr,
            columnCount: styleOpts.columnCount || columnCount,
            rowsCount: styleOpts.rowsCount || rowsCount,
            currencyColArr: styleOpts.currencyColArr || currencyColArr,
            boldRowArr: styleOpts.boldRowArr || boldRowArr,
            colorRowArr: styleOpts.colorRowArr || colorRowArr,
            leftThickBoarderColArr: styleOpts.leftThickBoarderColArr || leftThickBoarderColArr,
            blankBoarderArrayCol: styleOpts.blankBoarderArrayCol || blankBoarderArrayCol,
            topThickBoarderRowArr: styleOpts.topThickBoarderRowArr || topThickBoarderRowArr,
            rightThickBoarderColArr: styleOpts.rightThickBoarderColArr || rightThickBoarderColArr,
            bottomThickBorderRowArr: styleOpts.bottomThickBorderRowArr || bottomThickBorderRowArr,
            rightThinBoarderColArr: styleOpts.rightThinBoarderColArr || rightThinBoarderColArr,
            rightDoubleBoarderColArr: styleOpts.rightDoubleBoarderColArr || rightDoubleBoarderColArr,
            bottomDoubleBoarderColArr: styleOpts.bottomDoubleBoarderColArr || bottomDoubleBoarderColArr,
            yellowColorArray: styleOpts.yellowColorArray || yellowColorArray,
            overAllSummaryStyleArray: styleOpts.overAllSummaryStyleArray || overAllSummaryStyleArray,
            textRotationField: styleOpts.textRotationField || textRotationField,
            columnLengthArray: styleOpts.columnLengthArray || columnLengthArray,
            fontSizeEightArray: styleOpts.fontSizeEightArray || fontSizeEightArray,
            fontSizeElevenArray: styleOpts.fontSizeElevenArray || fontSizeElevenArray
        };
    }

    //==================================== Default Process =============================================

    static async getExcelJsonForDefaultProcess(defaultProcessMainJson = [], styleOpts = {}) {

        // Start to set Excel JSON
        let columnCount = 1;
        let mergeArr = [{
            s: {
                r: 2,
                c: 0
            },
            e: {
                r: 2,
                c: columnCount
            }
        }, ];
        let rowsCount = defaultProcessMainJson.length + 6;
        let currencyColArr = [];
        let boldRowArr = [4];
        let colorRowArr = [2];
        let jsonArr = [];

        jsonArr.push([]);
        jsonArr.push(['Default Process Report', '']);
        jsonArr.push([]);

        var headRow1 = ['Field Name', 'Value'];
        jsonArr.push(headRow1);

        for (let i = 0; i < defaultProcessMainJson.length; i++) {

            let valueRow = [
                defaultProcessMainJson[i]["variableName"],
                defaultProcessMainJson[i]["value"].replace(/['"]+/g, ''),
            ];

            jsonArr.push(valueRow);
        }

        return {
            jsonArr: jsonArr,
            mergeArr: styleOpts.mergeArr || mergeArr,
            columnCount: styleOpts.columnCount || columnCount,
            rowsCount: styleOpts.rowsCount || rowsCount,
            currencyColArr: styleOpts.currencyColArr || currencyColArr,
            boldRowArr: styleOpts.boldRowArr || boldRowArr,
            colorRowArr: styleOpts.colorRowArr || colorRowArr,
        };
    }

    //================================ Generate Excel Report ========================================

    static async getExcelSheetsReportTemplateWise(reportTemplate, inputMainJson, userInfo) {

        var inputExcelSheets = [];
        if (reportTemplate == "networkComputation") {

            // Get parcel rater excel json
            if (inputMainJson.parcelRaterMainJson && inputMainJson.parcelRaterMainJson.length > 0) {
                inputExcelSheets.push({
                    sheetInputJson: await this.getExcelJsonForParcelRaterSiteWise(inputMainJson.parcelRaterMainJson, {}, userInfo),
                    sheetName: "Parcel Rater"
                });
            }

            // Get LTL rater excel json
            if (inputMainJson.ltlRaterMainJson && inputMainJson.ltlRaterMainJson.length > 0) {
                inputExcelSheets.push({
                    sheetInputJson: await this.getExcelJsonForLtlRaterSiteWise(inputMainJson.ltlRaterMainJson, {}, userInfo),
                    sheetName: "LTL Rater"
                });
            }

            // Get TL rater excel json
            if (inputMainJson.tlRaterMainJson && inputMainJson.tlRaterMainJson.length > 0) {
                inputExcelSheets.push({
                    sheetInputJson: await this.getExcelJsonForTlRaterSiteWise(inputMainJson.tlRaterMainJson, {}, userInfo),
                    sheetName: "TL Rater"
                });
            }

            // Get Fleet rater excel json
            if (inputMainJson.fleetRaterMainJson && inputMainJson.fleetRaterMainJson.length > 0) {
                inputExcelSheets.push({
                    sheetInputJson: await this.getExcelJsonForFleetRaterSiteWise(inputMainJson.fleetRaterMainJson, {}, userInfo),
                    sheetName: "Fleet Rater"
                });
            }

            // Get multi site summary excel json
            inputExcelSheets.push({
                sheetInputJson: await this.getMultiSiteSummaryExcelJson(
                    inputMainJson.parcelRaterMainJson || [],
                    inputMainJson.ltlRaterMainJson || [],
                    inputMainJson.tlRaterMainJson || [],
                    inputMainJson.fleetRaterMainJson || [], {}, userInfo
                ),
                sheetName: "Multi Site Summary"
            });

            // Get single site summary excel json
            inputExcelSheets.push({
                sheetInputJson: await this.getSingleSiteSummaryExcelJson(
                    inputMainJson.parcelRaterMainJson || [],
                    inputMainJson.ltlRaterMainJson || [],
                    inputMainJson.tlRaterMainJson || [],
                    inputMainJson.fleetRaterMainJson || [], {}, userInfo
                ),
                sheetName: "Single Site Summary"
            });

            // Get final summary excel json
            inputExcelSheets.push({
                sheetInputJson: await this.getFinalSummaryExcelJson(
                    inputMainJson.parcelRaterMainJson || [],
                    inputMainJson.ltlRaterMainJson || [],
                    inputMainJson.tlRaterMainJson || [],
                    inputMainJson.fleetRaterMainJson || [], {},
                    userInfo
                ),
                sheetName: "Final Summary"
            });
        }

        if (reportTemplate == "portAnalysis") {

            // Get port rater excel json
            if (inputMainJson.portRaterMainJson && inputMainJson.portRaterMainJson.length > 0) {
                inputExcelSheets.push({
                    sheetInputJson: await this.getExcelJsonForPortRater(inputMainJson.portRaterMainJson),
                    sheetName: "Port Rater"
                });
            }
        }

        if (reportTemplate == "default") {

            // Get default excel json
            if (inputMainJson.defaultProcessMainJson && inputMainJson.defaultProcessMainJson.length > 0) {
                inputExcelSheets.push({
                    sheetInputJson: await this.getExcelJsonForDefaultProcess(inputMainJson.defaultProcessMainJson),
                    sheetName: "Default"
                });
            }
        }

        return inputExcelSheets;
    }

    static async generateReportPDFFile(transactionId, userInfo, inputMainJson = {}, reportTemplate = "") {
        const reportUrl = await treeLogicsController.generateHTMLToPDF(transactionId, userInfo, inputMainJson)
        return reportUrl;
    }

    static async generateReportExcelFileForSimpleForecast(transactionId, userInfo, inputExcelSheets = [], reportTemplate = "") {
        const columns = [
            { Header: 'Date', name: 'Date' },
            { Header: 'Forecasted Value', name: 'Forecast' },
            { Header: 'Avg % Error', name: 'Avg' },
            { Header: 'Lower Forecast Bound', name: 'Lower' },
            { Header: 'Upper Forecast Bound', name: 'Upper' }
        ];

        console.log("userInfo.forecast::::::::", userInfo.forecast);
        const data = userInfo.forecast;

        // Apply styles to worksheet
        const titleStyle = {
            font: { bold: true, sz: 16 },
            alignment: { horizontal: 'center' },
            border: {
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                top: { style: "thin", color: { rgb: "000000" } }
            }
        };
        const headerStyle = {
            font: { bold: true, sz: 14 },
            fill: { fgColor: { rgb: "FFFF00" } }, // Yellow background
            border: {
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
                top: { style: "thin", color: { rgb: "000000" } }
            }
        };
        const cellStyle = {
            font: { sz: 12 },
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            },
            alignment: { vertical: 'center', horizontal: 'center' }
        };

        // Create worksheet with headers and data
        const worksheet = xlsx.utils.json_to_sheet(data, { header: columns.map(col => col.name) });

        // Insert title row at the top
        xlsx.utils.sheet_add_aoa(worksheet, [['Simple Forecast Report']], { origin: { r: 0, c: 0 } });

        // Merge cells for title
        worksheet['!merges'] = [{ s: { c: 0, r: 0 }, e: { c: columns.length - 1, r: 0 } }];

        // Apply title style
        worksheet['A1'].s = titleStyle;

        // Insert headers
        xlsx.utils.sheet_add_aoa(worksheet, [columns.map(col => col.Header)], { origin: { r: 1, c: 0 } });

        xlsx.utils.sheet_add_json(worksheet, data, { header: columns.map(col => col.name), skipHeader: true, origin: { r: 2, c: 0 } });

        // Apply header styles
        const headerRange = xlsx.utils.decode_range(worksheet['!ref']);
        for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
            const cellAddress = xlsx.utils.encode_cell({ c: C, r: 1 });
            worksheet[cellAddress].s = headerStyle;
        }

        // Apply styles to data cells
        for (let R = 2; R <= headerRange.e.r; ++R) {
            for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
                const cellAddress = xlsx.utils.encode_cell({ c: C, r: R });
                if (!worksheet[cellAddress]) {
                    worksheet[cellAddress] = { t: "s", v: "" };
                }
                worksheet[cellAddress].s = cellStyle;
            }
        }

        // Adjust column widths
        worksheet['!cols'] = columns.map(col => ({
            width: Math.max(
                col.Header.length,
                ...data.map(row => String(row[col.name] || "").length)
            ) + 3 // Add some padding
        }));

        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Simple Forecast');

        // Write the workbook to a file
        await xlsx.writeFile(workbook, config.reportFolderPath + "/report_" + transactionId + ".xlsx");
        return config.reportFileUrl + 'report_' + transactionId + '.xlsx';
    }

    static async generateReportExcelFile(transactionId, userInfo, inputExcelSheets = [], reportTemplate = "") {
        //Had to create a new workbook and then add the header
        const wb = xlsx.utils.book_new();

        if (inputExcelSheets.length > 0) {

            for (const item of inputExcelSheets) {
                let ws = await this.getExcelFormattedSheetDataDemo(item, userInfo, reportTemplate);
                xlsx.utils.book_append_sheet(wb, ws, item.sheetName);
            }
        } else {
            let ws = await this.getExcelFormattedSheetData({
                jsonArr: [
                    []
                ],
                mergeArr: []
            }, userInfo, '');
            xlsx.utils.book_append_sheet(wb, ws, "dd");
        }
        await xlsx.writeFile(wb, config.reportFolderPath + "/report_" + transactionId + ".xlsx");

        return config.reportFileUrl + 'report_' + transactionId + '.xlsx';
    }

    static async getExcelFormattedSheetData(inputExcelSheetJson, userInfo = null, reportTemplate = "", sheetType = "", displayHeadFoot = true) {
        let inputSheetJson = JSON.parse(JSON.stringify(inputExcelSheetJson));

        let userName = userInfo && userInfo.userName ? userInfo.userName : "";
        let organizationName = userInfo && userInfo.organizationName ? userInfo.organizationName : "";
        let overAllRevenue = userInfo && userInfo.overAllRevenue ? userInfo.overAllRevenue : "";
        let eCommercePercent = userInfo && userInfo.eCommercePercent ? userInfo.eCommercePercent : 0;
        let ltlPercent = userInfo && userInfo.ltlPercent ? userInfo.ltlPercent : 0;
        let tlPercent = userInfo && userInfo.tlPercent ? userInfo.tlPercent : 0;
        let fleetPercent = userInfo && userInfo.fleetPercent ? userInfo.fleetPercent : 0;
        let inputServiceLevel = userInfo && userInfo.inputServiceLevel ? userInfo.inputServiceLevel : "";
        let comparisonType = userInfo && userInfo.comparisonType ? userInfo.comparisonType : "";
        let selectedDate = userInfo && userInfo.selectedDate ? userInfo.selectedDate : "";

        inputSheetJson.headers = [];

        if (displayHeadFoot) {

            // Update Headers
            let headerInfo = "";
            headerInfo += "User Name:  " + userName + " \n";
            headerInfo += "Organization Name: " + organizationName + " \n";

            if (overAllRevenue) {
                headerInfo += "Organization Revenue: $" + overAllRevenue + " \n"
            }
            if (eCommercePercent) {
                headerInfo += "eCommerce Percent: " + eCommercePercent + " \n"
            }
            if (ltlPercent) {
                headerInfo += "LTL Percent: " + ltlPercent + " \n"
            }
            if (tlPercent) {
                headerInfo += "TL Percent: " + tlPercent + " \n"
            }
            if (fleetPercent) {
                headerInfo += "Fleet Percent: " + fleetPercent + " \n"
            }
            if (inputServiceLevel) {
                headerInfo += "Service Level: " + this.getServiceLevelLabel(inputServiceLevel)
            }

            // if (comparisonType) {
            //     headerInfo += "Comparison Type: " + comparisonType + " \n"
            // }
            // if (selectedDate) {
            //     let partOfDate = JSON.parse(selectedDate).split("/");
            //     let responseDate = `${partOfDate[1]}/${partOfDate[0]}/${partOfDate[2]}`;
            //     headerInfo += "Input Date: " + responseDate + " \n"
            // }
            if (reportTemplate == 'portAnalysis' || selectedDate || comparisonType) {
                reportTemplate = 'portAnalysis';
                headerInfo = "Port Analysis Scorecard";
                inputSheetJson.centerAlignmentArr.push(0);
                inputSheetJson.headingSizeArray.push(0);
            }

            inputSheetJson.headers = [
                [headerInfo]
            ];
            inputSheetJson.mergeArr.push({
                s: {
                    r: 0,
                    c: 0
                },
                e: {
                    r: 0,
                    c: inputSheetJson.columnCount
                }
            });

            // Update Footers
            // inputSheetJson.jsonArr.push([], [], [], []);
            // inputSheetJson.jsonArr.push(['Prepared by Emate Toolkit']);
            // inputSheetJson.mergeArr.push({
            //     s: {
            //         r: inputSheetJson.jsonArr.length,
            //         c: 0
            //     },
            //     e: {
            //         r: inputSheetJson.jsonArr.length,
            //         c: inputSheetJson.columnCount
            //     }
            // });
        }

        let ws = xlsx.utils.json_to_sheet([]);
        xlsx.utils.sheet_add_aoa(ws, inputSheetJson.headers);
        xlsx.utils.sheet_add_json(ws, inputSheetJson.jsonArr, {
            origin: 'A2',
            skipHeader: true
        });


        if (reportTemplate == 'portAnalysis' || selectedDate || comparisonType) {
            for (let i in ws) {
                if (typeof (ws[i]) != "object") continue;
                let cell = xlsx.utils.decode_cell(i);

                ws[i].s = {
                    alignment: {
                        horizontal: "center",
                        vertical: "center"
                    },
                    border: {
                        left: {
                            style: "dotted",
                            color: "000000"
                        },
                        right: {
                            style: "dotted",
                            color: "000000"
                        },
                        top: {
                            style: "dotted",
                            color: "000000"
                        },
                        bottom: {
                            style: "dotted",
                            color: "000000"
                        },
                    },
                    wrapText: cell.r == 0 ? true : false
                }


                if (inputSheetJson.topThickBoarderRowArr && inputSheetJson.topThickBoarderRowArr.includes(cell.r)) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: ws[i].s.border.right.style,
                            color: ws[i].s.border.right.color
                        },
                        top: {
                            style: "thick",
                            color: "000000"
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (inputSheetJson.bottomThickBorderRowArr && inputSheetJson.bottomThickBorderRowArr.includes(cell.r)) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: ws[i].s.border.right.style,
                            color: ws[i].s.border.right.color
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: "thick",
                            color: "000000"
                        }
                    }
                }

                if (inputSheetJson.leftThickBoarderColArr && inputSheetJson.leftThickBoarderColArr.includes(cell.c) && cell.r != 0) {
                    ws[i].s.border = {
                        left: {
                            style: 'thick',
                            color: "000000"
                        },
                        right: {
                            style: ws[i].s.border.right.style,
                            color: ws[i].s.border.right.color
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (inputSheetJson.rightThickBoarderColArr && inputSheetJson.rightThickBoarderColArr.includes(cell.c) && cell.r != 0) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: "thick",
                            color: "000000"
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (cell.r == 2 && cell.c == inputSheetJson.columnCount - 1) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: "thick",
                            color: "000000"
                        },
                        top: {
                            style: "thick",
                            color: "000000"
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (inputSheetJson.rightThinBoarderColArr && inputSheetJson.rightThinBoarderColArr.includes(cell.c) && cell.r != 0) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: "thin",
                            color: "000000"
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (inputSheetJson.rightDoubleBoarderColArr && inputSheetJson.rightDoubleBoarderColArr.includes(cell.c) && cell.r != 0) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: "double",
                            color: "000000"
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (inputSheetJson.bottomDoubleBoarderColArr && inputSheetJson.bottomDoubleBoarderColArr.includes(cell.r)) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: ws[i].s.border.right.style,
                            color: ws[i].s.border.right.color
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: "double",
                            color: "000000"
                        }
                    }
                }

                if (inputSheetJson.currencyColArr && inputSheetJson.currencyColArr.includes(cell.c) && cell.r != 0) {
                    ws[i].s.numFmt = "$0.00";
                }

                if (inputSheetJson.boldRowArr && inputSheetJson.boldRowArr.includes(cell.r)) {
                    ws[i].s.font = {
                        bold: true
                    };
                }

                if (inputSheetJson.centerAlignmentArr && inputSheetJson.centerAlignmentArr.includes(cell.r)) {
                    ws[i].s.alignment = {
                        horizontal: "center",
                        vertical: "center"
                    }
                }

                if (inputSheetJson.headingSizeArray && inputSheetJson.headingSizeArray.includes(cell.r)) {
                    ws[i].s = {
                        font: {
                            sz: 22
                        },
                        alignment: {
                            horizontal: "center",
                            vertical: "center"
                        }
                    }
                }

                if (inputSheetJson.yellowColorArray && inputSheetJson.yellowColorArray.includes(cell.r) && cell.c != 1) {
                    ws[i].s.fill = {
                        fgColor: {
                            rgb: "ffff33"
                        }
                    }
                }

                if (inputSheetJson.overAllSummaryStyleArray && inputSheetJson.overAllSummaryStyleArray.includes(cell.r)) {
                    ws[i].s.font = {
                        sz: 14,
                        bold: true
                    }
                }

                if (inputSheetJson.textRotationField && inputSheetJson.textRotationField.includes(cell.c) && cell.r == 3) {
                    ws[i].s.alignment.textRotation = 90
                }

                if (ws[i].v == "⬆") {
                    ws[i].s.fill = {
                        fgColor: {
                            rgb: "4CAE4C"
                        }
                    };
                }
                if (ws[i].v == "⬇") {
                    ws[i].s.fill = {
                        fgColor: {
                            rgb: "E11414"
                        }
                    };
                }

                if (inputSheetJson.fontSizeElevenArray && inputSheetJson.fontSizeElevenArray.includes(cell.r)) {
                    ws[i].s.font = {
                        sz: 11
                    }
                }

                if (inputSheetJson.fontSizeEightArray && inputSheetJson.fontSizeEightArray.includes(cell.c) && cell.r == 3) {
                    ws[i].s.font = {
                        sz: 8
                    }
                }

                if (reportTemplate == 'portAnalysis' && cell.c == 16 && cell.r > 4) {
                    const color = await this.getColorForReliability(ws[i].v);
                    if (color) {
                        ws[i].v = '';
                        ws[i].s.fill = {
                            fgColor: {
                                rgb: color
                            }
                        }
                    }
                }
            }
            ws['!cols'] = inputSheetJson.columnLengthArray ? inputSheetJson.columnLengthArray : [];
            ws['!cols'][15].hidden = true;

        }

        if (reportTemplate == 'networkComputation') {
            for (let i in ws) {
                if (typeof (ws[i]) != "object") continue;
                let cell = xlsx.utils.decode_cell(i);

                ws[i].s = {
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                    },
                    border: {
                        left: {
                            style: "thin",
                            color: "000000"
                        },
                        right: {
                            style: "thin",
                            color: "000000"
                        },
                        top: {
                            style: "thin",
                            color: "000000"
                        },
                        bottom: {
                            style: "thin",
                            color: "000000"
                        },
                    },
                    wrapText: cell.r == 0 ? true : false
                }

                if (inputSheetJson.currencyColArr && inputSheetJson.currencyColArr.includes(cell.c) && cell.r != 0) {
                    ws[i].s.numFmt = "$0.00";
                }

                if (inputSheetJson.boldRowArr && inputSheetJson.boldRowArr.includes(cell.r)) {
                    ws[i].s.font = {
                        bold: true
                    };
                }

                if (inputSheetJson.colorRowArr && inputSheetJson.colorRowArr.includes(cell.r) || cell.r == 0) {
                    ws[i].s.alignment.horizontal = "left";
                }

                if (inputSheetJson.colorRowArr && inputSheetJson.colorRowArr.includes(cell.r)) {
                    ws[i].s.fill = {
                        fgColor: {
                            rgb: "F2E3BB"
                        }
                    };
                }

                if (ws[i].v == "⬆") {
                    ws[i].s.fill = {
                        fgColor: {
                            rgb: "4CAE4C"
                        }
                    };
                }
                if (ws[i].v == "⬇") {
                    ws[i].s.fill = {
                        fgColor: {
                            rgb: "E11414"
                        }
                    };
                }
            }
        }
        ws["!merges"] = inputSheetJson.mergeArr ? inputSheetJson.mergeArr : [];

        return ws;
    }

    //================================ Generate HTML Report ========================================

    static async getExcelSheetsReportTemplateWiseForHtml(reportTemplate, inputMainJson) {

        var inputExcelSheets = [];

        if (reportTemplate == "networkComputation") {

            // Get final summary excel json
            inputExcelSheets.push({
                sheetInputJson: await this.getFinalSummaryExcelJson(
                    inputMainJson.parcelRaterMainJson || [],
                    inputMainJson.ltlRaterMainJson || [],
                    inputMainJson.tlRaterMainJson || [],
                    inputMainJson.fleetRaterMainJson || []
                ),
                sheetName: "Final Summary"
            });
        }

        if (reportTemplate == "portAnalysis") {
            // Get port rater excel json
            if (inputMainJson.portRaterMainJson && inputMainJson.portRaterMainJson.length > 0) {
                inputExcelSheets.push({
                    sheetInputJson: await this.getExcelJsonForPortRater(inputMainJson.portRaterMainJson),
                    sheetName: "Port Rater"
                });
            }
        }

        if (reportTemplate == "default") {

            // Get default excel json
            if (inputMainJson.defaultProcessMainJson && inputMainJson.defaultProcessMainJson.length > 0) {
                inputExcelSheets.push({
                    sheetInputJson: await this.getExcelJsonForDefaultProcess(inputMainJson.defaultProcessMainJson),
                    sheetName: "Default"
                });
            }
        }

        return inputExcelSheets;
    }

    static async generateReportHtmlContent(transactionId, userInfo, inputExcelSheets = []) {

        let html = "";

        for (const item of inputExcelSheets) {

            // html += "<table border='1' cellspacing='0' cellpadding='4'>";

            // item.sheetInputJson.jsonArr.forEach((rowArr, rowIndex) => {

            //     if ([2, 4, 10].includes(rowIndex + 1)) {
            //         console.log(rowArr)
            //     }

            //     html += "<tr>";

            //     rowArr.forEach((col, colIndex) => {
            //         html += "<td>" + col + "</td>";
            //     });

            //     html += "</tr>";
            // });

            // html += "</table>";

            let ws = await this.getExcelFormattedSheetData(item.sheetInputJson, userInfo, "", "", false);
            let generatedTableHtml = xlsx.utils.sheet_to_html(ws);
            html += generatedTableHtml.replace('<table', '<table id="main-table" border="1" cellspacing="0" cellpadding="4"');
        }

        return html;
    }


    //================================ Demo API ==========================================
    static async getDemoMainJson(req, res) {
        try {
            const {
                mainJson
            } = req.body;
            const userInfo = new Object(mainJson.inputData)
            // {
            // userName: 'Balasaheb Pulate',
            // organizationName: 'Intech Creative Services pvt ltd',
            // reportTemplate: 'networkComputation',
            // overAllRevenue: 30000000,
            // eCommercePercent: 50,
            // ltlPercent: 0,
            // tlPercent: 0,
            // fleetPercent: 0,
            // inputServiceLevel: 3
            // }
            // templateName : "portAnalysis"
            var inputExcelSheets = await treeLogicsController.getExcelSheetsReportTemplateWise("portAnalysis", mainJson, userInfo);
            await treeLogicsController.generateReportExcelFileDemo(inputExcelSheets, 'portAnalysis');
            res.status(201).send({
                message: "done"
            });
        } catch (err) {
            console.log("Error :-", err);
        }
    }

    static async generateReportExcelFileDemo(inputExcelSheets, reportTemplate) {
        const transactionId = "123";
        const userInfo = {}
        const wb = xlsx.utils.book_new();

        if (inputExcelSheets.length > 0) {

            for (const item of inputExcelSheets) {
                let ws = await this.getExcelFormattedSheetDataDemo(item, userInfo, reportTemplate);
                xlsx.utils.book_append_sheet(wb, ws, item.sheetName);
            }

        } else {
            let ws = await this.getExcelFormattedSheetData({
                jsonArr: [
                    []
                ],
                mergeArr: []
            }, userInfo, '');
            xlsx.utils.book_append_sheet(wb, ws, "dd");
        }
        const fileName = config.reportFolderPath + "/report_" + new Date().getTime() + ".xlsx" //moment().format('DD_MMM_yy')
        await xlsx.writeFile(wb, fileName);
        return fileName;
    }

    static async getExcelFormattedSheetDataDemo(sheetData, userInfo = null, reportTemplate, displayHeadFoot = true) {
        let inputSheetJson = JSON.parse(JSON.stringify(sheetData.sheetInputJson));
        const userName = userInfo && userInfo.userName ? userInfo.userName : "";
        const organizationName = userInfo && userInfo.organizationName ? userInfo.organizationName : "";
        const overAllRevenue = userInfo && userInfo.overAllRevenue ? userInfo.overAllRevenue : "";
        const eCommercePercent = userInfo && userInfo.eCommercePercent ? userInfo.eCommercePercent : 0;
        const ltlPercent = userInfo && userInfo.ltlPercent ? userInfo.ltlPercent : 0;
        const tlPercent = userInfo && userInfo.tlPercent ? userInfo.tlPercent : 0;
        const fleetPercent = userInfo && userInfo.fleetPercent ? userInfo.fleetPercent : 0;
        const inputServiceLevel = userInfo && userInfo.inputServiceLevel ? userInfo.inputServiceLevel : "";
        const comparisonType = userInfo && userInfo.comparisonType ? userInfo.comparisonType : "";
        const selectedDate = userInfo && userInfo.selectedDate ? userInfo.selectedDate : "";
        const parcelPercent = userInfo && userInfo.parcelRaterPercent ? userInfo.parcelRaterPercent : 0;
        const highlightedRaterPercentageRowArr = [];
        let startFrom = 'A2';
        inputSheetJson.headers = [];

        if (displayHeadFoot) {

            // Update Headers
            let headerInfo = "",
                inputServiceLevelDay = "";
            headerInfo += "User Name:  " + userName + " \n";
            headerInfo += "Organization Name: " + organizationName + " \n";

            if (overAllRevenue) {
                headerInfo += "Organization Revenue: $" + overAllRevenue + " \n"
            }
            if (eCommercePercent) {
                headerInfo += "eCommerce Percent: " + eCommercePercent + " \n"
            }
            if (ltlPercent) {
                headerInfo += "LTL Percent: " + ltlPercent + " \n"
                highlightedRaterPercentageRowArr.push(7, 8);
            }
            if (tlPercent) {
                headerInfo += "TL Percent: " + tlPercent + " \n"
                highlightedRaterPercentageRowArr.push(10, 11);
            }
            if (fleetPercent) {
                headerInfo += "Fleet Percent: " + fleetPercent + " \n"
                highlightedRaterPercentageRowArr.push(12, 14);
            }
            if (inputServiceLevel) {
                inputServiceLevelDay = this.getServiceLevelLabel(inputServiceLevel);
                headerInfo += "Service Level: " + inputServiceLevelDay;
            }
            if (parcelPercent) {
                highlightedRaterPercentageRowArr.push(17, 18);
            }

            // const parcelPercent = 100 - (tlPercent + ltlPercent + fleetPercent);

            if (reportTemplate == 'networkComputation') {
                startFrom = 'A7';
                headerInfo = inputSheetJson.type;
                inputSheetJson.centerAlignmentArr ? inputSheetJson.centerAlignmentArr : inputSheetJson.centerAlignmentArr = [];
                inputSheetJson.headingSizeArray ? inputSheetJson.headingSizeArray : inputSheetJson.headingSizeArray = [];
                inputSheetJson.headingSizeArray.push(0);
                const headerInfoTwo = ['', 'Report Creator:', userName, '', '', '', '', 'Date:', moment().format('DD/MM/yy'), '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
                const headerInfoThree = ['', 'Overall Business', '', '', '', '', '', 'Mode Mix', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Modelled Service Level', '', ''];
                const headerInfoFour = ['', 'Revenue:', this.convertToMillion(overAllRevenue), 'eComm. %:', '', parcelPercent.toFixed(2).concat('%'), '', 'LTL:', ltlPercent.toFixed(2).concat('%'), '', 'TL:', tlPercent.toFixed(2).concat('%'), 'Private Fleet:', '', fleetPercent.toFixed(2).concat('%'), '', '', 'Parcel:', parcelPercent.toFixed(2).concat('%'), '', '', inputServiceLevel, '', ''];
                inputSheetJson.headers = [
                    ['', headerInfo, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
                    headerInfoTwo,
                    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
                    headerInfoThree,
                    headerInfoFour,
                    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
                ];
                inputSheetJson.topThickBoarderRowArr ? inputSheetJson.topThickBoarderRowArr : inputSheetJson.topThickBoarderRowArr = [];
                inputSheetJson.topThickBoarderRowArr.push(3);
                inputSheetJson.bottomThickBoarderRowArr ? inputSheetJson.bottomThickBoarderRowArr : inputSheetJson.bottomThickBoarderRowArr = [];
                inputSheetJson.bottomThickBoarderRowArr.push(4);
                inputSheetJson.leftThickBoarderColArrForHeaders ? inputSheetJson.leftThickBoarderColArrForHeaders : inputSheetJson.leftThickBoarderColArrForHeaders = [];
                inputSheetJson.leftThickBoarderColArrForHeaders.push(1, 7, 21);
                inputSheetJson.rightThickBoarderColArrForHeaders ? inputSheetJson.rightThickBoarderColArrForHeaders : inputSheetJson.rightThickBoarderColArrForHeaders = [];
                inputSheetJson.rightThickBoarderColArrForHeaders.push(inputSheetJson.columnCount, 5, 19);
                inputSheetJson.fourteenSizeArray = [3];
                inputSheetJson.mergeArr.push(
                    await this.prepareMergeRecord(2, 0, 2, inputSheetJson.columnCount),
                    await this.prepareMergeRecord(1, 2, 1, 6),
                    await this.prepareMergeRecord(1, 8, 1, 10),
                    // await this.prepareMergeRecord(1, 11, 1, inputSheetJson.columnCount + 1),
                    await this.prepareMergeRecord(1, 11, 1, inputSheetJson.columnCount + 1),
                    await this.prepareMergeRecord(3, 1, 3, 5),
                    await this.prepareMergeRecord(3, 6, 4, 6),
                    await this.prepareMergeRecord(3, 7, 3, 19),
                    await this.prepareMergeRecord(3, 21, 3, 23),
                    await this.prepareMergeRecord(3, 20, 4, 20),
                    await this.prepareMergeRecord(4, 3, 4, 4),
                    await this.prepareMergeRecord(4, 8, 4, 9),
                    await this.prepareMergeRecord(4, 12, 4, 13),
                    await this.prepareMergeRecord(4, 14, 4, 15),
                    await this.prepareMergeRecord(4, 21, 4, inputSheetJson.columnCount),
                    await this.prepareMergeRecord(5, 0, 5, inputSheetJson.columnCount + 1),
                );
                inputSheetJson.topAndBottomBorderDashedColArrayForHeaders ? inputSheetJson.topAndBottomBorderDashedColArrayForHeaders : inputSheetJson.topAndBottomBorderDashedColArrayForHeaders = [];
                inputSheetJson.topAndBottomBorderDashedColArrayForHeaders.push(6, 20);

                //footer
                // inputSheetJson.jsonArr.push(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
                // inputSheetJson.mergeArr.push(await this.prepareMergeRecord(inputSheetJson.jsonArr.length + 5, 0, inputSheetJson.jsonArr.length + 5, 24))
                if (inputSheetJson.type === "Multi-Node Summary") {
                    inputSheetJson.jsonArr.push(['', 'Prepared by the Executive Toolkit Powered by eMATE Consulting, LLC', '', '', '', '', '', '', '', '', '', '', '', 'Organization Name:', '', '', 'eMATE Consulting, LLC', '', '']);
                    inputSheetJson.mergeArr.push(
                        await this.prepareMergeRecord(inputSheetJson.jsonArr.length + 5, 1, inputSheetJson.jsonArr.length + 5, 4),
                        await this.prepareMergeRecord(inputSheetJson.jsonArr.length + 5, 5, inputSheetJson.jsonArr.length + 5, 12),
                        await this.prepareMergeRecord(inputSheetJson.jsonArr.length + 5, 13, inputSheetJson.jsonArr.length + 5, 15),
                        await this.prepareMergeRecord(inputSheetJson.jsonArr.length + 5, 16, inputSheetJson.jsonArr.length + 5, 18)
                    );
                } else if (inputSheetJson.type === "Analysis Summary") {
                    inputSheetJson.jsonArr.push(['', 'Prepared by the Executive Toolkit Powered by eMATE Consulting, LLC', '', '', '', '', '', '', '', '', '', 'Organization Name:', '', '', 'eMATE Consulting, LLC', '', '']);
                    inputSheetJson.mergeArr.push(
                        await this.prepareMergeRecord(inputSheetJson.jsonArr.length + 5, 1, inputSheetJson.jsonArr.length + 5, 4),
                        await this.prepareMergeRecord(inputSheetJson.jsonArr.length + 5, 5, inputSheetJson.jsonArr.length + 5, 10),
                        await this.prepareMergeRecord(inputSheetJson.jsonArr.length + 5, 11, inputSheetJson.jsonArr.length + 5, 13),
                        await this.prepareMergeRecord(inputSheetJson.jsonArr.length + 5, 14, inputSheetJson.jsonArr.length + 5, 16)
                    );
                } else {
                    inputSheetJson.jsonArr.push(['', 'Prepared by the Executive Toolkit Powered by eMATE Consulting, LLC', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Organization Name:', '', '', 'eMATE Consulting, LLC', '', '']);
                    inputSheetJson.mergeArr.push(
                        await this.prepareMergeRecord(inputSheetJson.jsonArr.length + 5, 1, inputSheetJson.jsonArr.length + 5, 4),
                        await this.prepareMergeRecord(inputSheetJson.jsonArr.length + 5, 5, inputSheetJson.jsonArr.length + 5, 17),
                        await this.prepareMergeRecord(inputSheetJson.jsonArr.length + 5, 18, inputSheetJson.jsonArr.length + 5, 20),
                        await this.prepareMergeRecord(inputSheetJson.jsonArr.length + 5, 21, inputSheetJson.jsonArr.length + 5, 23)
                    );
                }
                inputSheetJson.noBorderRowTitleFooter = [inputSheetJson.jsonArr.length + 5];
                inputSheetJson.leftAlignmentRow = [inputSheetJson.jsonArr.length + 5].concat(inputSheetJson.leftAlignmentRow);
                inputSheetJson.rightAlignmentRow = [inputSheetJson.jsonArr.length + 5].concat(inputSheetJson.rightAlignmentRow);
            }

            if (reportTemplate == 'portAnalysis' || selectedDate || comparisonType) {
                reportTemplate = 'portAnalysis';
                headerInfo = "Port Analysis Scorecard";
                inputSheetJson.centerAlignmentArr.push(0);
                inputSheetJson.headingSizeArray.push(0);
                inputSheetJson.headers = [
                    [headerInfo]
                ];
            }

            inputSheetJson.mergeArr.push({
                s: {
                    r: 0,
                    c: 1
                },
                e: {
                    r: 0,
                    c: inputSheetJson.columnCount
                }
            });
        }
        // console.log("inputSheetJson", inputSheetJson)
        let ws = xlsx.utils.json_to_sheet([]);
        xlsx.utils.sheet_add_aoa(ws, inputSheetJson.headers);
        xlsx.utils.sheet_add_json(ws, inputSheetJson.jsonArr, {
            origin: startFrom,
            skipHeader: true
        });


        if (reportTemplate == 'portAnalysis' || selectedDate || comparisonType) {
            for (let i in ws) {
                if (typeof (ws[i]) != "object") continue;
                let cell = xlsx.utils.decode_cell(i);

                // common styling
                ws[i].s = {
                    alignment: {
                        horizontal: "center",
                        vertical: "center"
                    },
                    border: {
                        left: {
                            style: "dotted",
                            color: "000000"
                        },
                        right: {
                            style: "dotted",
                            color: "000000"
                        },
                        top: {
                            style: "dotted",
                            color: "000000"
                        },
                        bottom: {
                            style: "dotted",
                            color: "000000"
                        },
                    },
                    wrapText: cell.r == 0 ? true : false
                }

                // conditional styling
                if (inputSheetJson.topThickBoarderRowArr && inputSheetJson.topThickBoarderRowArr.includes(cell.r)) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: ws[i].s.border.right.style,
                            color: ws[i].s.border.right.color
                        },
                        top: {
                            style: "thick",
                            color: "000000"
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (inputSheetJson.bottomThickBorderRowArr && inputSheetJson.bottomThickBorderRowArr.includes(cell.r)) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: ws[i].s.border.right.style,
                            color: ws[i].s.border.right.color
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: "thick",
                            color: "000000"
                        }
                    }
                }

                if (inputSheetJson.leftThickBoarderColArr && inputSheetJson.leftThickBoarderColArr.includes(cell.c) && cell.r != 0) {
                    ws[i].s.border = {
                        left: {
                            style: 'thick',
                            color: "000000"
                        },
                        right: {
                            style: ws[i].s.border.right.style,
                            color: ws[i].s.border.right.color
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (inputSheetJson.rightThickBoarderColArr && inputSheetJson.rightThickBoarderColArr.includes(cell.c) && cell.r != 0) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: "thick",
                            color: "000000"
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (cell.r == 2 && cell.c == inputSheetJson.columnCount - 1) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: "thick",
                            color: "000000"
                        },
                        top: {
                            style: "thick",
                            color: "000000"
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (inputSheetJson.rightThinBoarderColArr && inputSheetJson.rightThinBoarderColArr.includes(cell.c) && cell.r != 0) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: "thin",
                            color: "000000"
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (inputSheetJson.rightDoubleBoarderColArr && inputSheetJson.rightDoubleBoarderColArr.includes(cell.c) && cell.r != 0) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: "double",
                            color: "000000"
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (inputSheetJson.bottomDoubleBoarderColArr && inputSheetJson.bottomDoubleBoarderColArr.includes(cell.r)) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: ws[i].s.border.right.style,
                            color: ws[i].s.border.right.color
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: "double",
                            color: "000000"
                        }
                    }
                }

                if (inputSheetJson.currencyColArr && inputSheetJson.currencyColArr.includes(cell.c) && cell.r != 0) {
                    ws[i].s.numFmt = "$0.00";
                }

                if (inputSheetJson.boldRowArr && inputSheetJson.boldRowArr.includes(cell.r)) {
                    ws[i].s.font = {
                        bold: true
                    };
                }

                if (inputSheetJson.centerAlignmentArr && inputSheetJson.centerAlignmentArr.includes(cell.r)) {
                    ws[i].s.alignment = {
                        horizontal: "center",
                        vertical: "center"
                    }
                }

                if (inputSheetJson.headingSizeArray && inputSheetJson.headingSizeArray.includes(cell.r)) {
                    ws[i].s = {
                        font: {
                            sz: 22
                        },
                        alignment: {
                            horizontal: "center",
                            vertical: "center"
                        }
                    }
                }

                if (inputSheetJson.yellowColorArray && inputSheetJson.yellowColorArray.includes(cell.r) && cell.c != 1) {
                    ws[i].s.fill = {
                        fgColor: {
                            rgb: "ffff33"
                        }
                    }
                }

                if (inputSheetJson.overAllSummaryStyleArray && inputSheetJson.overAllSummaryStyleArray.includes(cell.r)) {
                    ws[i].s.font = {
                        sz: 14,
                        bold: true
                    }
                }

                if (inputSheetJson.textRotationField && inputSheetJson.textRotationField.includes(cell.c) && cell.r == 3) {
                    ws[i].s.alignment.textRotation = 90
                }

                if (ws[i].v == "⬆") {
                    ws[i].s.fill = {
                        fgColor: {
                            rgb: "4CAE4C"
                        }
                    };
                }
                if (ws[i].v == "⬇") {
                    ws[i].s.fill = {
                        fgColor: {
                            rgb: "E11414"
                        }
                    };
                }

                if (inputSheetJson.fontSizeElevenArray && inputSheetJson.fontSizeElevenArray.includes(cell.r)) {
                    ws[i].s.font = {
                        sz: 11
                    }
                }

                if (inputSheetJson.fontSizeEightArray && inputSheetJson.fontSizeEightArray.includes(cell.c) && cell.r == 3) {
                    ws[i].s.font = {
                        sz: 8
                    }
                }

                if (reportTemplate == 'portAnalysis' && cell.c == 16 && cell.r > 4) {
                    const color = await this.getColorForReliability(ws[i].v);
                    if (color) {
                        ws[i].v = '';
                        ws[i].s.fill = {
                            fgColor: {
                                rgb: color
                            }
                        }
                    }
                }
            }
            ws['!cols'] = inputSheetJson.columnLengthArray ? inputSheetJson.columnLengthArray : [];
            ws['!cols'][15].hidden = true;

        }

        if (reportTemplate == 'networkComputation') {
            for (let i in ws) {
                if (typeof (ws[i]) != "object") continue;
                let cell = xlsx.utils.decode_cell(i);

                // common styles
                ws[i].s = {
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                    },
                    border: {
                        left: {
                            style: "dashed",
                            color: "000000"
                        },
                        right: {
                            style: "dashed",
                            color: "000000"
                        },
                        top: {
                            style: "dashed",
                            color: "000000"
                        },
                        bottom: {
                            style: "dashed",
                            color: "000000"
                        },
                    },
                    wrapText: cell.r == 0 ? true : false
                }

                // conditional styles
                if (inputSheetJson.headingSizeArray && inputSheetJson.headingSizeArray.includes(cell.r)) {
                    ws[i].s.font = {
                        sz: 26,
                        bold: true
                    }
                    ws[i].s.alignment = {
                        horizontal: "left",
                        vertical: "center"
                    }
                }

                const columnForLeftAlignment = [1, 21]
                if (inputSheetJson.leftAlignmentRow && inputSheetJson.leftAlignmentRow.includes(cell.r) && columnForLeftAlignment.includes(cell.c)) {
                    ws[i].s.alignment = {
                        horizontal: "left",
                        vertical: "center"
                    }
                }
                const columnForRightAlignment = [18]
                if (inputSheetJson.rightAlignmentRow && inputSheetJson.rightAlignmentRow.includes(cell.r) && columnForRightAlignment.includes(cell.c)) {
                    ws[i].s.alignment = {
                        horizontal: "right",
                        vertical: "center"
                    }
                }

                if (inputSheetJson.fourteenSizeArray && inputSheetJson.fourteenSizeArray.includes(cell.r)) {
                    ws[i].s.font = {
                        sz: 14,
                        bold: true
                    }
                    ws[i].s.alignment = {
                        horizontal: "center",
                        vertical: "center"
                    }
                }

                if (inputSheetJson.sixteenSizeFontArray && inputSheetJson.sixteenSizeFontArray.includes(cell.r)) {
                    ws[i].s.font = {
                        sz: 16,
                        bold: true
                    }
                    ws[i].s.alignment = {
                        horizontal: "left",
                        vertical: "center"
                    }
                }

                if (inputSheetJson.topThickBoarderRowArr && inputSheetJson.topThickBoarderRowArr.includes(cell.r) && cell.c != 0) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: ws[i].s.border.right.style,
                            color: ws[i].s.border.right.color
                        },
                        top: {
                            style: "thick",
                            color: "000000"
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (inputSheetJson.bottomThickBoarderRowArr && inputSheetJson.bottomThickBoarderRowArr.includes(cell.r) && cell.c != 0) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: ws[i].s.border.right.style,
                            color: ws[i].s.border.right.color
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: "thick",
                            color: "000000"
                        }
                    }
                }

                if (inputSheetJson.leftThickBoarderColArr && inputSheetJson.leftThickBoarderColArr.includes(cell.c) && cell.r > 5 && !inputSheetJson.noBorderRowTitle.includes(cell.r) && !inputSheetJson.noBorderRowTitleFooter.includes(cell.r)) {
                    ws[i].s.border = {
                        left: {
                            style: 'thick',
                            color: "000000"
                        },
                        right: {
                            style: ws[i].s.border.right.style,
                            color: ws[i].s.border.right.color
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (inputSheetJson.leftThickBoarderColArrForHeaders && inputSheetJson.leftThickBoarderColArrForHeaders.includes(cell.c) && (cell.r == 3 || cell.r == 4)) {
                    ws[i].s.border = {
                        left: {
                            style: 'thick',
                            color: "000000"
                        },
                        right: {
                            style: ws[i].s.border.right.style,
                            color: ws[i].s.border.right.color
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (inputSheetJson.rightThickBoarderColArr && inputSheetJson.rightThickBoarderColArr.includes(cell.c) && cell.r > 5 && !inputSheetJson.noBorderRowTitle.includes(cell.r) && !inputSheetJson.noBorderRowTitleFooter.includes(cell.r)) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: "thick",
                            color: "000000"
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }

                if (inputSheetJson.rightThickBoarderColArrForHeaders && inputSheetJson.rightThickBoarderColArrForHeaders.includes(cell.c) && (cell.r == 3 || cell.r == 4)) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: "thick",
                            color: "000000"
                        },
                        top: {
                            style: ws[i].s.border.top.style,
                            color: ws[i].s.border.top.color
                        },
                        bottom: {
                            style: ws[i].s.border.bottom.style,
                            color: ws[i].s.border.bottom.color
                        }
                    }
                }



                if (inputSheetJson.currencyColArr && inputSheetJson.currencyColArr.includes(cell.c) && cell.r != 0) {
                    ws[i].s.numFmt = "$0.00";
                }

                if (inputSheetJson.percentageFormatColArr && inputSheetJson.percentageFormatColArr.includes(cell.c) && cell.r > 5) {
                    ws[i].s.numFmt = '#,#0.00"%"';
                }

                if (inputSheetJson.boldRowArr && inputSheetJson.boldRowArr.includes(cell.r)) {
                    ws[i].s.font = {
                        bold: true
                    }
                }

                if (inputSheetJson.topAndBottomBorderDashedColArray && inputSheetJson.topAndBottomBorderDashedColArray.includes(cell.c) && cell.r > 5) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: ws[i].s.border.right.style,
                            color: ws[i].s.border.right.color
                        },
                        top: {
                            style: "dashed",
                            color: "000000"
                        },
                        bottom: {
                            style: "dashed",
                            color: "000000"
                        },
                    }
                }

                if (inputSheetJson.topAndBottomBorderDashedColArrayForHeaders && inputSheetJson.topAndBottomBorderDashedColArrayForHeaders.includes(cell.c) && (cell.r == 3 || cell.r == 4)) {
                    ws[i].s.border = {
                        left: {
                            style: ws[i].s.border.left.style,
                            color: ws[i].s.border.left.color
                        },
                        right: {
                            style: ws[i].s.border.right.style,
                            color: ws[i].s.border.right.color
                        },
                        top: {
                            style: "dashed",
                            color: "000000"
                        },
                        bottom: {
                            style: "dashed",
                            color: "000000"
                        },
                    }
                }

                if (inputSheetJson.yellowColorColArray && inputSheetJson.yellowColorColArray.includes(cell.c) && ((cell.r >= inputSheetJson.colorRowDetail.startRowForYellowColorSummary && cell.r <= inputSheetJson.colorRowDetail.endRowForYellowColorSummary) || (cell.r >= inputSheetJson.colorRowDetail.startRowForYellowColorDetail && cell.r <= inputSheetJson.colorRowDetail.endRowForYellowColorDetail))) {
                    ws[i].s.fill = {
                        fgColor: {
                            rgb: sheetData.sheetName !== 'Final Summary' ? "ffff33" : 'B4DE86'
                        }
                    }
                }

                highlightedRaterPercentageRowArr.push(21); // for service level
                if (cell.r == 4 && highlightedRaterPercentageRowArr.includes(cell.c)) {
                    ws[i].s.fill = {
                        fgColor: {
                            rgb: "ffff33"
                        }
                    }
                }

                if (inputSheetJson.type === "Multi-Node Summary") {
                    if ((cell.c === 8 || cell.c === 14) && cell.r >= inputSheetJson.reportJsonCount.detailedReport.s) {
                        ws[i].s.border = {
                            left: {
                                style: "dashed",
                                color: "000000"
                            },
                            right: {
                                style: "dashed",
                                color: "000000"
                            },
                            top: {
                                style: ws[i].s.border.top.style,
                                color: ws[i].s.border.top.color
                            },
                            bottom: {
                                style: ws[i].s.border.bottom.style,
                                color: ws[i].s.border.bottom.color
                            },
                        }
                    }
                    if (cell.r >= inputSheetJson.reportJsonCount.detailedReport.s && cell.r <= inputSheetJson.reportJsonCount.detailedReport.e) {
                        if (cell.c === 10 || cell.c === 18) {
                            ws[i].s.border = {
                                left: {
                                    style: 'thick',
                                    color: "000000"
                                },
                                right: {
                                    style: ws[i].s.border.right.style,
                                    color: ws[i].s.border.right.color
                                },
                                top: {
                                    style: ws[i].s.border.top.style,
                                    color: ws[i].s.border.top.color
                                },
                                bottom: {
                                    style: ws[i].s.border.bottom.style,
                                    color: ws[i].s.border.bottom.color
                                }
                            }
                        }
                    }
                }
                if (inputSheetJson.type === "Single Site Performance") {
                    if (cell.c > 0 && cell.c < 6 && cell.r >= inputSheetJson.reportJsonCount.percentageReport.s && cell.r <= inputSheetJson.reportJsonCount.percentageReport.e) {
                        ws[i].s.border = {
                            left: {
                                style: "dashed",
                                color: "000000"
                            },
                            right: {
                                style: "dashed",
                                color: "000000"
                            },
                            top: {
                                style: "dashed",
                                color: "000000"
                            },
                            bottom: {
                                style: "dashed",
                                color: "000000"
                            },
                        }
                    }
                    if (cell.c === 6 && cell.r >= inputSheetJson.reportJsonCount.percentageReport.s && cell.r <= inputSheetJson.reportJsonCount.percentageReport.e) {
                        ws[i].s.border = {
                            left: {
                                style: "dashed",
                                color: "000000"
                            },
                            right: {
                                style: ws[i].s.border.right.style,
                                color: ws[i].s.border.right.color
                            },
                            top: {
                                style: "dashed",
                                color: "000000"
                            },
                            bottom: {
                                style: "dashed",
                                color: "000000"
                            },
                        }
                    }
                    if (cell.c > 0 && cell.c <= 6 && cell.r >= inputSheetJson.reportJsonCount.percentageReport.s - 1 && cell.r <= inputSheetJson.reportJsonCount.percentageReport.e) {
                        ws[i].s.border = {
                            left: {
                                style: ws[i].s.border.left.style,
                                color: ws[i].s.border.left.color
                            },
                            right: {
                                style: ws[i].s.border.right.style,
                                color: ws[i].s.border.right.color
                            },
                            top: {
                                style: ws[i].s.border.top.style,
                                color: ws[i].s.border.top.color
                            },
                            bottom: {
                                style: "dashed",
                                color: "000000"
                            },
                        }
                    }
                    inputSheetJson.mergeArr.push(await this.prepareMergeRecord(inputSheetJson.reportJsonCount.percentageReport.s, 15, inputSheetJson.reportJsonCount.percentageReport.e, 15))
                    // inputSheetJson.mergeArr.push(await this.prepareMergeRecord(inputSheetJson.reportJsonCount.percentageReport.s, 1, inputSheetJson.reportJsonCount.percentageReport.e, 4))
                    // inputSheetJson.mergeArr.push(await this.prepareMergeRecord(inputSheetJson.reportJsonCount.percentageReport.s, 5, inputSheetJson.reportJsonCount.percentageReport.e, 6))
                }

                if (inputSheetJson.type === "Analysis Summary") {
                    inputSheetJson.mergeArr.push(await this.prepareMergeRecord(inputSheetJson.reportJsonCount.serviceLevelWiseData.s, 6, inputSheetJson.reportJsonCount.serviceLevelWiseData.e, 6))

                    if (cell.c === 5 && cell.r === inputSheetJson.reportJsonCount.serviceLevelWiseData.e) {
                        ws[i].s.border = {
                            left: {
                                style: ws[i].s.border.left.style,
                                color: ws[i].s.border.left.color
                            },
                            right: {
                                style: 'thick',
                                color: "000000"
                            },
                            top: {
                                style: ws[i].s.border.top.style,
                                color: ws[i].s.border.top.color
                            },
                            bottom: {
                                style: ws[i].s.border.bottom.style,
                                color: ws[i].s.border.bottom.color
                            },
                        }
                    }
                    if (cell.c >= 7 && cell.c <= 16 && cell.r === inputSheetJson.reportJsonCount.serviceLevelWiseData.e - 1) {
                        ws[i].s.border = {
                            left: {
                                style: ws[i].s.border.left.style,
                                color: ws[i].s.border.left.color
                            },
                            right: {
                                style: ws[i].s.border.right.style,
                                color: ws[i].s.border.right.color
                            },
                            top: {
                                style: ws[i].s.border.top.style,
                                color: ws[i].s.border.top.color
                            },
                            bottom: {
                                style: 'thick',
                                color: "000000"
                            },
                        }
                    }
                    if (cell.r >= inputSheetJson.reportJsonCount.overallData.s && cell.r <= inputSheetJson.reportJsonCount.overallData.e) {
                        if (cell.c === 6) {
                            ws[i].s.border = {
                                left: {
                                    style: "dashed",
                                    color: "000000"
                                },
                                right: {
                                    style: "dashed",
                                    color: "000000"
                                },
                                top: {
                                    style: ws[i].s.border.top.style,
                                    color: ws[i].s.border.top.color
                                },
                                bottom: {
                                    style: ws[i].s.border.bottom.style,
                                    color: ws[i].s.border.bottom.color
                                }
                            }
                        }
                        if (cell.c === 7) {
                            ws[i].s.border = {
                                left: {
                                    style: ws[i].s.border.left.style,
                                    color: ws[i].s.border.left.color
                                },
                                right: {
                                    style: 'thick',
                                    color: "000000"
                                },
                                top: {
                                    style: ws[i].s.border.top.style,
                                    color: ws[i].s.border.top.color
                                },
                                bottom: {
                                    style: ws[i].s.border.bottom.style,
                                    color: ws[i].s.border.bottom.color
                                }
                            }
                        }
                    }
                    if (cell.r === 5 && cell.c === 6) {
                        ws[i].s.border = {
                            left: {
                                style: ws[i].s.border.left.style,
                                color: ws[i].s.border.left.color
                            },
                            right: {
                                style: ws[i].s.border.right.style,
                                color: ws[i].s.border.right.color
                            },
                            top: {
                                style: ws[i].s.border.top.style,
                                color: ws[i].s.border.top.color
                            },
                            bottom: {
                                style: "dashed",
                                color: "000000"
                            }
                        }
                    }
                    if (cell.r === 6 && cell.c === 6) {
                        ws[i].s.border = {
                            left: {
                                style: ws[i].s.border.left.style,
                                color: ws[i].s.border.left.color
                            },
                            right: {
                                style: ws[i].s.border.right.style,
                                color: ws[i].s.border.right.color
                            },
                            top: {
                                style: "dashed",
                                color: "000000"
                            },
                            bottom: {
                                style: ws[i].s.border.bottom.style,
                                color: ws[i].s.border.bottom.color
                            }
                        }
                    }
                }

                ws['!cols'] = inputSheetJson.columSizeArr ? inputSheetJson.columSizeArr : [];

            }
        }
        ws["!merges"] = inputSheetJson.mergeArr ? inputSheetJson.mergeArr : [];

        return ws;
    }


    static async generateHTMLToPDF(transactionId, userInfo, inputMainJson) {
        //need to check it with ejs report
        let reportUrl;
        inputMainJson.nearshoreMainJson['apiUrl'] = config.apiUrl;
        await ejs.renderFile(path.join(__dirname, '../../../views/nearshoresummaryHC.ejs'), inputMainJson.nearshoreMainJson, {}, (err, data) => {
            if (err) console.log(err)
            reportUrl = treeLogicsController.printPDF(data, transactionId);
        })
        return reportUrl;
    }

    static async printPDF(html, transactionId) {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36 WAIT_UNTIL=load"
        );
        await page.setContent(html, {
            "waitUntil" : "networkidle0"
        });
        // To reflect CSS used for screens instead of print
        await page.emulateMediaType("screen");
        await page.waitForNetworkIdle();
        await page.waitForSelector("img", {
            timeout: 10000
        });
        // Download the PDF
        const PDF = await page.pdf({
            path: config.reportFolderPath + "/report_" + transactionId + ".pdf",
            margin: {
                top: "100px",
                right: "50px",
                bottom: "100px",
                left: "50px"
            },
            printBackground: true,
            format: "A4",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        // Close the browser instance
        await browser.close();
        return config.reportFileUrl + 'report_' + transactionId + '.pdf';
    }


    // this is just demo
    static async generateHTMLToPDFDemo(transactionId = 123, userInfo = [], inputMainJson) {
        console.log("In function")
        //need to check it with ejs report
        const obj = {
            locations: [{
                    location: "Santos",
                    lat: -23.95109,
                    long: -46.35358,
                    pinType: "portFuture",
                },
                {
                    location: "Vancouver",
                    lat: 49.30355,
                    long: -123.0475,
                    pinType: "portCurrent",
                },
                {
                    location: "San Antonio",
                    lat: -33.5875,
                    long: -71.61829,
                    pinType: "mfgFuture",
                },
                {
                    location: "Qingdao",
                    lat: 36.05661,
                    long: 120.3201,
                    pinType: "mfgCurrent",
                },
                {
                    location: "Shanghai",
                    lat: 31.36636,
                    long: 121.6147,
                    pinType: "node",
                },
            ],
            currentPort: "Santos",
            futurePort: "Vancouver",
            distributionNode: "Shanghai",
            currentManufacturing: "Qingdao",
            futureManufacturing: "San Antonio",
            LTNet: 50,
            ContainerSavings: 100,
            DSavings: 50000000,
            SpaceCost: 10000000,
            LaborCost: 50000,
            FMCost: 10000000,
            InTransitInv: 20000
        };
        obj["valueOfManufacturingRelocation"] = obj['LTNet'] + obj['ContainerSavings'] + obj['DSavings'];
        obj["costOfPlantOwnership"] = obj['SpaceCost'] + obj['LaborCost'];
        obj["finalDistributionRelocation"] = obj['FMCost'] + obj['InTransitInv'];
        obj["totalOpportunityValue"] = obj["valueOfManufacturingRelocation"] + obj["costOfPlantOwnership"] + obj["finalDistributionRelocation"];
        obj["locations"] = JSON.stringify(obj.locations);
        ejs.renderFile(path.join(__dirname, '../../../views/nearshoresummaryHC.ejs'), obj, {}, async (err, data) => {
            if (err) console.log(err)

            await treeLogicsController.printPDF(data, transactionId);
            res.status(200).send({
                message: "report generated"
            });
        })
    }

    static prepareNetWorkCompLocationData(selectedSite,SiteData) {
        let location = []
        if (selectedSite.length > 0 && SiteData.length > 0) {
            const siteNameMap = new Map(SiteData.map(item => [item.SiteName, item]));
            selectedSite.forEach(item => {
              const matchingItem = siteNameMap.get(item.SiteName);
              if (matchingItem) {
                item.Latitude = matchingItem.Latitude;
                item.Longitude = matchingItem.Longitude;
              }
            });
          location = selectedSite
        }
        return location
    }
    
    static async getExcelFileDisplayName(fileName = "", selectedFields = "", node) {

        let fileDisplayColumn = ""
        let fileGroupByDisplayName = ""
        let query={ fileName: fileName };
        if(node.metaData.isFetchFromLookup){
            let variableKey = node.metaData.lookupVariableName.replace(/{|}/g, '')
            let varNodeData = await nodeQuery.findOne({
                decisionTreeId: node.decisionTreeId,
                isActive: true,
                "metaData.inputs.localVariableName": variableKey
            });
            const matchingFileIds = [];
            if (varNodeData) {
                for (const input of varNodeData.metaData.inputs) {
                    if (input.localVariableName === node.metaData.lookupVariableName.replace(/{|}/g, '')) {
                      matchingFileIds.push(input.fileValue.fileId);
                    }
                  }
            }

            if (matchingFileIds.length>0) {
                query = {_id:mongoose.Types.ObjectId(matchingFileIds[0])}
            }
        }
        if (selectedFields) {
            let selectedFieldArray = selectedFields.split(" ");
            let excelRes = await excelDataQuery.findOne({
                ...query,
                isDeleted: false
            },{
                displayNameHeaders:1,
                _id:0
            });
            if (!_.isEmpty(excelRes)) {
                fileDisplayColumn = excelRes.displayNameHeaders ? excelRes.displayNameHeaders[selectedFieldArray[0]] : "";
                fileGroupByDisplayName =excelRes.displayNameHeaders? excelRes.displayNameHeaders[selectedFieldArray[1]] : "";
            }
        }
        return {fileDisplayColumn, fileGroupByDisplayName}
    }

}
