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


export default class treeLogicsController {

    //================================ Utility Functions to Get Excel Data =====================

    static async getExcelFileDataList(fileName = "", selectedFields = "") {

        let projectFields = {};
        if (selectedFields) {
            projectFields[`fileData._id`] = 1;
            let selectedFieldArray = selectedFields.split(" ");
            for (let element of selectedFieldArray) {
                projectFields[`fileData.${element}`] = 1;
            }
        }

        let excelRes = await excelDataQuery.findOne({
            fileName: fileName
        }, projectFields);
        return excelRes ? excelRes.fileData : [];
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

    static filterDataListByItemIds(dataList = [], ArrayOfIds = []) {

        return dataList.filter(obj => ArrayOfIds.includes(obj._id.toString()));
    }

    static filterItemsInDataList(dataList = [], key = "", value = "") {

        return dataList.filter(obj => obj[key] == value);
    }

    static findItemInDataList(dataList = [], key = "", value = "") {

        return dataList.find(obj => obj[key] == value);
    }

    static groupByDataList(dataList = [], fieldName = "") {

        return _.chain(dataList).groupBy(fieldName).map((value, key) => ({
            [fieldName]: key,
            list: value
        })).value();
    }

    static sumArrayItems(dataList = [], fieldName = "") {

        return dataList.reduce((acc, item) => {
            return acc + (item[fieldName]);
        }, 0);
    }

    static averageArrayItems(dataList = [], fieldName = "") {

        return dataList.reduce((acc, item) => {
            return acc + (item[fieldName] / dataList.length);
        }, 0)
    }

    static async getLoopTypeSlugById(loopTypeId) {

        let loopRes = await loopTypeQuery.findOne({
            _id: loopTypeId
        });
        return loopRes ? loopRes.slug : "";
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

        let Containers = objItem["Containers"] || 0;
        let DryBreakbulk = objItem["DryBreakbulk"] || 0;
        let DryBulk = objItem["DryBulk"] || 0;
        let RoRo = objItem["RoRo"] || 0;
        let LPGCarriers = objItem["LPGCarriers"] || 0;
        let LNGCarriers = objItem["LNGCarriers"] || 0;
        let WetBulk = objItem["WetBulk"] || 0;
        let OtherMarkets = objItem["OtherMarkets"] || 0;
        let OffshoreRigs = objItem["OffshoreRigs"] || 0;

        return Containers + DryBreakbulk + DryBulk + RoRo + LPGCarriers + LNGCarriers + WetBulk + OtherMarkets + OffshoreRigs;
    }

    static getPortFormattedDate(date) {

        var dateArr = date.split("/");
        return dateArr[0] + "/" + dateArr[1];
    }

    static getTrend(value1, value2, trendPercent) {

        var dateArr = date.split("/");
        return dateArr[0] + "/" + dateArr[1];
    }

    static getRealDate(dateString = "") {

        dateString = dateString.replace(/['"]+/g, '');
        return moment(dateString, "D/M/YYYY").format('M/D/YYYY');
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
        if (!amount) {
            return "";
        }
        return (amount / totalAmount * 100).toFixed(2) != "0.00" ? (amount / totalAmount * 100).toFixed(2) + "%" : "";
        // return amount ? (amount / totalAmount * 100).toFixed(2) != "0.00" ? (amount / totalAmount * 100).toFixed(2) + "%" : "" : "";
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
            var userId = reqParams.userId || null;
            var transactionId = reqParams.transactionId || null;
            var loopTypeId = reqParams.loopTypeId || null;

            // Get loop type slug by id
            var loopType = await treeLogicsController.getLoopTypeSlugById(loopTypeId);

            // Get user transaction inputs 
            var findUtiPattern = {
                userTransactionId: transactionId,
                isActive: true
            };
            var userTransInputsData = await userTransactionInputQuery.findAll(findUtiPattern);

            let inputValue = null;

            if (loopType != "portRater") {

                var selectedProducts = treeLogicsController.getUserTransactionInputValueReference(userTransInputsData, "variableName", "selectedProducts", "Array");
                var selectedSites = treeLogicsController.getUserTransactionInputValueReference(userTransInputsData, "variableName", "selectedSites", "Array");
                var selectedStates = treeLogicsController.getUserTransactionInputValueReference(userTransInputsData, "variableName", "selectedStates", "Array");
                var selectedServiceLevels = treeLogicsController.getUserTransactionInputValueReference(userTransInputsData, "variableName", "selectedServiceLevels", "Array");

                // Get file id
                var productsFileId = treeLogicsController.getUserTransactionInputFileId(userTransInputsData, "variableName", "selectedProducts");
                var statesFileId = treeLogicsController.getUserTransactionInputFileId(userTransInputsData, "variableName", "selectedStates");
                var sitesFileId = treeLogicsController.getUserTransactionInputFileId(userTransInputsData, "variableName", "selectedSites");
                var serviceLevelFileId = treeLogicsController.getUserTransactionInputFileId(userTransInputsData, "variableName", "selectedServiceLevels");

                // Common Calculation
                var productList = await treeLogicsController.getExcelFileDataListById(productsFileId);
                var statesList = await treeLogicsController.getExcelFileDataListById(statesFileId);
                var sitesList = await treeLogicsController.getExcelFileDataListById(sitesFileId);
                var serviceLevelTypesList = await treeLogicsController.getExcelFileDataListById(serviceLevelFileId);
                var parcelRatesList = await treeLogicsController.getExcelFileDataList("Parcel Rates");
                var trailerSizesList = await treeLogicsController.getExcelFileDataList("Trailer Sizes");
                var mileageList = await treeLogicsController.getExcelFileDataList("Mileage");
                var ltLRatesList = await treeLogicsController.getExcelFileDataList("LTL Rates");
                var weightUnitsList = await treeLogicsController.getExcelFileDataList("Weight Units");

                // Get selected service levels
                var serviceLevelsArr = treeLogicsController.filterDataListByItemIds(serviceLevelTypesList, selectedServiceLevels);
                var inputServiceLevel = serviceLevelsArr.length > 0 ? serviceLevelsArr[0]["Number"] : 1;

                // Get selected sites
                var siteArr = treeLogicsController.filterDataListByItemIds(sitesList, selectedSites);

                // Get average of population of selected states
                var stateArr = treeLogicsController.filterDataListByItemIds(statesList, selectedStates);
                var sumPopulation = treeLogicsController.sumArrayItems(stateArr, "Population");

                // Get average of weight of selected products
                var productArr = treeLogicsController.filterDataListByItemIds(productList, selectedProducts);

                // Group products by category
                var groupedProductArr = treeLogicsController.groupByDataList(productArr, "Category");

                groupedProductArr = groupedProductArr.map((itemObj) => {
                    itemObj.averageRetailPrice = treeLogicsController.averageArrayItems(itemObj.list, "RetailPrice");
                    itemObj.averagePCuFt = treeLogicsController.averageArrayItems(itemObj.list, "PCuFt");
                    itemObj.averageWeight = treeLogicsController.averageArrayItems(itemObj.list, "ActualWeight");
                    return itemObj;
                });

                // Get average by categories
                var averageRetailPrice = treeLogicsController.averageArrayItems(groupedProductArr, "averageRetailPrice");
                var averagePCuFt = treeLogicsController.averageArrayItems(groupedProductArr, "averagePCuFt");
                var actualAverageWeight = treeLogicsController.averageArrayItems(groupedProductArr, "averageWeight");
                var averageWeight = Math.ceil(actualAverageWeight);

                var parcelRaterMainJson = [];
                var ltlRaterMainJson = [];
                var tlRaterMainJson = [];
                var fleetRaterMainJson = [];

                // Get existing report summary data
                var reportSummary = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "reportSummary", "Object");

                if (reportSummary) {
                    parcelRaterMainJson = reportSummary.mainJson.parcelRaterMainJson || [];
                    ltlRaterMainJson = reportSummary.mainJson.ltlRaterMainJson || [];
                    tlRaterMainJson = reportSummary.mainJson.tlRaterMainJson || [];
                    fleetRaterMainJson = reportSummary.mainJson.fleetRaterMainJson || [];
                }

                // Get Percent Inputs
                var overAllRevenue = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "overAllRevenue", "Number");
                var eCommercePercent = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "eCommerceRevenuePercentage", "Number");
                var ltlPercent = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "ltlPercent", "Number");
                var tlPercent = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "tlPercent", "Number");
                var fleetPercent = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "fleetPercent", "Number");

                if (loopType == "parcelRater") {

                    var eCommerceRevenue = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "eCommerceRevenue", "Number");

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
                    },
                    averageWeight: averageWeight,
                    averagePCuFt: averagePCuFt,
                    averageRetailPrice: averageRetailPrice,
                    mainJson: {
                        parcelRaterMainJson: parcelRaterMainJson,
                        ltlRaterMainJson: ltlRaterMainJson,
                        tlRaterMainJson: tlRaterMainJson,
                        fleetRaterMainJson: fleetRaterMainJson,
                    },
                };
            }

            if (loopType == "portRater") {

                var selectedPorts = treeLogicsController.getUserTransactionInputValueReference(userTransInputsData, "variableName", "selectedPorts", "Array");
                var selectedComparisonType = treeLogicsController.getUserTransactionInputValueReference(userTransInputsData, "variableName", "selectedComparisonType", "Array");
                var selectedDate = treeLogicsController.getUserTransactionInputValue(userTransInputsData, "variableName", "selectedDate", "String");

                // Get file id
                var portFileId = treeLogicsController.getUserTransactionInputFileId(userTransInputsData, "variableName", "selectedPorts");
                var comparisonTypeFileId = treeLogicsController.getUserTransactionInputFileId(userTransInputsData, "variableName", "selectedComparisonType");

                var portRegionsList = await treeLogicsController.getExcelFileDataListById(portFileId);
                var portComparisonTypesList = await treeLogicsController.getExcelFileDataListById(comparisonTypeFileId);
                let portDataList = await treeLogicsController.getExcelFileDataList("Port Data");

                // Get port names
                var portRegionsArr = treeLogicsController.filterDataListByItemIds(portRegionsList, selectedPorts);
                var selectedPortsNameArr = portRegionsArr.map(a => a.PortName);

                // Get selected comparison type
                var comparisonTypeArr = treeLogicsController.filterDataListByItemIds(portComparisonTypesList, selectedComparisonType);
                var comparisonType = comparisonTypeArr.length > 0 ? comparisonTypeArr[0]["Name"] : "";

                var portRaterMainJson = [];

                portRaterMainJson = await treeLogicsController.getPortRaterMainDataJson(
                    selectedPortsNameArr,
                    comparisonType,
                    selectedDate,
                    portDataList,
                );

                // Prepare input data object
                inputValue = {
                    inputData: {
                        comparisonType: comparisonType,
                        selectedDate: selectedDate,
                    },
                    mainJson: {
                        portRaterMainJson: portRaterMainJson,
                    },
                };
            }

            // Update calculated data into the database
            var findPattern = {
                userTransactionId: transactionId,
                variableName: "reportSummary",
                isActive: true
            };

            var updatePattern = {
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

        var inputExcelSheets = await treeLogicsController.getExcelSheetsReportTemplateWise(reportTemplate, inputMainJson);
        return treeLogicsController.generateReportExcelFile(transactionId, userInfo, inputExcelSheets);
    }

    static async generateReportHtml(transactionId = "", inputMainJson = null, reportTemplate = "", userInfo = null) {

        var inputExcelSheets = await treeLogicsController.getExcelSheetsReportTemplateWiseForHtml(reportTemplate, inputMainJson);
        return treeLogicsController.generateReportHtmlContent(transactionId, userInfo, inputExcelSheets);
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

            var sheetFlagArr = ["UPSGround", "SurePost", "3-Day", "2-Day", "1-Day"];

            var parcelRatesArr = [];
            for (let item of sheetFlagArr) {
                parcelRatesArr.push({
                    sheetFlag: item,
                    parcelRatesList: treeLogicsController.filterItemsInDataList(parcelRatesList, "SheetName", item)
                });
            }

            var finalOutput = [];

            var eCommerceUnits = Math.ceil(eCommerceRevenue / averageRetailPrice);
            var numberOfPackages = Math.ceil(eCommerceUnits);

            for (let i = 0; i < siteArr.length; i++) {

                for (let j = 0; j < stateArr.length; j++) {

                    var populationMultiplier = stateArr[j]["Population"] / sumPopulation;
                    var packageSpreed = Math.round(numberOfPackages * populationMultiplier);

                    let zoneKey = stateArr[j]["StateCode"] + "Zone";
                    let zoneNumber = siteArr[i][zoneKey];

                    if (zoneNumber) {

                        let zoneType = "Zone" + zoneNumber;
                        let serviceLevelType = "SL" + zoneNumber;

                        for (let k = 0; k < parcelRatesArr.length; k++) {

                            let parcelRatesObj = parcelRatesArr[k].parcelRatesList.find(obj => {
                                return obj.Weight == averageWeight;
                            });
                            let parcelRate = parcelRatesObj ? parcelRatesObj[zoneType] : 0;
                            let serviceLevel = parcelRate ? parcelRatesObj[serviceLevelType] : 0;

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

    static async getExcelJsonForParcelRaterSiteWise(parcelRaterMainJson, styleOpts = {}) {

        let siteWiseData = treeLogicsController.groupByDataList(parcelRaterMainJson, "siteName");

        // Start to set Excel JSON
        let columnCount = 14;
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
        let currencyColArr = [2, 5, 6];
        let boldRowArr = [4];
        let colorRowArr = [2];
        let jsonArr = [];

        let totalCostSum = 0;
        let Sl1Sum = 0;
        let Sl2Sum = 0;
        let Sl3Sum = 0;
        let Sl4Sum = 0;
        let Sl5Sum = 0;
        let Sl6Sum = 0;
        let Sl7Sum = 0;

        jsonArr.push([]);
        jsonArr.push(['Parcel Rater Report', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        jsonArr.push([]);
        jsonArr.push(['Site', 'State', 'Cost / Package', 'No. of Packages', 'Packages Spread', 'Total Packages Cost', 'Total Site Cost', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day']);

        for (let i = 0; i < siteWiseData.length; i++) {

            // Set merge array rows and columns
            var stateRows = siteWiseData[i].list.length;
            var startRowIndex = i * stateRows + 5;

            mergeArr.push({
                s: {
                    r: startRowIndex,
                    c: 0
                },
                e: {
                    r: (startRowIndex + stateRows - 1),
                    c: 0
                }
            });
            mergeArr.push({
                s: {
                    r: startRowIndex,
                    c: 3
                },
                e: {
                    r: (startRowIndex + stateRows - 1),
                    c: 3
                }
            });
            mergeArr.push({
                s: {
                    r: startRowIndex,
                    c: 6
                },
                e: {
                    r: (startRowIndex + stateRows - 1),
                    c: 6
                }
            });

            var siteTotalCost = siteWiseData[i]["list"].reduce((total, obj) => obj.totalCost + total, 0);

            for (let j = 0; j < siteWiseData[i].list.length; j++) {

                jsonArr.push([
                    j == 0 ? siteWiseData[i].list[j]["siteName"] : "",
                    siteWiseData[i].list[j]["stateCode"],
                    siteWiseData[i].list[j]["parcelRate"],
                    j == 0 ? siteWiseData[i].list[j]["numberOfPackages"] : "",
                    siteWiseData[i].list[j]["packageSpreed"],
                    siteWiseData[i].list[j]["totalCost"],
                    j == 0 ? siteTotalCost : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 1 ? siteWiseData[i].list[j]["packageSpreed"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 2 ? siteWiseData[i].list[j]["packageSpreed"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 3 ? siteWiseData[i].list[j]["packageSpreed"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 4 ? siteWiseData[i].list[j]["packageSpreed"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 5 ? siteWiseData[i].list[j]["packageSpreed"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 6 ? siteWiseData[i].list[j]["packageSpreed"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] > 6 ? siteWiseData[i].list[j]["packageSpreed"] : "",
                ]);

                totalCostSum += siteWiseData[i].list[j]["totalCost"];
                Sl1Sum += siteWiseData[i].list[j]["serviceLevel"] == 1 ? siteWiseData[i].list[j]["packageSpreed"] : 0;
                Sl2Sum += siteWiseData[i].list[j]["serviceLevel"] == 2 ? siteWiseData[i].list[j]["packageSpreed"] : 0;
                Sl3Sum += siteWiseData[i].list[j]["serviceLevel"] == 3 ? siteWiseData[i].list[j]["packageSpreed"] : 0;
                Sl4Sum += siteWiseData[i].list[j]["serviceLevel"] == 4 ? siteWiseData[i].list[j]["packageSpreed"] : 0;
                Sl5Sum += siteWiseData[i].list[j]["serviceLevel"] == 5 ? siteWiseData[i].list[j]["packageSpreed"] : 0;
                Sl6Sum += siteWiseData[i].list[j]["serviceLevel"] == 6 ? siteWiseData[i].list[j]["packageSpreed"] : 0;
                Sl7Sum += siteWiseData[i].list[j]["serviceLevel"] > 6 ? siteWiseData[i].list[j]["packageSpreed"] : 0;
            }
        }

        boldRowArr.push(jsonArr.length + 1);

        var totalSlSum = Sl1Sum + Sl2Sum + Sl3Sum + Sl4Sum + Sl5Sum + Sl6Sum + Sl7Sum;

        jsonArr.push([
            "Total Cost",
            "",
            "",
            "",
            "",
            totalCostSum ? totalCostSum : "",
            "",
            Sl1Sum ? Sl1Sum : "",
            Sl2Sum ? Sl2Sum : "",
            Sl3Sum ? Sl3Sum : "",
            Sl4Sum ? Sl4Sum : "",
            Sl5Sum ? Sl5Sum : "",
            Sl6Sum ? Sl6Sum : "",
            Sl7Sum ? Sl7Sum : "",
            totalSlSum ? totalSlSum : ""
        ]);

        jsonArr.push([
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            treeLogicsController.getPercentageWithoutZero(Sl1Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl2Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl3Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl4Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl5Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl6Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl7Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(totalSlSum, totalSlSum),
        ]);

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

    static async getExcelJsonForParcelRaterServiceLevelWise(parcelRaterMainJson, styleOpts = {}) {

        let stateWiseData = treeLogicsController.groupByDataList(parcelRaterMainJson, "stateCode");

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

        jsonArr.push(['Scenario', '', 'Cost ($M)', '', '', '', '', '', '', '', 'Deliveries', '', '', '', '', '', '', '']);
        jsonArr.push(['Mode', 'Site', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total']);

        groupedMinCostSitesArr.forEach((siteItem) => {

            var groupedSlItemsArr = treeLogicsController.groupByServiceLevel(siteItem["list"]);

            let Sl1Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 1);
            let Sl2Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 2);
            let Sl3Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 3);
            let Sl4Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 4);
            let Sl5Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 5);
            let Sl6Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 6);
            let Sl7Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 7);

            let Sl1Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 1, "parcel");
            let Sl2Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 2, "parcel");
            let Sl3Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 3, "parcel");
            let Sl4Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 4, "parcel");
            let Sl5Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 5, "parcel");
            let Sl6Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 6, "parcel");
            let Sl7Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 7, "parcel");

            jsonArr.push([
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
            jsonArr.push(["Parcel", siteName, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
        });

        var totalSlSum = Sl1Sum + Sl2Sum + Sl3Sum + Sl4Sum + Sl5Sum + Sl6Sum + Sl7Sum;
        var totalSlPkgSum = Sl1PkgSum + Sl2PkgSum + Sl3PkgSum + Sl4PkgSum + Sl5PkgSum + Sl6PkgSum + Sl7PkgSum;

        jsonArr.push([
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
            mergeArr: styleOpts.mergeArr || mergeArr,
            columnCount: styleOpts.columnCount || columnCount,
            rowsCount: styleOpts.rowsCount || rowsCount,
            currencyColArr: styleOpts.currencyColArr || currencyColArr,
            boldRowArr: styleOpts.boldRowArr || boldRowArr,
            colorRowArr: styleOpts.colorRowArr || colorRowArr,
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

    static async getExcelJsonForLtlRaterSiteWise(ltlRaterMainJson, styleOpts = {}) {

        let siteWiseData = treeLogicsController.groupByDataList(ltlRaterMainJson, "siteName");

        // Start to set Excel JSON
        let columnCount = 14;
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
        let currencyColArr = [2, 5, 6];
        let boldRowArr = [4];
        let colorRowArr = [2];
        let jsonArr = [];

        let totalCostSum = 0;
        let Sl1Sum = 0;
        let Sl2Sum = 0;
        let Sl3Sum = 0;
        let Sl4Sum = 0;
        let Sl5Sum = 0;
        let Sl6Sum = 0;
        let Sl7Sum = 0;

        jsonArr.push([]);
        jsonArr.push(['LTL Rater Report', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        jsonArr.push([]);
        jsonArr.push(['Site', 'State', 'Cost / Load', 'No. of Loads', 'Loads Spread', 'Total Loads Cost', 'Total Site Cost', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day']);

        for (let i = 0; i < siteWiseData.length; i++) {

            // Set merge array rows and columns
            var stateRows = siteWiseData[i].list.length;
            var startRowIndex = i * stateRows + 5;

            mergeArr.push({
                s: {
                    r: startRowIndex,
                    c: 0
                },
                e: {
                    r: (startRowIndex + stateRows - 1),
                    c: 0
                }
            });
            mergeArr.push({
                s: {
                    r: startRowIndex,
                    c: 3
                },
                e: {
                    r: (startRowIndex + stateRows - 1),
                    c: 3
                }
            });
            mergeArr.push({
                s: {
                    r: startRowIndex,
                    c: 6
                },
                e: {
                    r: (startRowIndex + stateRows - 1),
                    c: 6
                }
            });

            var siteTotalCost = siteWiseData[i]["list"].reduce((total, obj) => obj.totalCost + total, 0);

            for (let j = 0; j < siteWiseData[i].list.length; j++) {

                jsonArr.push([
                    j == 0 ? siteWiseData[i].list[j]["siteName"] : "",
                    siteWiseData[i].list[j]["stateCode"],
                    siteWiseData[i].list[j]["ltlRate"],
                    j == 0 ? siteWiseData[i].list[j]["numberOfLoads"] : "",
                    siteWiseData[i].list[j]["ltlLoads"],
                    siteWiseData[i].list[j]["totalCost"],
                    j == 0 ? siteTotalCost : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 1 ? siteWiseData[i].list[j]["ltlLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 2 ? siteWiseData[i].list[j]["ltlLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 3 ? siteWiseData[i].list[j]["ltlLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 4 ? siteWiseData[i].list[j]["ltlLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 5 ? siteWiseData[i].list[j]["ltlLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 6 ? siteWiseData[i].list[j]["ltlLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] > 6 ? siteWiseData[i].list[j]["ltlLoads"] : "",
                ]);

                totalCostSum += siteWiseData[i].list[j]["totalCost"];
                Sl1Sum += siteWiseData[i].list[j]["serviceLevel"] == 1 ? siteWiseData[i].list[j]["ltlLoads"] : 0;
                Sl2Sum += siteWiseData[i].list[j]["serviceLevel"] == 2 ? siteWiseData[i].list[j]["ltlLoads"] : 0;
                Sl3Sum += siteWiseData[i].list[j]["serviceLevel"] == 3 ? siteWiseData[i].list[j]["ltlLoads"] : 0;
                Sl4Sum += siteWiseData[i].list[j]["serviceLevel"] == 4 ? siteWiseData[i].list[j]["ltlLoads"] : 0;
                Sl5Sum += siteWiseData[i].list[j]["serviceLevel"] == 5 ? siteWiseData[i].list[j]["ltlLoads"] : 0;
                Sl6Sum += siteWiseData[i].list[j]["serviceLevel"] == 6 ? siteWiseData[i].list[j]["ltlLoads"] : 0;
                Sl7Sum += siteWiseData[i].list[j]["serviceLevel"] > 6 ? siteWiseData[i].list[j]["ltlLoads"] : 0;
            }
        }

        boldRowArr.push(jsonArr.length + 1);

        var totalSlSum = Sl1Sum + Sl2Sum + Sl3Sum + Sl4Sum + Sl5Sum + Sl6Sum + Sl7Sum;

        jsonArr.push([
            "Total Cost",
            "",
            "",
            "",
            "",
            totalCostSum ? totalCostSum : "",
            "",
            Sl1Sum ? Sl1Sum : "",
            Sl2Sum ? Sl2Sum : "",
            Sl3Sum ? Sl3Sum : "",
            Sl4Sum ? Sl4Sum : "",
            Sl5Sum ? Sl5Sum : "",
            Sl6Sum ? Sl6Sum : "",
            Sl7Sum ? Sl7Sum : "",
            totalSlSum ? totalSlSum : ""
        ]);

        jsonArr.push([
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            treeLogicsController.getPercentageWithoutZero(Sl1Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl2Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl3Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl4Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl5Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl6Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl7Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(totalSlSum, totalSlSum),
        ]);

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

    static async getExcelJsonForLtlRaterServiceLevelWise(ltlRaterMainJson, styleOpts = {}) {

        let stateWiseData = treeLogicsController.groupByDataList(ltlRaterMainJson, "stateCode");

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

        jsonArr.push(['Scenario', '', 'Cost ($M)', '', '', '', '', '', '', '', 'Deliveries', '', '', '', '', '', '', '']);
        jsonArr.push(['Mode', 'Site', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total']);

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
            jsonArr.push(["LTL", siteName, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
        });

        var totalSlSum = Sl1Sum + Sl2Sum + Sl3Sum + Sl4Sum + Sl5Sum + Sl6Sum + Sl7Sum;
        var totalSlPkgSum = Sl1PkgSum + Sl2PkgSum + Sl3PkgSum + Sl4PkgSum + Sl5PkgSum + Sl6PkgSum + Sl7PkgSum;

        jsonArr.push([
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

    static async getExcelJsonForTlRaterSiteWise(tlRaterMainJson, styleOpts = {}) {

        let siteWiseData = treeLogicsController.groupByDataList(tlRaterMainJson, "siteName");

        // Start to set Excel JSON
        let columnCount = 14;
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
        let currencyColArr = [2, 5, 6];
        let boldRowArr = [4];
        let colorRowArr = [2];
        let jsonArr = [];

        let totalCostSum = 0;
        let Sl1Sum = 0;
        let Sl2Sum = 0;
        let Sl3Sum = 0;
        let Sl4Sum = 0;
        let Sl5Sum = 0;
        let Sl6Sum = 0;
        let Sl7Sum = 0;

        jsonArr.push([]);
        jsonArr.push(['TL Rater Report', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        jsonArr.push([]);
        jsonArr.push(['Site', 'State', 'Cost / Load', 'No. of Loads', 'Loads Spread', 'Total Loads Cost', 'Total Site Cost', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day']);

        for (let i = 0; i < siteWiseData.length; i++) {

            // Set merge array rows and columns
            var stateRows = siteWiseData[i].list.length;
            var startRowIndex = i * stateRows + 5;

            mergeArr.push({
                s: {
                    r: startRowIndex,
                    c: 0
                },
                e: {
                    r: (startRowIndex + stateRows - 1),
                    c: 0
                }
            });
            mergeArr.push({
                s: {
                    r: startRowIndex,
                    c: 3
                },
                e: {
                    r: (startRowIndex + stateRows - 1),
                    c: 3
                }
            });
            mergeArr.push({
                s: {
                    r: startRowIndex,
                    c: 6
                },
                e: {
                    r: (startRowIndex + stateRows - 1),
                    c: 6
                }
            });

            var siteTotalCost = siteWiseData[i]["list"].reduce((total, obj) => obj.totalCost + total, 0);

            for (let j = 0; j < siteWiseData[i].list.length; j++) {

                jsonArr.push([
                    j == 0 ? siteWiseData[i].list[j]["siteName"] : "",
                    siteWiseData[i].list[j]["stateCode"],
                    siteWiseData[i].list[j]["tlCost"],
                    j == 0 ? siteWiseData[i].list[j]["numberOfLoads"] : "",
                    siteWiseData[i].list[j]["tlLoads"],
                    siteWiseData[i].list[j]["totalCost"],
                    j == 0 ? siteTotalCost : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 1 ? siteWiseData[i].list[j]["tlLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 2 ? siteWiseData[i].list[j]["tlLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 3 ? siteWiseData[i].list[j]["tlLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 4 ? siteWiseData[i].list[j]["tlLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 5 ? siteWiseData[i].list[j]["tlLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 6 ? siteWiseData[i].list[j]["tlLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] > 6 ? siteWiseData[i].list[j]["tlLoads"] : "",
                ]);

                totalCostSum += siteWiseData[i].list[j]["totalCost"];
                Sl1Sum += siteWiseData[i].list[j]["serviceLevel"] == 1 ? siteWiseData[i].list[j]["tlLoads"] : 0;
                Sl2Sum += siteWiseData[i].list[j]["serviceLevel"] == 2 ? siteWiseData[i].list[j]["tlLoads"] : 0;
                Sl3Sum += siteWiseData[i].list[j]["serviceLevel"] == 3 ? siteWiseData[i].list[j]["tlLoads"] : 0;
                Sl4Sum += siteWiseData[i].list[j]["serviceLevel"] == 4 ? siteWiseData[i].list[j]["tlLoads"] : 0;
                Sl5Sum += siteWiseData[i].list[j]["serviceLevel"] == 5 ? siteWiseData[i].list[j]["tlLoads"] : 0;
                Sl6Sum += siteWiseData[i].list[j]["serviceLevel"] == 6 ? siteWiseData[i].list[j]["tlLoads"] : 0;
                Sl7Sum += siteWiseData[i].list[j]["serviceLevel"] > 6 ? siteWiseData[i].list[j]["tlLoads"] : 0;
            }
        }

        boldRowArr.push(jsonArr.length + 1);

        var totalSlSum = Sl1Sum + Sl2Sum + Sl3Sum + Sl4Sum + Sl5Sum + Sl6Sum + Sl7Sum;

        jsonArr.push([
            "Total Cost",
            "",
            "",
            "",
            "",
            totalCostSum ? totalCostSum : "",
            "",
            Sl1Sum ? Sl1Sum : "",
            Sl2Sum ? Sl2Sum : "",
            Sl3Sum ? Sl3Sum : "",
            Sl4Sum ? Sl4Sum : "",
            Sl5Sum ? Sl5Sum : "",
            Sl6Sum ? Sl6Sum : "",
            Sl7Sum ? Sl7Sum : "",
            totalSlSum ? totalSlSum : ""
        ]);

        jsonArr.push([
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            treeLogicsController.getPercentageWithoutZero(Sl1Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl2Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl3Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl4Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl5Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl6Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl7Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(totalSlSum, totalSlSum),
        ]);

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

    static async getExcelJsonForTlRaterServiceLevelWise(tlRaterMainJson, styleOpts = {}) {

        let stateWiseData = treeLogicsController.groupByDataList(tlRaterMainJson, "stateCode");

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

        jsonArr.push(['Scenario', '', 'Cost ($M)', '', '', '', '', '', '', '', 'Deliveries', '', '', '', '', '', '', '']);
        jsonArr.push(['Mode', 'Site', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total']);

        groupedMinCostSitesArr.forEach((siteItem) => {

            var groupedSlItemsArr = treeLogicsController.groupByServiceLevel(siteItem["list"]);

            let Sl1Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 1);
            let Sl2Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 2);
            let Sl3Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 3);
            let Sl4Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 4);
            let Sl5Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 5);
            let Sl6Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 6);
            let Sl7Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 7);

            let Sl1Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 1, "tl");
            let Sl2Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 2, "tl");
            let Sl3Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 3, "tl");
            let Sl4Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 4, "tl");
            let Sl5Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 5, "tl");
            let Sl6Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 6, "tl");
            let Sl7Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 7, "tl");

            jsonArr.push([
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
            jsonArr.push(["TL", siteName, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
        });

        var totalSlSum = Sl1Sum + Sl2Sum + Sl3Sum + Sl4Sum + Sl5Sum + Sl6Sum + Sl7Sum;
        var totalSlPkgSum = Sl1PkgSum + Sl2PkgSum + Sl3PkgSum + Sl4PkgSum + Sl5PkgSum + Sl6PkgSum + Sl7PkgSum;

        jsonArr.push([
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

    static async getExcelJsonForFleetRaterSiteWise(fleetRaterMainJson, styleOpts = {}) {

        let siteWiseData = treeLogicsController.groupByDataList(fleetRaterMainJson, "siteName");

        // Start to set Excel JSON
        let columnCount = 14;
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
        let currencyColArr = [2, 5, 6];
        let boldRowArr = [4];
        let colorRowArr = [2];
        let jsonArr = [];

        let totalCostSum = 0;
        let Sl1Sum = 0;
        let Sl2Sum = 0;
        let Sl3Sum = 0;
        let Sl4Sum = 0;
        let Sl5Sum = 0;
        let Sl6Sum = 0;
        let Sl7Sum = 0;

        jsonArr.push([]);
        jsonArr.push(['Fleet Rater Report', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        jsonArr.push([]);
        jsonArr.push(['Site', 'State', 'Cost / Load', 'No. of Loads', 'Loads Spread', 'Total Loads Cost', 'Total Site Cost', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day']);

        for (let i = 0; i < siteWiseData.length; i++) {

            // Set merge array rows and columns
            var stateRows = siteWiseData[i].list.length;
            var startRowIndex = i * stateRows + 5;

            mergeArr.push({
                s: {
                    r: startRowIndex,
                    c: 0
                },
                e: {
                    r: (startRowIndex + stateRows - 1),
                    c: 0
                }
            });
            mergeArr.push({
                s: {
                    r: startRowIndex,
                    c: 3
                },
                e: {
                    r: (startRowIndex + stateRows - 1),
                    c: 3
                }
            });
            mergeArr.push({
                s: {
                    r: startRowIndex,
                    c: 6
                },
                e: {
                    r: (startRowIndex + stateRows - 1),
                    c: 6
                }
            });

            var siteTotalCost = siteWiseData[i]["list"].reduce((total, obj) => obj.totalCost + total, 0);

            for (let j = 0; j < siteWiseData[i].list.length; j++) {

                jsonArr.push([
                    j == 0 ? siteWiseData[i].list[j]["siteName"] : "",
                    siteWiseData[i].list[j]["stateCode"],
                    siteWiseData[i].list[j]["fleetCost"],
                    j == 0 ? siteWiseData[i].list[j]["numberOfLoads"] : "",
                    siteWiseData[i].list[j]["fleetLoads"],
                    siteWiseData[i].list[j]["totalCost"],
                    j == 0 ? siteTotalCost : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 1 ? siteWiseData[i].list[j]["fleetLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 2 ? siteWiseData[i].list[j]["fleetLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 3 ? siteWiseData[i].list[j]["fleetLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 4 ? siteWiseData[i].list[j]["fleetLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 5 ? siteWiseData[i].list[j]["fleetLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] == 6 ? siteWiseData[i].list[j]["fleetLoads"] : "",
                    siteWiseData[i].list[j]["serviceLevel"] > 6 ? siteWiseData[i].list[j]["fleetLoads"] : "",
                ]);

                totalCostSum += siteWiseData[i].list[j]["totalCost"];
                Sl1Sum += siteWiseData[i].list[j]["serviceLevel"] == 1 ? siteWiseData[i].list[j]["fleetLoads"] : 0;
                Sl2Sum += siteWiseData[i].list[j]["serviceLevel"] == 2 ? siteWiseData[i].list[j]["fleetLoads"] : 0;
                Sl3Sum += siteWiseData[i].list[j]["serviceLevel"] == 3 ? siteWiseData[i].list[j]["fleetLoads"] : 0;
                Sl4Sum += siteWiseData[i].list[j]["serviceLevel"] == 4 ? siteWiseData[i].list[j]["fleetLoads"] : 0;
                Sl5Sum += siteWiseData[i].list[j]["serviceLevel"] == 5 ? siteWiseData[i].list[j]["fleetLoads"] : 0;
                Sl6Sum += siteWiseData[i].list[j]["serviceLevel"] == 6 ? siteWiseData[i].list[j]["fleetLoads"] : 0;
                Sl7Sum += siteWiseData[i].list[j]["serviceLevel"] > 6 ? siteWiseData[i].list[j]["fleetLoads"] : 0;
            }
        }

        boldRowArr.push(jsonArr.length + 1);

        var totalSlSum = Sl1Sum + Sl2Sum + Sl3Sum + Sl4Sum + Sl5Sum + Sl6Sum + Sl7Sum;

        jsonArr.push([
            "Total Cost",
            "",
            "",
            "",
            "",
            totalCostSum ? totalCostSum : "",
            "",
            Sl1Sum ? Sl1Sum : "",
            Sl2Sum ? Sl2Sum : "",
            Sl3Sum ? Sl3Sum : "",
            Sl4Sum ? Sl4Sum : "",
            Sl5Sum ? Sl5Sum : "",
            Sl6Sum ? Sl6Sum : "",
            Sl7Sum ? Sl7Sum : "",
            totalSlSum ? totalSlSum : ""
        ]);

        jsonArr.push([
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            treeLogicsController.getPercentageWithoutZero(Sl1Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl2Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl3Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl4Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl5Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl6Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(Sl7Sum, totalSlSum),
            treeLogicsController.getPercentageWithoutZero(totalSlSum, totalSlSum),
        ]);

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

    static async getExcelJsonForFleetRaterServiceLevelWise(fleetRaterMainJson, styleOpts = {}) {

        let stateWiseData = treeLogicsController.groupByDataList(fleetRaterMainJson, "stateCode");

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

        jsonArr.push(['Scenario', '', 'Cost ($M)', '', '', '', '', '', '', '', 'Deliveries', '', '', '', '', '', '', '']);
        jsonArr.push(['Mode', 'Site', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total']);

        groupedMinCostSitesArr.forEach((siteItem) => {

            var groupedSlItemsArr = treeLogicsController.groupByServiceLevel(siteItem["list"]);

            let Sl1Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 1);
            let Sl2Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 2);
            let Sl3Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 3);
            let Sl4Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 4);
            let Sl5Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 5);
            let Sl6Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 6);
            let Sl7Cost = treeLogicsController.getTotalCostServiceLevelWise(groupedSlItemsArr, 7);

            let Sl1Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 1, "fleet");
            let Sl2Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 2, "fleet");
            let Sl3Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 3, "fleet");
            let Sl4Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 4, "fleet");
            let Sl5Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 5, "fleet");
            let Sl6Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 6, "fleet");
            let Sl7Pkg = treeLogicsController.getTotalPkgServiceLevelWise(groupedSlItemsArr, 7, "fleet");

            jsonArr.push([
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
            jsonArr.push(["Fleet", siteName, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
        });

        var totalSlSum = Sl1Sum + Sl2Sum + Sl3Sum + Sl4Sum + Sl5Sum + Sl6Sum + Sl7Sum;
        var totalSlPkgSum = Sl1PkgSum + Sl2PkgSum + Sl3PkgSum + Sl4PkgSum + Sl5PkgSum + Sl6PkgSum + Sl7PkgSum;

        jsonArr.push([
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
            mergeArr: styleOpts.mergeArr || mergeArr,
            columnCount: styleOpts.columnCount || columnCount,
            rowsCount: styleOpts.rowsCount || rowsCount,
            currencyColArr: styleOpts.currencyColArr || currencyColArr,
            boldRowArr: styleOpts.boldRowArr || boldRowArr,
            colorRowArr: styleOpts.colorRowArr || colorRowArr,
        };
    }

    //================================ Multi Site Summary ======================================

    static async getMultiSiteSummaryExcelJson(parcelRaterMainJson, ltlRaterMainJson, tlRaterMainJson, fleetRaterMainJson, styleOpts = {}) {

        var parcelRaterMultiSiteExcelJson = null;
        var ltlRaterMultiSiteExcelJson = null;
        var tlRaterMultiSiteExcelJson = null;
        var fleetRaterMultiSiteExcelJson = null;

        let columnCount = 17;
        let rowsCount = 0;
        let mergeArr = [];
        let currencyColArr = [2, 3, 4, 5, 6, 7, 8, 9];
        let boldRowArr = [];
        let colorRowArr = [2];
        let jsonArr = [];

        if (parcelRaterMainJson.length > 0) {

            parcelRaterMultiSiteExcelJson = await treeLogicsController.getExcelJsonForParcelRaterServiceLevelWise(parcelRaterMainJson);

            let dataRowsStartIndex = jsonArr.length + 6;

            boldRowArr.push(jsonArr.length + 4);
            boldRowArr.push(jsonArr.length + 5);

            colorRowArr.push(jsonArr.length + 2);

            mergeArr.push({
                s: {
                    r: jsonArr.length + 2,
                    c: 0
                },
                e: {
                    r: jsonArr.length + 2,
                    c: 16
                }
            });
            mergeArr.push({
                s: {
                    r: jsonArr.length + 4,
                    c: 0
                },
                e: {
                    r: jsonArr.length + 4,
                    c: 1
                }
            });
            mergeArr.push({
                s: {
                    r: jsonArr.length + 4,
                    c: 2
                },
                e: {
                    r: jsonArr.length + 4,
                    c: 9
                }
            });
            mergeArr.push({
                s: {
                    r: jsonArr.length + 4,
                    c: 10
                },
                e: {
                    r: jsonArr.length + 4,
                    c: 17
                }
            });

            jsonArr = jsonArr
                .concat([
                    []
                ])
                .concat([
                    ['Parcel Rater Summary', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
                ])
                .concat([
                    []
                ])
                .concat(parcelRaterMultiSiteExcelJson.jsonArr);

            boldRowArr.push(jsonArr.length - 1);
            mergeArr.push({
                s: {
                    r: dataRowsStartIndex,
                    c: 0
                },
                e: {
                    r: jsonArr.length,
                    c: 0
                }
            });
            rowsCount = rowsCount + jsonArr.length;
        }

        if (ltlRaterMainJson.length > 0) {

            ltlRaterMultiSiteExcelJson = await treeLogicsController.getExcelJsonForLtlRaterServiceLevelWise(ltlRaterMainJson);

            let dataRowsStartIndex = jsonArr.length + 6;

            boldRowArr.push(jsonArr.length + 4);
            boldRowArr.push(jsonArr.length + 5);

            colorRowArr.push(jsonArr.length + 2);

            mergeArr.push({
                s: {
                    r: jsonArr.length + 2,
                    c: 0
                },
                e: {
                    r: jsonArr.length + 2,
                    c: 16
                }
            });
            mergeArr.push({
                s: {
                    r: jsonArr.length + 4,
                    c: 0
                },
                e: {
                    r: jsonArr.length + 4,
                    c: 1
                }
            });
            mergeArr.push({
                s: {
                    r: jsonArr.length + 4,
                    c: 2
                },
                e: {
                    r: jsonArr.length + 4,
                    c: 9
                }
            });
            mergeArr.push({
                s: {
                    r: jsonArr.length + 4,
                    c: 10
                },
                e: {
                    r: jsonArr.length + 4,
                    c: 17
                }
            });

            jsonArr = jsonArr
                .concat([
                    []
                ])
                .concat([
                    ['LTL Rater Summary', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
                ])
                .concat([
                    []
                ])
                .concat(ltlRaterMultiSiteExcelJson.jsonArr);

            boldRowArr.push(jsonArr.length - 1);
            mergeArr.push({
                s: {
                    r: dataRowsStartIndex,
                    c: 0
                },
                e: {
                    r: jsonArr.length,
                    c: 0
                }
            });
            rowsCount = rowsCount + jsonArr.length;
        }

        if (tlRaterMainJson.length > 0) {

            tlRaterMultiSiteExcelJson = await treeLogicsController.getExcelJsonForTlRaterServiceLevelWise(tlRaterMainJson);

            let dataRowsStartIndex = jsonArr.length + 6;

            boldRowArr.push(jsonArr.length + 4);
            boldRowArr.push(jsonArr.length + 5);

            colorRowArr.push(jsonArr.length + 2);

            mergeArr.push({
                s: {
                    r: jsonArr.length + 2,
                    c: 0
                },
                e: {
                    r: jsonArr.length + 2,
                    c: 16
                }
            });
            mergeArr.push({
                s: {
                    r: jsonArr.length + 4,
                    c: 0
                },
                e: {
                    r: jsonArr.length + 4,
                    c: 1
                }
            });
            mergeArr.push({
                s: {
                    r: jsonArr.length + 4,
                    c: 2
                },
                e: {
                    r: jsonArr.length + 4,
                    c: 9
                }
            });
            mergeArr.push({
                s: {
                    r: jsonArr.length + 4,
                    c: 10
                },
                e: {
                    r: jsonArr.length + 4,
                    c: 17
                }
            });

            jsonArr = jsonArr
                .concat([
                    []
                ])
                .concat([
                    ['TL Rater Summary', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
                ])
                .concat([
                    []
                ])
                .concat(tlRaterMultiSiteExcelJson.jsonArr);

            boldRowArr.push(jsonArr.length - 1);
            mergeArr.push({
                s: {
                    r: dataRowsStartIndex,
                    c: 0
                },
                e: {
                    r: jsonArr.length,
                    c: 0
                }
            });
            rowsCount = rowsCount + jsonArr.length;
        }

        if (fleetRaterMainJson.length > 0) {

            fleetRaterMultiSiteExcelJson = await treeLogicsController.getExcelJsonForFleetRaterServiceLevelWise(fleetRaterMainJson);

            let dataRowsStartIndex = jsonArr.length + 6;

            boldRowArr.push(jsonArr.length + 4);
            boldRowArr.push(jsonArr.length + 5);

            colorRowArr.push(jsonArr.length + 2);

            mergeArr.push({
                s: {
                    r: jsonArr.length + 2,
                    c: 0
                },
                e: {
                    r: jsonArr.length + 2,
                    c: 16
                }
            });
            mergeArr.push({
                s: {
                    r: jsonArr.length + 4,
                    c: 0
                },
                e: {
                    r: jsonArr.length + 4,
                    c: 1
                }
            });
            mergeArr.push({
                s: {
                    r: jsonArr.length + 4,
                    c: 2
                },
                e: {
                    r: jsonArr.length + 4,
                    c: 9
                }
            });
            mergeArr.push({
                s: {
                    r: jsonArr.length + 4,
                    c: 10
                },
                e: {
                    r: jsonArr.length + 4,
                    c: 17
                }
            });

            jsonArr = jsonArr
                .concat([
                    []
                ])
                .concat([
                    ['Fleet Rater Summary', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
                ])
                .concat([
                    []
                ])
                .concat(fleetRaterMultiSiteExcelJson.jsonArr);

            boldRowArr.push(jsonArr.length - 1);
            mergeArr.push({
                s: {
                    r: dataRowsStartIndex,
                    c: 0
                },
                e: {
                    r: jsonArr.length,
                    c: 0
                }
            });
            rowsCount = rowsCount + jsonArr.length;
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

    //================================ Single Site Summary ======================================

    static async getSingleSiteSummaryExcelJson(parcelRaterMainJson, ltlRaterMainJson, tlRaterMainJson, fleetRaterMainJson, styleOpts = {}) {

        var sitesArr = [];

        if (parcelRaterMainJson.length > 0) {

            let parcelRaterSiteWise = treeLogicsController.groupByDataList(parcelRaterMainJson, "siteName");

            for (let i = 0; i < parcelRaterSiteWise.length; i++) {

                let siteTotalCost = parcelRaterSiteWise[i]["list"].reduce((total, obj) => obj.totalCost + total, 0);
                let siteTotalPackages = parcelRaterSiteWise[i]["list"].reduce((total, obj) => obj.packageSpreed + total, 0);

                sitesArr.push({
                    siteName: parcelRaterSiteWise[i]["siteName"],
                    raterType: "parcel",
                    list: parcelRaterSiteWise[i]["list"],
                    numberOfPackages: siteTotalPackages,
                    siteTotalCost: siteTotalCost,
                });
            }
        }

        if (ltlRaterMainJson.length > 0) {

            let ltlRaterSiteWise = treeLogicsController.groupByDataList(ltlRaterMainJson, "siteName");

            for (let i = 0; i < ltlRaterSiteWise.length; i++) {

                let siteTotalCost = ltlRaterSiteWise[i]["list"].reduce((total, obj) => obj.totalCost + total, 0);
                let siteTotalPackages = ltlRaterSiteWise[i]["list"].reduce((total, obj) => obj.ltlLoads + total, 0);

                sitesArr.push({
                    siteName: ltlRaterSiteWise[i]["siteName"],
                    raterType: "ltl",
                    list: ltlRaterSiteWise[i]["list"],
                    numberOfPackages: siteTotalPackages,
                    siteTotalCost: siteTotalCost,
                });
            }
        }

        if (tlRaterMainJson.length > 0) {

            let tlRaterSiteWise = treeLogicsController.groupByDataList(tlRaterMainJson, "siteName");

            for (let i = 0; i < tlRaterSiteWise.length; i++) {

                let siteTotalCost = tlRaterSiteWise[i]["list"].reduce((total, obj) => obj.totalCost + total, 0);
                let siteTotalPackages = tlRaterSiteWise[i]["list"].reduce((total, obj) => obj.tlLoads + total, 0);

                sitesArr.push({
                    siteName: tlRaterSiteWise[i]["siteName"],
                    raterType: "tl",
                    list: tlRaterSiteWise[i]["list"],
                    numberOfPackages: siteTotalPackages,
                    siteTotalCost: siteTotalCost,
                });
            }
        }

        if (fleetRaterMainJson.length > 0) {

            let fleetRaterSiteWise = treeLogicsController.groupByDataList(fleetRaterMainJson, "siteName");

            for (let i = 0; i < fleetRaterSiteWise.length; i++) {

                let siteTotalCost = fleetRaterSiteWise[i]["list"].reduce((total, obj) => obj.totalCost + total, 0);
                let siteTotalPackages = fleetRaterSiteWise[i]["list"].reduce((total, obj) => obj.fleetLoads + total, 0);

                sitesArr.push({
                    siteName: fleetRaterSiteWise[i]["siteName"],
                    raterType: "fleet",
                    list: fleetRaterSiteWise[i]["list"],
                    numberOfPackages: siteTotalPackages,
                    siteTotalCost: siteTotalCost,
                });
            }
        }

        // Grouped sites
        let groupedSites = treeLogicsController.groupByDataList(sitesArr, "siteName");
        groupedSites.map((siteItem) => {
            siteItem.sumTotalCost = siteItem["list"].reduce((total, obj) => obj.siteTotalCost + total, 0);
            siteItem.sumTotalPackages = (siteItem["list"].reduce((acc, item) => {
                return acc + (item.numberOfPackages);
            }, 0));
        });

        // Start to set Excel JSON
        let columnCount = 18;
        let mergeArr = [];
        let rowsCount = 0;
        let currencyColArr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        let boldRowArr = [];
        let colorRowArr = [2];
        let jsonArr = [];

        let FinalSl1Sum = 0;
        let FinalSl2Sum = 0;
        let FinalSl3Sum = 0;
        let FinalSl4Sum = 0;
        let FinalSl5Sum = 0;
        let FinalSl6Sum = 0;
        let FinalSl7Sum = 0;
        let FinalSl1PkgSum = 0;
        let FinalSl2PkgSum = 0;
        let FinalSl3PkgSum = 0;
        let FinalSl4PkgSum = 0;
        let FinalSl5PkgSum = 0;
        let FinalSl6PkgSum = 0;
        let FinalSl7PkgSum = 0;

        boldRowArr.push(jsonArr.length + 4);
        boldRowArr.push(jsonArr.length + 5);

        colorRowArr.push(jsonArr.length + 2);

        mergeArr.push({
            s: {
                r: 2,
                c: 0
            },
            e: {
                r: 2,
                c: 18
            }
        });
        mergeArr.push({
            s: {
                r: 4,
                c: 0
            },
            e: {
                r: 4,
                c: 2
            }
        });
        mergeArr.push({
            s: {
                r: 4,
                c: 3
            },
            e: {
                r: 4,
                c: 10
            }
        });
        mergeArr.push({
            s: {
                r: 4,
                c: 11
            },
            e: {
                r: 4,
                c: 18
            }
        });

        jsonArr = jsonArr
            .concat([
                []
            ])
            .concat([
                ['Single Site Summary', '', '', '', '', '', '', '', '', '']
            ])
            .concat([
                []
            ]);

        jsonArr.push(['Scenario', '', '', 'Cost ($M)', '', '', '', '', '', '', '', 'Deliveries', '', '', '', '', '', '', '']);
        jsonArr.push(['Site', '$(M)', '$/Load', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day', 'Total']);

        groupedSites.forEach((siteItem) => {

            var mergeSiteListArr = [];
            siteItem["list"].forEach((raterItems) => {
                mergeSiteListArr = mergeSiteListArr.concat(raterItems["list"])
            });

            var groupedServiceLevels = treeLogicsController.groupByDataList(mergeSiteListArr, "serviceLevel");

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

            groupedServiceLevels.forEach((item) => {
                if (item.serviceLevel == 1) {
                    item["list"].forEach((valueObj) => {
                        Sl1PkgSum += valueObj.packageSpreed ? valueObj.packageSpreed : 0;
                        Sl1PkgSum += valueObj.ltlLoads ? valueObj.ltlLoads : 0;
                        Sl1PkgSum += valueObj.tlLoads ? valueObj.tlLoads : 0;
                        Sl1PkgSum += valueObj.fleetLoads ? valueObj.fleetLoads : 0;
                        Sl1Sum += valueObj.totalCost ? valueObj.totalCost : 0;
                    });

                    FinalSl1Sum += Sl1Sum;
                    FinalSl1PkgSum += Sl1PkgSum;
                }
                if (item.serviceLevel == 2) {
                    item["list"].forEach((valueObj) => {
                        Sl2PkgSum += valueObj.packageSpreed ? valueObj.packageSpreed : 0;
                        Sl2PkgSum += valueObj.ltlLoads ? valueObj.ltlLoads : 0;
                        Sl2PkgSum += valueObj.tlLoads ? valueObj.tlLoads : 0;
                        Sl2PkgSum += valueObj.fleetLoads ? valueObj.fleetLoads : 0;
                        Sl2Sum += valueObj.totalCost ? valueObj.totalCost : 0;
                    });

                    FinalSl2Sum += Sl2Sum;
                    FinalSl2PkgSum += Sl2PkgSum;
                }
                if (item.serviceLevel == 3) {
                    item["list"].forEach((valueObj) => {
                        Sl3PkgSum += valueObj.packageSpreed ? valueObj.packageSpreed : 0;
                        Sl3PkgSum += valueObj.ltlLoads ? valueObj.ltlLoads : 0;
                        Sl3PkgSum += valueObj.tlLoads ? valueObj.tlLoads : 0;
                        Sl3PkgSum += valueObj.fleetLoads ? valueObj.fleetLoads : 0;
                        Sl3Sum += valueObj.totalCost ? valueObj.totalCost : 0;
                    });

                    FinalSl3Sum += Sl3Sum;
                    FinalSl3PkgSum += Sl3PkgSum;
                }
                if (item.serviceLevel == 4) {
                    item["list"].forEach((valueObj) => {
                        Sl4PkgSum += valueObj.packageSpreed ? valueObj.packageSpreed : 0;
                        Sl4PkgSum += valueObj.ltlLoads ? valueObj.ltlLoads : 0;
                        Sl4PkgSum += valueObj.tlLoads ? valueObj.tlLoads : 0;
                        Sl4PkgSum += valueObj.fleetLoads ? valueObj.fleetLoads : 0;
                        Sl4Sum += valueObj.totalCost ? valueObj.totalCost : 0;
                    });

                    FinalSl4Sum += Sl4Sum;
                    FinalSl4PkgSum += Sl4PkgSum;
                }
                if (item.serviceLevel == 5) {
                    item["list"].forEach((valueObj) => {
                        Sl5PkgSum += valueObj.packageSpreed ? valueObj.packageSpreed : 0;
                        Sl5PkgSum += valueObj.ltlLoads ? valueObj.ltlLoads : 0;
                        Sl5PkgSum += valueObj.tlLoads ? valueObj.tlLoads : 0;
                        Sl5PkgSum += valueObj.fleetLoads ? valueObj.fleetLoads : 0;
                        Sl5Sum += valueObj.totalCost ? valueObj.totalCost : 0;
                    });

                    FinalSl5Sum += Sl5Sum;
                    FinalSl5PkgSum += Sl5PkgSum;
                }
                if (item.serviceLevel == 6) {
                    item["list"].forEach((valueObj) => {
                        Sl6PkgSum += valueObj.packageSpreed ? valueObj.packageSpreed : 0;
                        Sl6PkgSum += valueObj.ltlLoads ? valueObj.ltlLoads : 0;
                        Sl6PkgSum += valueObj.tlLoads ? valueObj.tlLoads : 0;
                        Sl6PkgSum += valueObj.fleetLoads ? valueObj.fleetLoads : 0;
                        Sl6Sum += valueObj.totalCost ? valueObj.totalCost : 0;
                    });

                    FinalSl6Sum += Sl6Sum;
                    FinalSl6PkgSum += Sl6PkgSum;
                }
                if (item.serviceLevel > 6) {
                    item["list"].forEach((valueObj) => {
                        Sl7PkgSum += valueObj.packageSpreed ? valueObj.packageSpreed : 0;
                        Sl7PkgSum += valueObj.ltlLoads ? valueObj.ltlLoads : 0;
                        Sl7PkgSum += valueObj.tlLoads ? valueObj.tlLoads : 0;
                        Sl7PkgSum += valueObj.fleetLoads ? valueObj.fleetLoads : 0;
                        Sl7Sum += valueObj.totalCost ? valueObj.totalCost : 0;
                    });

                    FinalSl7Sum += Sl7Sum;
                    FinalSl7PkgSum += Sl7PkgSum;
                }
            });

            var totalSlSum = Sl1Sum + Sl2Sum + Sl3Sum + Sl4Sum + Sl5Sum + Sl6Sum + Sl7Sum;
            var totalSlPkgSum = Sl1PkgSum + Sl2PkgSum + Sl3PkgSum + Sl4PkgSum + Sl5PkgSum + Sl6PkgSum + Sl7PkgSum;

            jsonArr.push([
                siteItem["siteName"],
                siteItem["sumTotalCost"] / 1000000,
                (siteItem["sumTotalCost"] / siteItem["sumTotalPackages"]),
                Sl1Sum ? (Sl1Sum / 1000000) : "",
                Sl2Sum ? (Sl2Sum / 1000000) : "",
                Sl3Sum ? (Sl3Sum / 1000000) : "",
                Sl4Sum ? (Sl4Sum / 1000000) : "",
                Sl5Sum ? (Sl5Sum / 1000000) : "",
                Sl6Sum ? (Sl6Sum / 1000000) : "",
                Sl7Sum ? (Sl7Sum / 1000000) : "",
                totalSlSum ? (totalSlSum / 1000000) : "",
                treeLogicsController.getPercentageWithoutZero(Sl1PkgSum, totalSlPkgSum),
                treeLogicsController.getPercentageWithoutZero(Sl2PkgSum, totalSlPkgSum),
                treeLogicsController.getPercentageWithoutZero(Sl3PkgSum, totalSlPkgSum),
                treeLogicsController.getPercentageWithoutZero(Sl4PkgSum, totalSlPkgSum),
                treeLogicsController.getPercentageWithoutZero(Sl5PkgSum, totalSlPkgSum),
                treeLogicsController.getPercentageWithoutZero(Sl6PkgSum, totalSlPkgSum),
                treeLogicsController.getPercentageWithoutZero(Sl7PkgSum, totalSlPkgSum),
                treeLogicsController.getPercentageWithoutZero(totalSlPkgSum, totalSlPkgSum),
            ]);
        });

        rowsCount = jsonArr.length;

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

    //================================ Final Summary ==============================================

    static async getFinalSummaryExcelJson(parcelRaterMainJson, ltlRaterMainJson, tlRaterMainJson, fleetRaterMainJson, styleOpts = {}) {

        let inputServiceLevel = 1;
        let raterProcessCount = 0;
        var nextMergeStartRow = 0;

        let parcelRaterSiteWise = [],
            parcelRaterStateWise = [];
        let ltlRaterSiteWise = [],
            ltlRaterStateWise = [];
        let tlRaterSiteWise = [],
            tlRaterStateWise = [];
        let fleetRaterSiteWise = [],
            fleetRaterStateWise = [];

        if (parcelRaterMainJson.length > 0) {
            parcelRaterSiteWise = treeLogicsController.groupByDataList(parcelRaterMainJson, "siteName");
            parcelRaterStateWise = treeLogicsController.groupByDataList(parcelRaterMainJson, "stateCode");
            raterProcessCount++;
        }
        if (ltlRaterMainJson.length > 0) {
            ltlRaterSiteWise = treeLogicsController.groupByDataList(ltlRaterMainJson, "siteName");
            ltlRaterStateWise = treeLogicsController.groupByDataList(ltlRaterMainJson, "stateCode");
            raterProcessCount++;
        }
        if (tlRaterMainJson.length > 0) {
            tlRaterSiteWise = treeLogicsController.groupByDataList(tlRaterMainJson, "siteName");
            tlRaterStateWise = treeLogicsController.groupByDataList(tlRaterMainJson, "stateCode");
            raterProcessCount++;
        }
        if (fleetRaterMainJson.length > 0) {
            fleetRaterSiteWise = treeLogicsController.groupByDataList(fleetRaterMainJson, "siteName");
            fleetRaterStateWise = treeLogicsController.groupByDataList(fleetRaterMainJson, "stateCode");
            raterProcessCount++;
        }

        // Start to set Excel JSON
        let columnCount = 13;
        let mergeArr = [{
                s: {
                    r: 2,
                    c: 0
                },
                e: {
                    r: 2,
                    c: columnCount
                }
            },
            {
                s: {
                    r: 4,
                    c: 0
                },
                e: {
                    r: 4,
                    c: 1
                }
            },
            {
                s: {
                    r: 4,
                    c: 2
                },
                e: {
                    r: 4,
                    c: 4
                }
            },
            {
                s: {
                    r: 4,
                    c: 5
                },
                e: {
                    r: 4,
                    c: columnCount
                }
            },
        ];
        let rowsCount = 0;
        let currencyColArr = [2, 4];
        let boldRowArr = [4, 5];
        let colorRowArr = [2];
        let jsonArr = [];

        jsonArr = jsonArr
            .concat([
                []
            ])
            .concat([
                ['Final Summary', '', '', '', '', '', '', '', '', '', '', '']
            ])
            .concat([
                []
            ]);

        //----------------------------------------- Single Sites Scenario ------------------------------------------------------

        jsonArr.push(['Scenario', '', 'Cost Analysis', '', '', 'Service Level', '', '', '', '', '', '', '', '']);
        jsonArr.push(['No. Sites', 'Site Selection', '$(M)', '% Total', '$/Load', '1 Day', '2 Day', '3 Day', '4 Day', '5 Day', '6 Day', '>6 Day']);

        if (inputServiceLevel) {
            jsonArr[(jsonArr.length - 1)].push("");
            jsonArr[(jsonArr.length - 1)].push(">" + (inputServiceLevel + 1) + " Day");
        }

        var appendedSingleJsonArr = await treeLogicsController.calculateFinalSummaryScenarioWise(parcelRaterSiteWise, ltlRaterSiteWise, tlRaterSiteWise, fleetRaterSiteWise, "single", inputServiceLevel);

        jsonArr = [...jsonArr, ...appendedSingleJsonArr];

        mergeArr.push({
            s: {
                r: 6,
                c: 0
            },
            e: {
                r: jsonArr.length,
                c: 0
            }
        }); // Merge by Rows
        nextMergeStartRow = jsonArr.length + 1;

        //----------------------------------------- Multi Sites Scenario ------------------------------------------------------

        let parcelMinSiteWise = treeLogicsController.getMinSiteWiseItems(parcelRaterStateWise);
        let ltlMinSiteWise = treeLogicsController.getMinSiteWiseItems(ltlRaterStateWise);
        let tlMinSiteWise = treeLogicsController.getMinSiteWiseItems(tlRaterStateWise);
        let fleetMinSiteWise = treeLogicsController.getMinSiteWiseItems(fleetRaterStateWise);

        var appendedMultiJsonArr = await treeLogicsController.calculateFinalSummaryScenarioWise(parcelMinSiteWise, ltlMinSiteWise, tlMinSiteWise, fleetMinSiteWise, "multi", inputServiceLevel);
        jsonArr = [...jsonArr, ...appendedMultiJsonArr];

        mergeArr.push({
            s: {
                r: nextMergeStartRow,
                c: 0
            },
            e: {
                r: jsonArr.length,
                c: 0
            }
        }); // Merge by Rows
        nextMergeStartRow = jsonArr.length + 3;

        //----------------------------------------- Delivery by Mode Scenario ------------------------------------------------------

        var appendedDeliveryJsonArr = await treeLogicsController.calculateFinalSummaryDeliveryModeWise(parcelRaterStateWise, ltlRaterStateWise, tlRaterStateWise, fleetRaterStateWise);

        jsonArr.push([]);
        jsonArr.push([]);
        jsonArr = [...jsonArr, ...appendedDeliveryJsonArr];

        boldRowArr.push(nextMergeStartRow);
        boldRowArr.push(nextMergeStartRow + 1);
        boldRowArr.push(nextMergeStartRow + appendedDeliveryJsonArr.length - 1);

        mergeArr.push({
            s: {
                r: nextMergeStartRow,
                c: 0
            },
            e: {
                r: nextMergeStartRow + 1,
                c: 0
            }
        }); // Merge by Rows
        mergeArr.push({
            s: {
                r: nextMergeStartRow,
                c: 1
            },
            e: {
                r: nextMergeStartRow,
                c: raterProcessCount
            }
        }); // Merge by Columns

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

    static async calculateFinalSummaryScenarioWise(parcelRaterSiteWise, ltlRaterSiteWise, tlRaterSiteWise, fleetRaterSiteWise, scenarioType, inputServiceLevel) {
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
        let sitesCount = groupedSites.length;

        var scenarioSitesTotalCostSum = groupedSites.reduce((total, obj) => obj.sumTotalCost + total, 0);

        // Single Site
        groupedSites.forEach((siteItem, index) => {

            var gtInputSlPKgSum = 0;
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
                        gtInputSlPKgSum += Sl1PkgSum;
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
                        gtInputSlPKgSum += Sl2PkgSum;
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
                        gtInputSlPKgSum += Sl3PkgSum;
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
                        gtInputSlPKgSum += Sl4PkgSum;
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
                        gtInputSlPKgSum += Sl5PkgSum;
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
                    if (item.serviceLevel <= inputServiceLevel) {
                        gtInputSlPKgSum += Sl6PkgSum;
                    }
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
                    if (item.serviceLevel <= inputServiceLevel) {
                        gtInputSlPKgSum += Sl7PkgSum;
                    }
                }
            });

            var totalSlPkgSum = Sl1PkgSum + Sl2PkgSum + Sl3PkgSum + Sl4PkgSum + Sl5PkgSum + Sl6PkgSum + Sl7PkgSum;

            jsonArr.push([
                index == 0 ? scenarioType == "single" ? "Single Site" : sitesCount + " Sites" : "",
                siteItem["siteName"],
                siteItem["sumTotalCost"] / 1000000,
                scenarioType == "single" ? "100%" : treeLogicsController.getPercentageWithoutZero(siteItem["sumTotalCost"], scenarioSitesTotalCostSum),
                (siteItem["sumTotalCost"] / siteItem["sumTotalPackages"]),
                treeLogicsController.getPercentageWithoutZero(Sl1PkgSum, totalSlPkgSum),
                treeLogicsController.getPercentageWithoutZero(Sl2PkgSum, totalSlPkgSum),
                treeLogicsController.getPercentageWithoutZero(Sl3PkgSum, totalSlPkgSum),
                treeLogicsController.getPercentageWithoutZero(Sl4PkgSum, totalSlPkgSum),
                treeLogicsController.getPercentageWithoutZero(Sl5PkgSum, totalSlPkgSum),
                treeLogicsController.getPercentageWithoutZero(Sl6PkgSum, totalSlPkgSum),
                treeLogicsController.getPercentageWithoutZero(Sl7PkgSum, totalSlPkgSum),
                "",
                treeLogicsController.getPercentageWithoutZero((totalSlPkgSum - gtInputSlPKgSum), totalSlPkgSum),
            ]);
        });

        return jsonArr;
    }

    static async calculateFinalSummaryDeliveryModeWise(parcelRaterStateWise, ltlRaterStateWise, tlRaterStateWise, fleetRaterStateWise) {

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
        let jsonArr = [];
        let titleColunms = ['Site', 'Delivery by Mode'];
        let subTitleColunms = [''];

        if (parcelRaterStateWise.length > 0) {
            subTitleColunms.push('Parcel');
        }
        if (ltlRaterStateWise.length > 0) {
            subTitleColunms.push('LTL');
        }
        if (tlRaterStateWise.length > 0) {
            subTitleColunms.push('TL');
        }
        if (fleetRaterStateWise.length > 0) {
            subTitleColunms.push('Fleet');
        }

        jsonArr.push(titleColunms);
        jsonArr.push(subTitleColunms);

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

            let valuesColunms = [siteItem["siteName"]];
            if (parcelRaterStateWise.length > 0) {
                valuesColunms.push(parcelSiteObj ? treeLogicsController.getPercentageWithoutZero(parcelSiteObj.totalPkgSum, parcelTotalPkgSum) : "");
            }
            if (ltlRaterStateWise.length > 0) {
                valuesColunms.push(ltlSiteObj ? treeLogicsController.getPercentageWithoutZero(ltlSiteObj.totalPkgSum, ltlTotalPkgSum) : "");
            }
            if (tlRaterStateWise.length > 0) {
                valuesColunms.push(tlSiteObj ? treeLogicsController.getPercentageWithoutZero(tlSiteObj.totalPkgSum, tlTotalPkgSum) : "");
            }
            if (fleetRaterStateWise.length > 0) {
                valuesColunms.push(fleetSiteObj ? treeLogicsController.getPercentageWithoutZero(fleetSiteObj.totalPkgSum, fleetTotalPkgSum) : "");
            }

            jsonArr.push(valuesColunms);
        });

        let lastColunms = ["Total"];
        if (parcelRaterStateWise.length > 0) {
            lastColunms.push(treeLogicsController.getPercentageWithoutZero(parcelTotalPkgSum, parcelTotalPkgSum));
        }
        if (ltlRaterStateWise.length > 0) {
            lastColunms.push(treeLogicsController.getPercentageWithoutZero(ltlTotalPkgSum, ltlTotalPkgSum));
        }
        if (tlRaterStateWise.length > 0) {
            lastColunms.push(treeLogicsController.getPercentageWithoutZero(tlTotalPkgSum, tlTotalPkgSum));
        }
        if (fleetRaterStateWise.length > 0) {
            lastColunms.push(treeLogicsController.getPercentageWithoutZero(fleetTotalPkgSum, fleetTotalPkgSum));
        }

        jsonArr.push(lastColunms);

        return jsonArr;
    }

    //==================================== Port Process =============================================

    static async getPortRaterMainDataJson1(
        selectedPorts,
        comparisonType,
        selectedDate,
        portDataList,
    ) {
        try {

            selectedDate = treeLogicsController.getRealDate(selectedDate);

            var currentDate = new Date(selectedDate);
            var datebefore1Days = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
            var datebefore7Days = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            var datebefore2Days = new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000); //only for 3 days averages
            var datebefore3Days = new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000); //only for 3 days averages
            var datebefore8Days = new Date(currentDate.getTime() - 8 * 24 * 60 * 60 * 1000); //only for 3 days averages
            var datebefore9Days = new Date(currentDate.getTime() - 9 * 24 * 60 * 60 * 1000); //only for 3 days averages

            var currentPortYear = currentDate.getFullYear();
            var currentPortDate = treeLogicsController.getPortFormattedDate(moment(currentDate).format('M/D'));
            var before1DaysPortDate = treeLogicsController.getPortFormattedDate(moment(datebefore1Days).format('M/D'));
            var before7DaysPortDate = treeLogicsController.getPortFormattedDate(moment(datebefore7Days).format('M/D'));
            var before2DaysPortDate = treeLogicsController.getPortFormattedDate(moment(datebefore2Days).format('M/D')); //only for 3 days averages
            var before3DaysPortDate = treeLogicsController.getPortFormattedDate(moment(datebefore3Days).format('M/D')); //only for 3 days averages
            var before8DaysPortDate = treeLogicsController.getPortFormattedDate(moment(datebefore8Days).format('M/D')); //only for 3 days averages
            var before9DaysPortDate = treeLogicsController.getPortFormattedDate(moment(datebefore9Days).format('M/D')); //only for 3 days averages

            let threeDayDatesForCurrentDate = [before2DaysPortDate, before1DaysPortDate, currentPortDate]; //only for 3 days averages

            var finalOutput = [];
            var comparisonDates = [];
            let threeDayDatesForOtherDate = []; //only for 3 days averages

            if (comparisonType == "Weeks") {
                comparisonDates = [before7DaysPortDate, currentPortDate];
                threeDayDatesForOtherDate = [before9DaysPortDate, before8DaysPortDate, before7DaysPortDate]; //only for 3 days averages
            } else {
                comparisonDates = [before1DaysPortDate, currentPortDate];
                threeDayDatesForOtherDate = [before3DaysPortDate, before2DaysPortDate, before1DaysPortDate]; //only for 3 days averages
            }

            // Run loop to calculate data
            for (var portName of selectedPorts) {

                let portData = treeLogicsController.filterItemsInDataList(portDataList, "SheetName", portName);

                if (portData.length > 0) {

                    let requiredDaysData = portData.filter(obj => comparisonDates.includes(obj.Date) && currentPortYear == obj.Year);

                    //swaping dates
                    let tempArr = requiredDaysData[0];
                    requiredDaysData[0] = requiredDaysData[1];
                    requiredDaysData[1] = tempArr;

                    let DatesList = [];

                    // Run the loop for dates
                    for (let i = 0; i < requiredDaysData.length; i++) {

                        let threeDateAverageCalculatingDates = (threeDayDatesForCurrentDate[0] == requiredDaysData[i]["Date"]) ? threeDayDatesForCurrentDate : threeDayDatesForOtherDate
                        let threeDatePortRequiredData = portData.filter(obj => threeDateAverageCalculatingDates.includes(obj.Date) && currentPortYear == obj.Year);

                        let threeDayTotal = 0;
                        for (let j = 0; j < threeDatePortRequiredData.length; j++) {
                            let sum = treeLogicsController.sumTotalContainersOfDate(threeDatePortRequiredData[j])
                            threeDayTotal += sum;
                        }

                        let Containers = parseFloat(requiredDaysData[i]["Containers"]) || 0;
                        let Date = requiredDaysData[i]["Date"];
                        let Year = requiredDaysData[i]["Year"];
                        let Total = treeLogicsController.sumTotalContainersOfDate(requiredDaysData[i]);
                        let MedianDaysAnchor = parseFloat(requiredDaysData[i]["MedianDaysAnchor"]) || 0;
                        let MedianDaysPort = parseFloat(requiredDaysData[i]["MedianDaysPort"]) || 0;
                        let ActualTotal = MedianDaysAnchor + MedianDaysPort;

                        let ThreeDaysAverage = (threeDayTotal / threeDatePortRequiredData.length).toFixed(2);

                        if (i >= 2) {
                            let Total1 = treeLogicsController.sumTotalContainersOfDate(requiredDaysData[i - 1]);
                            let MedianDaysAnchor1 = parseFloat(requiredDaysData[i - 1]["MedianDaysAnchor"]) || 0;
                            let MedianDaysPort1 = parseFloat(requiredDaysData[i - 1]["MedianDaysPort"]) || 0;
                            let ActualTotal1 = MedianDaysAnchor1 + MedianDaysPort1;

                            let Total2 = treeLogicsController.sumTotalContainersOfDate(requiredDaysData[i - 2]);
                            let MedianDaysAnchor2 = parseFloat(requiredDaysData[i - 2]["MedianDaysAnchor"]) || 0;
                            let MedianDaysPort2 = parseFloat(requiredDaysData[i - 2]["MedianDaysPort"]) || 0;
                            let ActualTotal2 = MedianDaysAnchor2 + MedianDaysPort2;

                            ThreeDaysAverage = Total + Total1 + Total2;
                        }

                        DatesList.push({
                            Date: Date,
                            Year: Year,
                            Containers: Containers,
                            Total: Total,
                            ThreeDaysAverage: Number(ThreeDaysAverage),
                            MedianDaysAnchor: MedianDaysAnchor,
                            MedianDaysPort: MedianDaysPort,
                            ActualTotal: ActualTotal,
                        });
                    }

                    // Prepare final output
                    finalOutput.push({
                        Region: portData[0].Region,
                        Country: portData[0].Country,
                        PortName: portData[0].PortName,
                        LoCode: portData[0].LoCode,
                        DatesList: DatesList,
                    });
                }
            }

            return finalOutput;

        } catch (err) {
            console.log(err);
        }
    }

    static async getPortRaterMainDataJson(
        selectedPorts,
        comparisonType,
        selectedDate,
        portDataList,
    ) {
        try {

            selectedDate = treeLogicsController.getRealDate(selectedDate);

            var currentDate = new Date(selectedDate);
            var datebefore1Days = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
            var datebefore7Days = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            var datebefore2Days = new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000); //only for 3 days averages
            var datebefore3Days = new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000); //only for 3 days averages
            var datebefore8Days = new Date(currentDate.getTime() - 8 * 24 * 60 * 60 * 1000); //only for 3 days averages
            var datebefore9Days = new Date(currentDate.getTime() - 9 * 24 * 60 * 60 * 1000); //only for 3 days averages

            var currentPortYear = currentDate.getFullYear();
            var currentPortDate = treeLogicsController.getPortFormattedDate(moment(currentDate).format('M/D'));
            var before1DaysPortDate = treeLogicsController.getPortFormattedDate(moment(datebefore1Days).format('M/D'));
            var before7DaysPortDate = treeLogicsController.getPortFormattedDate(moment(datebefore7Days).format('M/D'));
            var before2DaysPortDate = treeLogicsController.getPortFormattedDate(moment(datebefore2Days).format('M/D')); //only for 3 days averages
            var before3DaysPortDate = treeLogicsController.getPortFormattedDate(moment(datebefore3Days).format('M/D')); //only for 3 days averages
            var before8DaysPortDate = treeLogicsController.getPortFormattedDate(moment(datebefore8Days).format('M/D')); //only for 3 days averages
            var before9DaysPortDate = treeLogicsController.getPortFormattedDate(moment(datebefore9Days).format('M/D')); //only for 3 days averages

            let threeDayDatesForCurrentDate = [before2DaysPortDate, before1DaysPortDate, currentPortDate]; //only for 3 days averages

            var finalOutput = [];
            var comparisonDates = [];
            let threeDayDatesForOtherDate = []; //only for 3 days averages

            if (comparisonType == "Weeks") {
                comparisonDates = [before7DaysPortDate, currentPortDate];
                threeDayDatesForOtherDate = [before9DaysPortDate, before8DaysPortDate, before7DaysPortDate]; //only for 3 days averages
            } else {
                comparisonDates = [before1DaysPortDate, currentPortDate];
                threeDayDatesForOtherDate = [before3DaysPortDate, before2DaysPortDate, before1DaysPortDate]; //only for 3 days averages
            }

            // Run loop to calculate data
            for (var portName of selectedPorts) {

                let portData = treeLogicsController.filterItemsInDataList(portDataList, "SheetName", portName);

                if (portData.length > 0) {

                    let requiredDaysData = portData.filter(obj => comparisonDates.includes(obj.Date) && currentPortYear == obj.Year);

                    //swaping dates
                    let tempArr = requiredDaysData[0];
                    requiredDaysData[0] = requiredDaysData[1];
                    requiredDaysData[1] = tempArr;

                    let DatesList = [];

                    // Run the loop for dates
                    for (let i = 0; i < requiredDaysData.length; i++) {

                        let threeDateAverageCalculatingDates = (threeDayDatesForCurrentDate[0] == requiredDaysData[i]["Date"]) ? threeDayDatesForCurrentDate : threeDayDatesForOtherDate
                        let threeDatePortRequiredData = portData.filter(obj => threeDateAverageCalculatingDates.includes(obj.Date) && currentPortYear == obj.Year);

                        let threeDayTotal = 0;
                        for (let j = 0; j < threeDatePortRequiredData.length; j++) {
                            let sum = treeLogicsController.sumTotalContainersOfDate(threeDatePortRequiredData[j])
                            threeDayTotal += sum;
                        }

                        let Containers = parseFloat(requiredDaysData[i]["Containers"]) || 0;
                        let Date = requiredDaysData[i]["Date"];
                        let Year = requiredDaysData[i]["Year"];
                        let Total = treeLogicsController.sumTotalContainersOfDate(requiredDaysData[i]);
                        let MedianDaysAnchor = parseFloat(requiredDaysData[i]["MedianDaysAnchor"]) || 0;
                        let MedianDaysPort = parseFloat(requiredDaysData[i]["MedianDaysPort"]) || 0;
                        let ActualTotal = MedianDaysAnchor + MedianDaysPort;

                        let ThreeDaysAverage = (threeDayTotal / threeDatePortRequiredData.length).toFixed(2);

                        if (i >= 2) {
                            let Total1 = treeLogicsController.sumTotalContainersOfDate(requiredDaysData[i - 1]);
                            let MedianDaysAnchor1 = parseFloat(requiredDaysData[i - 1]["MedianDaysAnchor"]) || 0;
                            let MedianDaysPort1 = parseFloat(requiredDaysData[i - 1]["MedianDaysPort"]) || 0;
                            let ActualTotal1 = MedianDaysAnchor1 + MedianDaysPort1;

                            let Total2 = treeLogicsController.sumTotalContainersOfDate(requiredDaysData[i - 2]);
                            let MedianDaysAnchor2 = parseFloat(requiredDaysData[i - 2]["MedianDaysAnchor"]) || 0;
                            let MedianDaysPort2 = parseFloat(requiredDaysData[i - 2]["MedianDaysPort"]) || 0;
                            let ActualTotal2 = MedianDaysAnchor2 + MedianDaysPort2;

                            ThreeDaysAverage = Total + Total1 + Total2;
                        }

                        DatesList.push({
                            Date: Date,
                            Year: Year,
                            Containers: Containers,
                            Total: Total,
                            ThreeDaysAverage: Number(ThreeDaysAverage),
                            MedianDaysAnchor: MedianDaysAnchor,
                            MedianDaysPort: MedianDaysPort,
                            ActualTotal: ActualTotal,
                        });
                    }

                    // Prepare final output
                    finalOutput.push({
                        Region: portData[0].Region,
                        Country: portData[0].Country,
                        PortName: portData[0].PortName,
                        LoCode: portData[0].LoCode,
                        DatesList: DatesList,
                    });
                }
            }

            return finalOutput;

        } catch (err) {
            console.log(err);
        }
    }

    static async getExcelJsonForPortRater(portRaterMainJson, styleOpts = {}) {

        var DatesList = portRaterMainJson[0]["DatesList"];
        var trendPercent = 2/100;
        var datesCount = DatesList.length;

        // Start to set Excel JSON
        let columnCount = ((datesCount + 1) * 6) + 3 + 1;
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
        let rowsCount = portRaterMainJson.length + 6;
        let currencyColArr = [];
        let boldRowArr = [4, 5];
        let colorRowArr = [2];
        let jsonArr = [];

        jsonArr.push([]);
        jsonArr.push(['Port Rater Report', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
        jsonArr.push([]);

        var headRow1 = ['Region', 'Country', 'Port', 'Locode'];
        var headRow2 = ['', '', '', ''];

        let datesCountInc = datesCount + 1;

        DatesList.forEach(item => {
            headRow1.push('Container');
            headRow2.push(item.Date + `/${item.Year}`);
        });
        headRow1.push('Container');
        headRow2.push("Trend");
        mergeArr.push({
            s: {
                r: 4,
                c: (datesCountInc * 0 + 4)
            },
            e: {
                r: 4,
                c: (datesCountInc * 0 + 4) + datesCount
            }
        });

        DatesList.forEach(item => {
            headRow1.push('Commercial');
            headRow2.push(item.Date + `/${item.Year}`);
        });
        headRow1.push('Commercial');
        headRow2.push("Trend");
        mergeArr.push({
            s: {
                r: 4,
                c: (datesCountInc * 1 + 4)
            },
            e: {
                r: 4,
                c: (datesCountInc * 1 + 4) + datesCount
            }
        });

        DatesList.forEach(item => {
            headRow1.push('3 Day Average');
            headRow2.push(item.Date + `/${item.Year}`);
        });
        headRow1.push('3 Day Average');
        headRow2.push("Trend");
        mergeArr.push({
            s: {
                r: 4,
                c: (datesCountInc * 2 + 4)
            },
            e: {
                r: 4,
                c: (datesCountInc * 2 + 4) + datesCount
            }
        });

        headRow1.push('');
        headRow2.push('');

        DatesList.forEach(item => {
            headRow1.push('Anchor (Days)');
            headRow2.push(item.Date + `/${item.Year}`);
        });
        headRow1.push('Anchor (Days)');
        headRow2.push("Trend");
        mergeArr.push({
            s: {
                r: 4,
                c: (datesCountInc * 3 + 4 + 1)
            },
            e: {
                r: 4,
                c: (datesCountInc * 3 + 4 + 1) + datesCount
            }
        });

        DatesList.forEach(item => {
            headRow1.push('Port (Days)');
            headRow2.push(item.Date + `/${item.Year}`);
        });
        headRow1.push('Port (Days)');
        headRow2.push("Trend");
        mergeArr.push({
            s: {
                r: 4,
                c: (datesCountInc * 4 + 4 + 1)
            },
            e: {
                r: 4,
                c: (datesCountInc * 4 + 4 + 1) + datesCount
            }
        });

        DatesList.forEach(item => {
            headRow1.push('Total (Days)');
            headRow2.push(item.Date + `/${item.Year}`);
        });
        headRow1.push('Total Days)');
        headRow2.push("Trend");
        mergeArr.push({
            s: {
                r: 4,
                c: (datesCountInc * 5 + 4 + 1)
            },
            e: {
                r: 4,
                c: (datesCountInc * 5 + 4 + 1) + datesCount
            }
        });

        jsonArr.push(headRow1);
        jsonArr.push(headRow2);

        var allDatesItems = [];

        for (let i = 0; i < portRaterMainJson.length; i++) {

            allDatesItems = [...allDatesItems, ...portRaterMainJson[i]["DatesList"]];

            let valueRow = [
                portRaterMainJson[i]["Region"],
                portRaterMainJson[i]["Country"],
                portRaterMainJson[i]["PortName"],
                portRaterMainJson[i]["LoCode"],
            ];

            let lastDateItem = portRaterMainJson[i]["DatesList"][datesCount - 1]; //27
            // {
            //     Date: '1/27',
            //     Year: 2022,
            //     Containers: 6,
            //     Total: 11,
            //     ThreeDaysAverage: 15.67,
            //     MedianDaysAnchor: 0.2,
            //     MedianDaysPort: 0.9,
            //     ActualTotal: 1.1
            //   }
            let last2DateItem = portRaterMainJson[i]["DatesList"][datesCount - 2]; //28
            // {
            //     Date: '1/28',
            //     Year: 2022,
            //     Containers: 6,
            //     Total: 10,
            //     ThreeDaysAverage: 15.67,
            //     MedianDaysAnchor: 0.2,
            //     MedianDaysPort: 0.8,
            //     ActualTotal: 1
            //   }

            // trendPercent = 2

            let ContainersTrend = "";
            let TotalTrend = "";
            let ThreeDaysAverageTrend = "";
            let MedianDaysAnchorTrend = "";
            let MedianDaysPortTrend = "";
            let ActualTotalTrend = "";

            if(last2DateItem) {
                ContainersTrend = (last2DateItem.Containers > (lastDateItem.Containers * (1 + trendPercent))) ? "⬆" : (last2DateItem.Containers < (lastDateItem.Containers * (1 - trendPercent))) ? "⬇" : "";
                TotalTrend = (last2DateItem.Total > (lastDateItem.Total * (1 + trendPercent))) ? "⬆" : (last2DateItem.Total < (lastDateItem.Total * (1 - trendPercent))) ? "⬇" : "";
                ThreeDaysAverageTrend = (last2DateItem.ThreeDaysAverage > (lastDateItem.ThreeDaysAverage * (1 + trendPercent))) ? "⬆" : (last2DateItem.ThreeDaysAverage < (lastDateItem.ThreeDaysAverage * (1 - trendPercent))) ? "⬇" : "";
                MedianDaysAnchorTrend = (last2DateItem.MedianDaysAnchor > (lastDateItem.MedianDaysAnchor * (1 + trendPercent))) ? "⬆" : (last2DateItem.MedianDaysAnchor < (lastDateItem.MedianDaysAnchor * (1 - trendPercent))) ? "⬇" : "";
                MedianDaysPortTrend = (last2DateItem.MedianDaysPort > (lastDateItem.MedianDaysPort * (1 + trendPercent))) ? "⬆" : (last2DateItem.MedianDaysPort < (lastDateItem.MedianDaysPort * (1 - trendPercent))) ? "⬇" : "";
                ActualTotalTrend = (last2DateItem.ActualTotal > (lastDateItem.ActualTotal * (1 + trendPercent))) ? "⬆" : (last2DateItem.ActualTotal < (lastDateItem.ActualTotal * (1 - trendPercent))) ? "⬇" : "";
            }
            // if (last2DateItem) {
            //     ContainersTrend = last2DateItem.Containers > (lastDateItem.Containers * (1 + trendPercent)) ? "⬆" : "⬇";
            //     TotalTrend = last2DateItem.Total > (lastDateItem.Total * (1 + trendPercent)) ? "⬆" : "⬇";
            //     ThreeDaysAverageTrend = last2DateItem.ThreeDaysAverage > (lastDateItem.ThreeDaysAverage * (1 + trendPercent)) ? "⬆" : "⬇";
            //     MedianDaysAnchorTrend = last2DateItem.MedianDaysAnchor > (lastDateItem.MedianDaysAnchor * (1 + trendPercent)) ? "⬆" : "⬇";
            //     MedianDaysPortTrend = last2DateItem.MedianDaysPort > (lastDateItem.MedianDaysPort * (1 + trendPercent)) ? "⬆" : "⬇";
            //     ActualTotalTrend = last2DateItem.ActualTotal > (lastDateItem.ActualTotal * (1 + trendPercent)) ? "⬆" : "⬇";
            // }

            portRaterMainJson[i]["DatesList"].forEach(item => {
                valueRow.push(item.Containers);
            });
            valueRow.push(ContainersTrend);

            portRaterMainJson[i]["DatesList"].forEach(item => {
                valueRow.push(item.Total);
            });
            valueRow.push(TotalTrend);

            portRaterMainJson[i]["DatesList"].forEach(item => {
                valueRow.push(item.ThreeDaysAverage);
            });
            valueRow.push(ThreeDaysAverageTrend);

            valueRow.push('')

            portRaterMainJson[i]["DatesList"].forEach(item => {
                valueRow.push(item.MedianDaysAnchor);
            });
            valueRow.push(MedianDaysAnchorTrend);

            portRaterMainJson[i]["DatesList"].forEach(item => {
                valueRow.push(item.MedianDaysPort);
            });
            valueRow.push(MedianDaysPortTrend);

            portRaterMainJson[i]["DatesList"].forEach(item => {
                valueRow.push(item.ActualTotal);
            });
            valueRow.push(ActualTotalTrend);

            jsonArr.push(valueRow);
        }

        var groupedDatesList = treeLogicsController.groupByDataList(allDatesItems, "Date");
        let lastRow = ['Overall', '', '', ''];


        let containersArr = [];
        await groupedDatesList.forEach(async item => {
            let sumOfContainer = await treeLogicsController.sumArrayItems(item.list, "Containers");
            lastRow.push(sumOfContainer);
            containersArr.push(sumOfContainer);
        });
        lastRow.push((containersArr[1] > (containersArr[0] * (1 + trendPercent))) ? "⬆" : (containersArr[1] < (containersArr[0] * (1 - trendPercent))) ? "⬇" : "");

        let totalArr = [];
        await groupedDatesList.forEach(async item => {
            let sumOfTotal = await treeLogicsController.sumArrayItems(item.list, "Total")
            lastRow.push(sumOfTotal);
            totalArr.push(sumOfTotal);
        });
        lastRow.push((totalArr[1] > (totalArr[0] * (1 + trendPercent))) ? "⬆" : (totalArr[1] < (totalArr[0] * (1 - trendPercent))) ? "⬇" : "");

        let threeDayAvgArr = [];
        await groupedDatesList.forEach(async item => {
            let sumOfThreeDaysAvg = await treeLogicsController.sumArrayItems(item.list, "ThreeDaysAverage")
            lastRow.push(sumOfThreeDaysAvg);
            threeDayAvgArr.push(sumOfThreeDaysAvg);
        });
        lastRow.push((threeDayAvgArr[1] > (threeDayAvgArr[0] * (1 + trendPercent))) ? "⬆" : (threeDayAvgArr[1] < (threeDayAvgArr[0] * (1 - trendPercent))) ? "⬇" : "");

        lastRow.push('');

        let medianDayAnchorArr = [];
        await groupedDatesList.forEach(async item => {
            let sumOfAnchor = await treeLogicsController.sumArrayItems(item.list, "MedianDaysAnchor")
            lastRow.push(sumOfAnchor);
            medianDayAnchorArr.push(sumOfAnchor);
        });
        lastRow.push((medianDayAnchorArr[1] > (medianDayAnchorArr[0] * (1 + trendPercent))) ? "⬆" : (medianDayAnchorArr[1] < (medianDayAnchorArr[0] * (1 - trendPercent))) ? "⬇" : "");

        let medianDaysPortArr = [];
        await groupedDatesList.forEach(async item => {
            let sumOfMedianDaysPort = await treeLogicsController.sumArrayItems(item.list, "MedianDaysPort")
            lastRow.push(sumOfMedianDaysPort);
            medianDaysPortArr.push(sumOfMedianDaysPort);
        });
        lastRow.push((medianDaysPortArr[1] > (medianDaysPortArr[0] * (1 + trendPercent))) ? "⬆" : (medianDaysPortArr[1] < (medianDaysPortArr[0] * (1 - trendPercent))) ? "⬇" : "");

        let actualTotalArr = [];
        await groupedDatesList.forEach(async item => {
            let sumOfActualTotal = await treeLogicsController.sumArrayItems(item.list, "ActualTotal")
            lastRow.push(sumOfActualTotal);
            actualTotalArr.push(sumOfActualTotal);
        });
        lastRow.push((actualTotalArr[1] > (actualTotalArr[0] * (1 + trendPercent))) ? "⬆" : (actualTotalArr[1] < (actualTotalArr[0] * (1 + trendPercent))) ? "⬇" : "");

        jsonArr.push(lastRow);
        mergeArr.push({
            s: {
                r: jsonArr.length,
                c: 0
            },
            e: {
                r: jsonArr.length,
                c: 3
            }
        });
        boldRowArr.push(jsonArr.length);

        //==================================== Region wise overall report generation =============================================
        var headRow3 = ['Region', '', '', ''];
        var headRow4 = ['', '', '', ''];
        boldRowArr.push(jsonArr.length + 4, jsonArr.length + 5);

        DatesList.forEach(item => {
            headRow3.push('Container');
            headRow4.push(item.Date + `/${item.Year}`);
        });
        headRow3.push('Container');
        headRow4.push("Trend");
        mergeArr.push({
            s: {
                r: jsonArr.length + 4,
                c: (datesCountInc * 0 + 4)
            },
            e: {
                r: jsonArr.length + 4,
                c: (datesCountInc * 0 + 4) + datesCount
            }
        });

        DatesList.forEach(item => {
            headRow3.push('Commercial');
            headRow4.push(item.Date + `/${item.Year}`);
        });
        headRow3.push('Commercial');
        headRow4.push("Trend");
        mergeArr.push({
            s: {
                r: jsonArr.length + 4,
                c: (datesCountInc * 1 + 4)
            },
            e: {
                r: jsonArr.length + 4,
                c: (datesCountInc * 1 + 4) + datesCount
            }
        });

        DatesList.forEach(item => {
            headRow3.push('3 Day Average');
            headRow4.push(item.Date + `/${item.Year}`);
        });
        headRow3.push('3 Day Average');
        headRow4.push("Trend");
        mergeArr.push({
            s: {
                r: jsonArr.length + 4,
                c: (datesCountInc * 2 + 4)
            },
            e: {
                r: jsonArr.length + 4,
                c: (datesCountInc * 2 + 4) + datesCount
            }
        });

        headRow3.push('');
        headRow4.push('');

        DatesList.forEach(item => {
            headRow3.push('Anchor (Days)');
            headRow4.push(item.Date + `/${item.Year}`);
        });
        headRow3.push('Anchor (Days)');
        headRow4.push("Trend");
        mergeArr.push({
            s: {
                r: jsonArr.length + 4,
                c: (datesCountInc * 3 + 4 + 1)
            },
            e: {
                r: jsonArr.length + 4,
                c: (datesCountInc * 3 + 4 + 1) + datesCount
            }
        });

        DatesList.forEach(item => {
            headRow3.push('Port (Days)');
            headRow4.push(item.Date + `/${item.Year}`);
        });
        headRow3.push('Port (Days)');
        headRow4.push("Trend");
        mergeArr.push({
            s: {
                r: jsonArr.length + 4,
                c: (datesCountInc * 4 + 4 + 1)
            },
            e: {
                r: jsonArr.length + 4,
                c: (datesCountInc * 4 + 4 + 1) + datesCount
            }
        });

        DatesList.forEach(item => {
            headRow3.push('Total (Days)');
            headRow4.push(item.Date + `/${item.Year}`);
        });
        headRow3.push('Total (Days)');
        headRow4.push("Trend");
        mergeArr.push({
            s: {
                r: jsonArr.length + 4,
                c: (datesCountInc * 5 + 4 + 1)
            },
            e: {
                r: jsonArr.length + 4,
                c: (datesCountInc * 5 + 4 + 1) + datesCount
            }
        });

        jsonArr.push([], [], [], headRow3, headRow4);

        let groupByRegion = treeLogicsController.groupByDataList(portRaterMainJson, 'Region');

        for (let j = 0; j < groupByRegion.length; j++) { //for grouped data

            let rowData = [
                groupByRegion[j]["Region"], '', '', ''
            ];

            let datesData = [];
            for (let k = 0; k < groupByRegion[j].list.length; k++) { // for list of grouped data
                datesData = [...datesData, ...groupByRegion[j].list[k]['DatesList']];
            }

            let groupedDatesListInRegionSummary = treeLogicsController.groupByDataList(datesData, "Date");

            let containersArr = [];
            await groupedDatesListInRegionSummary.forEach(async item => {
                let sumOfContainer = await treeLogicsController.sumArrayItems(item.list, "Containers");
                rowData.push(sumOfContainer);
                containersArr.push(sumOfContainer);
            });
            rowData.push((containersArr[1] > (containersArr[0] * (1 + trendPercent))) ? "⬆" : (containersArr[1] < (containersArr[0] * (1 - trendPercent))) ? "⬇" : "");

            let totalArr = [];
            await groupedDatesListInRegionSummary.forEach(async item => {
                let sumOfTotal = await treeLogicsController.sumArrayItems(item.list, "Total")
                rowData.push(sumOfTotal);
                totalArr.push(sumOfTotal);
            });
            rowData.push((totalArr[1] > (totalArr[0] * (1 + trendPercent))) ? "⬆" : (totalArr[1] < (totalArr[0] * (1 - trendPercent))) ? "⬇" : "");

            let threeDayAvgArr = [];
            await groupedDatesListInRegionSummary.forEach(async item => {
                let sumOfThreeDaysAvg = await treeLogicsController.sumArrayItems(item.list, "ThreeDaysAverage")
                rowData.push(sumOfThreeDaysAvg);
                threeDayAvgArr.push(sumOfThreeDaysAvg);
            });
            rowData.push((threeDayAvgArr[1] > (threeDayAvgArr[0] * (1 + trendPercent))) ? "⬆" : (threeDayAvgArr[1] < (threeDayAvgArr[0] * (1 - trendPercent))) ? "⬇" : "");

            rowData.push('');

            let medianDayAnchorArr = [];
            await groupedDatesListInRegionSummary.forEach(async item => {
                let sumOfAnchor = await treeLogicsController.sumArrayItems(item.list, "MedianDaysAnchor")
                rowData.push(sumOfAnchor);
                medianDayAnchorArr.push(sumOfAnchor);
            });
            rowData.push((medianDayAnchorArr[1] > (medianDayAnchorArr[0] * (1 + trendPercent))) ? "⬆" : (medianDayAnchorArr[1] < (medianDayAnchorArr[0] * (1 - trendPercent))) ? "⬇" : "");

            let medianDaysPortArr = [];
            await groupedDatesListInRegionSummary.forEach(async item => {
                let sumOfMedianDaysPort = await treeLogicsController.sumArrayItems(item.list, "MedianDaysPort")
                rowData.push(sumOfMedianDaysPort);
                medianDaysPortArr.push(sumOfMedianDaysPort);
            });
            rowData.push((medianDaysPortArr[1] > (medianDaysPortArr[0] * (1 + trendPercent))) ? "⬆" : (medianDaysPortArr[1] < (medianDaysPortArr[0] * (1 - trendPercent))) ? "⬇" : "");

            let actualTotalArr = [];
            await groupedDatesListInRegionSummary.forEach(async item => {
                let sumOfActualTotal = await treeLogicsController.sumArrayItems(item.list, "ActualTotal")
                rowData.push(sumOfActualTotal);
                actualTotalArr.push(sumOfActualTotal);
            });
            rowData.push((actualTotalArr[1] > (actualTotalArr[0] * (1 + trendPercent))) ? "⬆" : (actualTotalArr[1] < (actualTotalArr[0] * (1 - trendPercent))) ? "⬇" : "");

            jsonArr.push(rowData);
        }

        let lastRowOfRegionSummary = [...lastRow];
        jsonArr.push(lastRowOfRegionSummary);
        // jsonArr.push(lastRowOfRegionSummary.filter(a => a !== ''));
        boldRowArr.push(jsonArr.length);

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

    static async getExcelSheetsReportTemplateWise(reportTemplate, inputMainJson) {

        var inputExcelSheets = [];

        if (reportTemplate == "networkComputation") {

            // Get parcel rater excel json
            if (inputMainJson.parcelRaterMainJson && inputMainJson.parcelRaterMainJson.length > 0) {
                inputExcelSheets.push({
                    sheetInputJson: await treeLogicsController.getExcelJsonForParcelRaterSiteWise(inputMainJson.parcelRaterMainJson),
                    sheetName: "Parcel Rater"
                });
            }

            // Get LTL rater excel json
            if (inputMainJson.ltlRaterMainJson && inputMainJson.ltlRaterMainJson.length > 0) {
                inputExcelSheets.push({
                    sheetInputJson: await treeLogicsController.getExcelJsonForLtlRaterSiteWise(inputMainJson.ltlRaterMainJson),
                    sheetName: "LTL Rater"
                });
            }

            // Get TL rater excel json
            if (inputMainJson.tlRaterMainJson && inputMainJson.tlRaterMainJson.length > 0) {
                inputExcelSheets.push({
                    sheetInputJson: await treeLogicsController.getExcelJsonForTlRaterSiteWise(inputMainJson.tlRaterMainJson),
                    sheetName: "TL Rater"
                });
            }

            // Get Fleet rater excel json
            if (inputMainJson.fleetRaterMainJson && inputMainJson.fleetRaterMainJson.length > 0) {
                inputExcelSheets.push({
                    sheetInputJson: await treeLogicsController.getExcelJsonForFleetRaterSiteWise(inputMainJson.fleetRaterMainJson),
                    sheetName: "Fleet Rater"
                });
            }

            // Get multi site summary excel json
            inputExcelSheets.push({
                sheetInputJson: await treeLogicsController.getMultiSiteSummaryExcelJson(
                    inputMainJson.parcelRaterMainJson || [],
                    inputMainJson.ltlRaterMainJson || [],
                    inputMainJson.tlRaterMainJson || [],
                    inputMainJson.fleetRaterMainJson || []
                ),
                sheetName: "Multi Site Summary"
            });

            // Get single site summary excel json
            inputExcelSheets.push({
                sheetInputJson: await treeLogicsController.getSingleSiteSummaryExcelJson(
                    inputMainJson.parcelRaterMainJson || [],
                    inputMainJson.ltlRaterMainJson || [],
                    inputMainJson.tlRaterMainJson || [],
                    inputMainJson.fleetRaterMainJson || []
                ),
                sheetName: "Single Site Summary"
            });

            // Get final summary excel json
            inputExcelSheets.push({
                sheetInputJson: await treeLogicsController.getFinalSummaryExcelJson(
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
                    sheetInputJson: await treeLogicsController.getExcelJsonForPortRater(inputMainJson.portRaterMainJson),
                    sheetName: "Port Rater"
                });
            }
        }

        if (reportTemplate == "default") {

            // Get default excel json
            if (inputMainJson.defaultProcessMainJson && inputMainJson.defaultProcessMainJson.length > 0) {
                inputExcelSheets.push({
                    sheetInputJson: await treeLogicsController.getExcelJsonForDefaultProcess(inputMainJson.defaultProcessMainJson),
                    sheetName: "Default"
                });
            }
        }

        return inputExcelSheets;
    }

    static async generateReportExcelFile(transactionId, userInfo, inputExcelSheets = []) {

        //Had to create a new workbook and then add the header
        const wb = xlsx.utils.book_new();

        if (inputExcelSheets.length > 0) {

            for (const item of inputExcelSheets) {
                let ws = await treeLogicsController.getExcelFormattedSheetData(item.sheetInputJson, userInfo);
                xlsx.utils.book_append_sheet(wb, ws, item.sheetName);
            }

        } else {
            let ws = await treeLogicsController.getExcelFormattedSheetData({
                jsonArr: [
                    []
                ],
                mergeArr: []
            }, userInfo);
            xlsx.utils.book_append_sheet(wb, ws, "dd");
        }

        await xlsx.writeFile(wb, config.reportFolderPath + "/report_" + transactionId + ".xlsx");

        return config.reportFileUrl + 'report_' + transactionId + '.xlsx';
    }

    static async getExcelFormattedSheetData(inputExcelSheetJson, userInfo = null, sheetType = "", displayHeadFoot = true) {

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
                headerInfo += "Service Level: " + treeLogicsController.getServiceLevelLabel(inputServiceLevel)
            }

            if (comparisonType) {
                headerInfo += "Comparison Type: " + comparisonType + " \n"
            }
            if (selectedDate) {
                let partOfDate = JSON.parse(selectedDate).split("/");
                let responseDate = `${partOfDate[1]}/${partOfDate[0]}/${partOfDate[2]}`;
                headerInfo += "Input Date: " + responseDate + " \n"
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
            inputSheetJson.jsonArr.push([], [], [], []);
            inputSheetJson.jsonArr.push(['Prepared by Emate Toolkit']);
            inputSheetJson.mergeArr.push({
                s: {
                    r: inputSheetJson.jsonArr.length,
                    c: 0
                },
                e: {
                    r: inputSheetJson.jsonArr.length,
                    c: inputSheetJson.columnCount
                }
            });
        }

        let ws = xlsx.utils.json_to_sheet([]);
        xlsx.utils.sheet_add_aoa(ws, inputSheetJson.headers);
        xlsx.utils.sheet_add_json(ws, inputSheetJson.jsonArr, {
            origin: 'A2',
            skipHeader: true
        });

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

        ws["!merges"] = inputSheetJson.mergeArr ? inputSheetJson.mergeArr : [];

        return ws;
    }

    //================================ Generate HTML Report ========================================

    static async getExcelSheetsReportTemplateWiseForHtml(reportTemplate, inputMainJson) {

        var inputExcelSheets = [];

        if (reportTemplate == "networkComputation") {

            // Get final summary excel json
            inputExcelSheets.push({
                sheetInputJson: await treeLogicsController.getFinalSummaryExcelJson(
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
                    sheetInputJson: await treeLogicsController.getExcelJsonForPortRater(inputMainJson.portRaterMainJson),
                    sheetName: "Port Rater"
                });
            }
        }

        if (reportTemplate == "default") {

            // Get default excel json
            if (inputMainJson.defaultProcessMainJson && inputMainJson.defaultProcessMainJson.length > 0) {
                inputExcelSheets.push({
                    sheetInputJson: await treeLogicsController.getExcelJsonForDefaultProcess(inputMainJson.defaultProcessMainJson),
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

            let ws = await treeLogicsController.getExcelFormattedSheetData(item.sheetInputJson, userInfo, "", false);
            let generatedTableHtml = xlsx.utils.sheet_to_html(ws);
            html += generatedTableHtml.replace('<table', '<table id="main-table" border="1" cellspacing="0" cellpadding="4"');
        }

        return html;
    }

    static async getDemoMainJson(req, res) {
        try {
            const {
                mainJson
            } = req.body;

            // templateName : "portAnalysis"
            var inputExcelSheets = await treeLogicsController.getExcelSheetsReportTemplateWise("portAnalysis", mainJson);
            await treeLogicsController.generateReportExcelFileDemo(inputExcelSheets);
            res.status(201).send({message : "done"});
        } catch (err) {
            console.log("Error :-", err);
        }
    }

    static async generateReportExcelFileDemo(inputExcelSheets) {
        const transactionId = "123";
        const userInfo = "";
        const wb = xlsx.utils.book_new();

        if (inputExcelSheets.length > 0) {

            for (const item of inputExcelSheets) {
                let ws = await treeLogicsController.getExcelFormattedSheetDataDemo(item.sheetInputJson, userInfo);
                xlsx.utils.book_append_sheet(wb, ws, item.sheetName);
            }

        } else {
            let ws = await treeLogicsController.getExcelFormattedSheetData({
                jsonArr: [
                    []
                ],
                mergeArr: []
            }, userInfo);
            xlsx.utils.book_append_sheet(wb, ws, "dd");
        }

        await xlsx.writeFile(wb, config.reportFolderPath + "/report_" + Date.now() + ".xlsx");

        return config.reportFileUrl + 'report_' + Date.now() + '.xlsx';
    }

    static async getExcelFormattedSheetDataDemo(inputExcelSheetJson, userInfo = null, sheetType = "", displayHeadFoot = true) {
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
                headerInfo += "Service Level: " + treeLogicsController.getServiceLevelLabel(inputServiceLevel)
            }

            if (comparisonType) {
                headerInfo += "Comparison Type: " + comparisonType + " \n"
            }
            if (selectedDate) {
                let partOfDate = JSON.parse(selectedDate).split("/");
                let responseDate = `${partOfDate[1]}/${partOfDate[0]}/${partOfDate[2]}`;
                headerInfo += "Input Date: " + responseDate + " \n"
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
            inputSheetJson.jsonArr.push([], [], [], []);
            inputSheetJson.jsonArr.push(['Prepared by Emate Toolkit']);
            inputSheetJson.mergeArr.push({
                s: {
                    r: inputSheetJson.jsonArr.length,
                    c: 0
                },
                e: {
                    r: inputSheetJson.jsonArr.length,
                    c: inputSheetJson.columnCount
                }
            });
        }

        let ws = xlsx.utils.json_to_sheet([]);
        xlsx.utils.sheet_add_aoa(ws, inputSheetJson.headers);
        xlsx.utils.sheet_add_json(ws, inputSheetJson.jsonArr, {
            origin: 'A2',
            skipHeader: true
        });

        for (let i in ws) {
            if (typeof (ws[i]) != "object") continue;
            let cell = xlsx.utils.decode_cell(i);

            ws[i].s = {
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                    textRotation : 90
                },
                border: {
                    left: {
                        style: "thick",
                        color: "DDDDDD"
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

        ws["!merges"] = inputSheetJson.mergeArr ? inputSheetJson.mergeArr : [];

        return ws;
    }
}