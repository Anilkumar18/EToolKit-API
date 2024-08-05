"use strict";

import mongoose from "mongoose";
import moment from 'moment';
import {
    _
} from 'lodash';
import fs from 'fs';
import treeLogicsController from "./treeLogicsNew.controller";
import ejs from "ejs";
import path from 'path';
import config from '../../../config/config';
import networkComputationHTML from "../../../data/networkComputationHtml";
export default class HTMLtreeLogicsController {

    static convertToMillion(amount) {
        if (isNaN(amount)) {
            return "";
        }
        return (Number(amount) / 1000000).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            style: 'currency',
            currency: 'USD',
        });
    }

    static async generateReportHtml(transactionId = "", inputMainJson = null, reportTemplate = "", userInfo = null) {
        let htmlContent;
        if (reportTemplate === "nearshoreTemplate") {
            htmlContent = await this.getHTMLReportFromInputJSON(inputMainJson);
        }else {
            htmlContent = await this.getExcelSheetsReportTemplateWiseForHtml(reportTemplate, inputMainJson, userInfo);
        }
        return htmlContent;
    }
    //================================ Final Summary ==============================================

    static async getFinalSummaryHTMLContent(parcelRaterMainJson, ltlRaterMainJson, tlRaterMainJson, fleetRaterMainJson, userInfo = {}, siteInfos) {

        const HTMLContentData = {
            singleSiteData: [],
            noOfSiteData: [],
            headersData: {
                userName: userInfo && userInfo.userName ? userInfo.userName : "",
                organizationName: userInfo && userInfo.organizationName ? userInfo.organizationName : "",
                overAllRevenue: userInfo && userInfo.overAllRevenue ? this.convertToMillion(userInfo.overAllRevenue) : "",
                eCommercePercent: userInfo && userInfo.parcelRaterPercent ? userInfo.parcelRaterPercent.toFixed(2).concat('%') : 0,
                ltlPercent: userInfo && userInfo.ltlPercent ? userInfo.ltlPercent.toFixed(2).concat('%') : 0,
                tlPercent: userInfo && userInfo.tlPercent ? userInfo.tlPercent.toFixed(2).concat('%') : 0,
                fleetPercent: userInfo && userInfo.fleetPercent ? userInfo.fleetPercent.toFixed(2).concat('%') : 0,
                parcelPercent: userInfo && userInfo.parcelRaterPercent ? userInfo.parcelRaterPercent.toFixed(2).concat('%') : 0,
                inputServiceLevel: userInfo && userInfo.inputServiceLevel ? treeLogicsController.getServiceLevelLabel(userInfo.inputServiceLevel) : "",
                comparisonType: userInfo && userInfo.comparisonType ? userInfo.comparisonType : "",
                selectedDate: userInfo && userInfo.selectedDate ? userInfo.selectedDate : ""
            },
            multiSiteData: []
        }

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
            parcelRaterSiteWise = treeLogicsController.groupByDataList(parcelRaterMainJson, "siteName");
            parcelRaterStateWise = treeLogicsController.groupByDataList(parcelRaterMainJson, "stateCode");
        }
        if (ltlRaterMainJson.length > 0) {
            ltlRaterSiteWise = treeLogicsController.groupByDataList(ltlRaterMainJson, "siteName");
            ltlRaterStateWise = treeLogicsController.groupByDataList(ltlRaterMainJson, "stateCode");
        }
        if (tlRaterMainJson.length > 0) {
            tlRaterSiteWise = treeLogicsController.groupByDataList(tlRaterMainJson, "siteName");
            tlRaterStateWise = treeLogicsController.groupByDataList(tlRaterMainJson, "stateCode");
        }
        if (fleetRaterMainJson.length > 0) {
            fleetRaterSiteWise = treeLogicsController.groupByDataList(fleetRaterMainJson, "siteName");
            fleetRaterStateWise = treeLogicsController.groupByDataList(fleetRaterMainJson, "stateCode");
        }
        const singleData = await this.calculateFinalSummaryScenarioWise(parcelRaterSiteWise, ltlRaterSiteWise, tlRaterSiteWise, fleetRaterSiteWise, "single", inputServiceLevel, HTMLContentData.singleSiteData);
        HTMLContentData.singleSiteData = singleData;

        //----------------------------------------- Multi Sites Scenario ------------------------------------------------------

        let parcelMinSiteWise = treeLogicsController.getMinSiteWiseItems(parcelRaterStateWise);
        let ltlMinSiteWise = treeLogicsController.getMinSiteWiseItems(ltlRaterStateWise);
        let tlMinSiteWise = treeLogicsController.getMinSiteWiseItems(tlRaterStateWise);
        let fleetMinSiteWise = treeLogicsController.getMinSiteWiseItems(fleetRaterStateWise);

        const noofSiteScenarioData = await this.calculateFinalSummaryScenarioWise(parcelMinSiteWise, ltlMinSiteWise, tlMinSiteWise, fleetMinSiteWise, "multi", inputServiceLevel, HTMLContentData.noOfSiteData);

        await this.calculateFinalSummaryDeliveryModeWise(parcelRaterStateWise, ltlRaterStateWise, tlRaterStateWise, fleetRaterStateWise, HTMLContentData.multiSiteData = []);
        const weightedAvg = this.networkComputationLoadBasedPerSite(noofSiteScenarioData.singleSiteData, noofSiteScenarioData.singleSiteData[0]['numberofLoads'])
        HTMLContentData.noOfSiteData = noofSiteScenarioData.singleSiteData;
        let htmlFileContent = fs.readFileSync(config.networkComputationStaticHTMLFile, {
            encoding: 'utf8',
            flag: 'r'
        });
        let htmlFileHighChartContent = fs.readFileSync(config.networkComputationHighChartHTMLFile, {
            encoding: 'utf8',
            flag: 'r'
        });
        const speedoMeterInfo = HTMLContentData.singleSiteData.map(siteInfo=>{
            return {
                [siteInfo.siteName] : {
                    1: +siteInfo['day1Per'].replace(/%/g, ""), 
                    2: +siteInfo['day2Per'].replace(/%/g, ""), 
                    3: +siteInfo['day3Per'].replace(/%/g, ""), 
                    4: +siteInfo['day4Per'].replace(/%/g, ""), 
                    5: +siteInfo['day5Per'].replace(/%/g, ""), 
                    6: +siteInfo['day6Per'].replace(/%/g, ""), 
                    7: +siteInfo['moreThan6DayPer'].replace(/%/g, ""), 
                }
            }
        })
        const average = this.calculateAverage(speedoMeterInfo);
        speedoMeterInfo.push({ "Select All": average });
        htmlFileContent = htmlFileContent.replace('__service_Level_Till_Days_', `X ≤ ${inputServiceLevel} Days`)
            .replace('__service_Level_upto_Days_', `${inputServiceLevel} ≤ 5  Days`);

        const singleSiteRow = `
        <tr height=21 style='height:15.75pt'>
            <td height=21 class=xl66 style='border:none;height:15.75pt;border-top:none'>&nbsp;</td>
            __rowSpanTDValue_
            <td class='xl66 b-left' style='border-left:none'>__Location__</td>
            <td class=xl80>_revValue_</td>
            <td class=xl66 style='border-left:none'>_TotalPer_</td>
            <td class='xl67 b-right' style='border-left:none'>_perLoadValue_</td>
            <td></td>
            <td class=xl79 style='border-bottom:0.5pt dashed windowtext'>_day1Per_</td>
            <td class=xl66 style='border-left:none'>_day2Per_</td>
            <td class=xl66 style='border-left:none'>_day3Per_</td>
            <td class=xl66 style='border-left:none'>_day4Per_</td>
            <td class=xl66 style='border-left:none'>_day5Per_</td>
            <td class=xl66 style='border-left:none'>_day6Per_</td>
            <td class=xl66 style='border-top:none;border-left:none'>_moreThan6DaysPer_</td>
            <td class=xl82 style='border-top:none'>_tillServiceLevelDays_</td>
            <td class=xl66 style='border-left:none'>_AboveServiceLevelDays_</td>
            <td class=xl83 style='border-left:none'>_moreThan6ServiceLevelDaysPer_</td>
            <td colspan=7 ></td>
        </tr>`;
        let singleSiteRowValue = '';
        HTMLContentData.singleSiteData.forEach((data, idx) => {
            singleSiteRowValue += singleSiteRow.replace('__Location__', data.siteName)
                .replace('_revValue_', data.revenueInM)
                .replace('_TotalPer_', data.totalPer)
                .replace('_perLoadValue_', data.perLoad)
                .replace('_day1Per_', data.day1Per)
                .replace('_day2Per_', data.day2Per)
                .replace('_day3Per_', data.day3Per)
                .replace('_day4Per_', data.day4Per)
                .replace('_day5Per_', data.day5Per)
                .replace('_day6Per_', data.day6Per)
                .replace('_moreThan6DaysPer_', data.moreThan6DayPer)
                .replace('_tillServiceLevelDays_', data.uptoInputSlPkgSum)
                .replace('_AboveServiceLevelDays_', data.outOfInputSlPkgSum)
                .replace('_moreThan6ServiceLevelDaysPer_', data.gt6DaysSLPkgSum)
                .replace('__rowSpanTDValue_', idx === 0 ? `<td rowspan=${HTMLContentData.singleSiteData.length} class=xl93>Single Site</td>` : '');
        });

        htmlFileContent = htmlFileContent.replace('__Single_Site_Rows__', singleSiteRowValue)
            .replace('_totalCostValue_', noofSiteScenarioData.subTotalObj.totalCostValue.toFixed(2))
            .replace('_totalPerValue_', noofSiteScenarioData.subTotalObj.totalPerValue.toFixed(2))
            .replace('_totalLoadValue_', noofSiteScenarioData.subTotalObj.totalLoadValue.toFixed(2))
            .replace('_day1Per_', weightedAvg.day1Per.toFixed(4))
            .replace('_day2Per_', weightedAvg.day2Per.toFixed(4))
            .replace('_day3Per_', weightedAvg.day3Per.toFixed(4))
            .replace('_day4Per_', weightedAvg.day4Per.toFixed(4))
            .replace('_day5Per_', weightedAvg.day5Per.toFixed(4))
            .replace('_day6Per_', weightedAvg.day6Per.toFixed(4))
            .replace('_day7Per_', weightedAvg.moreThan6DayPer.toFixed(4))
            .replace('_uptoInputSlPkgSum_', weightedAvg.uptoInputSlPkgSum.toFixed(4))
            .replace('_outOfInputSlPkgSum_', weightedAvg.outOfInputSlPkgSum.toFixed(4))
            .replace('_gt6DaysSLPkgSum_', weightedAvg.gt6DaysSLPkgSum.toFixed(4));

        const noOfSitesRow = `
        <tr height=21 style='height:15.75pt'>
        <td height=21 class=xl66 style='border:none;height:15.75pt;border-top:none'> </td>
        __rowSpanTDValue_
            <td class='xl66 b-left' style='border-top:none;border-left:none'>__Location__</td>
            <td class=xl80 style='border-top:none'>_revValue_</td>
            <td class=xl66 style='border-top:none;border-left:none'>_TotalPer_</td>
            <td class='xl67 b-right' style='border-top:none;border-left:none'>_perLoadValue_</td>
            <td></td>
            <td class=xl79 style='border-bottom:0.5pt dashed windowtext'>_day1Per_</td>
            <td class=xl66 style='border-top:none;'>_day2Per_</td>
            <td class=xl66 style='border-top:none;border-left:none'>_day3Per_</td>
            <td class=xl66 style='border-top:none;border-left:none'>_day4Per_</td>
            <td class=xl66 style='border-top:none;border-left:none'>_day5Per_</td>
            <td class=xl66 style='border-top:none;border-left:none'>_day6Per_</td>
            <td class=xl66 style='border-top:none;border-left:none'>_moreThan6DaysPer_</td>
            <td class=xl82 style='border-top:none'>_tillServiceLevelDays_</td>
            <td class=xl66 style='border-top:none;border-left:none'>_AboveServiceLevelDays_</td>
            <td class=xl83 style='border-top:none;border-left:none'>_moreThan6ServiceLevelDaysPer_</td>
            <td colspan=7></td>
        </tr>`;
        let noOfSiteRowValue = '';
        HTMLContentData.noOfSiteData.forEach((data, idx) => {
            noOfSiteRowValue += noOfSitesRow.replace('__Location__', data.siteName)
                .replace('_revValue_', data.revenueInM)
                .replace('_TotalPer_', data.totalPer)
                .replace('_perLoadValue_', data.perLoad)
                .replace('_day1Per_', data.day1Per)
                .replace('_day2Per_', data.day2Per)
                .replace('_day3Per_', data.day3Per)
                .replace('_day4Per_', data.day4Per)
                .replace('_day5Per_', data.day5Per)
                .replace('_day6Per_', data.day6Per)
                .replace('_moreThan6DaysPer_', data.moreThan6DayPer)
                .replace('_tillServiceLevelDays_', data.uptoInputSlPkgSum)
                .replace('_AboveServiceLevelDays_', data.outOfInputSlPkgSum)
                .replace('_moreThan6ServiceLevelDaysPer_', data.gt6DaysSLPkgSum)
                .replace('__rowSpanTDValue_', idx === 0 ? `<td class=xl93 rowspan=${HTMLContentData.noOfSiteData.length} style='border-top:none'>${HTMLContentData.noOfSiteData.length} Sites</td>` : '')
        });

        htmlFileContent = htmlFileContent.replace('__No_Of_Site_Data_Rows__', noOfSiteRowValue)


        const noOfMultiSitesRow = `
        <tr height=21 style='height:15.75pt'>
            <td height=21 class=xl66 style='border:none;height:15.75pt;border-top:none'> </td>
            __rowSpanTDValue_
            <td class='xl66 b-left' style='border-left:none'>__Location__</td>
            <td class='xl80 b-right'>_parcelPer_</td>
            <td class='xl66 b-right' style='border-left:none'>_ltlPer_</td>
            <td class='xl67 b-right' style='border-left:none'>_tlPer_</td>
            <td class='xl81 b-right'>_fleetPer_</td>
            <td class='xl66 b-right'>_totalPer_</td>
            <td colspan=17></td>
        </tr>`;

        let noOfMultiSiteRowValue = '';
        HTMLContentData.multiSiteData.forEach((data, idx) => {
            noOfMultiSiteRowValue += noOfMultiSitesRow.replace('__Location__', data.siteName)
                .replace('_parcelPer_', data.parcelPer)
                .replace('_tlPer_', data.tlPer)
                .replace('_ltlPer_', data.ltlPer)
                .replace('_fleetPer_', data.fleetPer)
                .replace('_totalPer_', data.totalPer)
                .replace('__rowSpanTDValue_', idx === 0 ? `<td rowspan=${HTMLContentData.multiSiteData.length} class=xl93 style='border-bottom:1.5pt solid black'>${HTMLContentData.multiSiteData.length} Sites</td>` : '')
        });

        htmlFileContent = htmlFileContent.replace('_no_of_multi_site_data_', noOfMultiSiteRowValue)

        htmlFileContent = htmlFileContent
            .replace('_Report_Creator_', HTMLContentData.headersData.userName)
            .replace('_Todays_Date_', moment().format('L'))
            .replace('_Revenue_', HTMLContentData.headersData.overAllRevenue || '')
            .replace('_eComm_', HTMLContentData.headersData.eCommercePercent || '')
            .replace('_load_',noofSiteScenarioData.singleSiteData[0]['numberofLoads'] || '')
            .replace('_LTL_', HTMLContentData.headersData.ltlPercent || '')
            .replace('_TL_', HTMLContentData.headersData.tlPercent || '')
            .replace('_Private_Fleet_', HTMLContentData.headersData.fleetPercent || '')
            .replace('_Parcel_', HTMLContentData.headersData.parcelPercent || '')
            .replace('_Service_Level_', HTMLContentData.headersData.inputServiceLevel || '')
        htmlFileHighChartContent= htmlFileHighChartContent.replace('__Site_Service_Info__',JSON.stringify(speedoMeterInfo))
        htmlFileHighChartContent= htmlFileHighChartContent.replace('__Site_Info__',JSON.stringify(siteInfos))
        let HTMLFileSource = networkComputationHTML;
        HTMLFileSource= HTMLFileSource.replace(/(\r\n|\n)/g, '').concat(htmlFileContent.replace(/(\r\n|\n|\\)/g, '')).concat(`${htmlFileHighChartContent.replace(/(\r\n|\n|\\)/g, "")}`);
        return HTMLFileSource;
    }

    static async calculateFinalSummaryScenarioWise(parcelRaterSiteWise, ltlRaterSiteWise, tlRaterSiteWise, fleetRaterSiteWise, scenarioType, inputServiceLevel, singleSiteData = []) {
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

        const subTotalObj = {
            totalCostValue: 0,
            totalPerValue: 0,
            totalLoadValue: 0
        }
        // Single Site
        groupedSites.forEach((siteItem, index) => {
            let gt6DaysSLPkgSum = 0,
                uptoInputSlPkgSum = 0,
                numberofLoads = 0,
                outOfInputSlPkgSum = 0;
            var mergeSiteListArr = [];
            siteItem["list"].forEach((raterItems) => {
                mergeSiteListArr = mergeSiteListArr.concat(raterItems["list"])
                numberofLoads= raterItems["list"][0]['numberOfLoads'] || 0
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

            singleSiteData.push({
                siteName: siteItem["siteName"],
                revenueInM: this.convertToMillion(siteItem["sumTotalCost"]),
                totalPer: scenarioType == "single" ? "100%" : treeLogicsController.getPercentageWithoutZero(siteItem["sumTotalCost"], scenarioSitesTotalCostSum),
                perLoad: (siteItem["sumTotalCost"] / siteItem["sumTotalPackages"]).toFixed(2),
                day1Per: treeLogicsController.getPercentageWithoutZero(Sl1PkgSum, totalSlPkgSum),
                day2Per: treeLogicsController.getPercentageWithoutZero(Sl2PkgSum, totalSlPkgSum),
                day3Per: treeLogicsController.getPercentageWithoutZero(Sl3PkgSum, totalSlPkgSum),
                day4Per: treeLogicsController.getPercentageWithoutZero(Sl4PkgSum, totalSlPkgSum),
                day5Per: treeLogicsController.getPercentageWithoutZero(Sl5PkgSum, totalSlPkgSum),
                day6Per: treeLogicsController.getPercentageWithoutZero(Sl6PkgSum, totalSlPkgSum),
                moreThan6DayPer: treeLogicsController.getPercentageWithoutZero(Sl7PkgSum, totalSlPkgSum),
                uptoInputSlPkgSum: treeLogicsController.getPercentageWithoutZero(uptoInputSlPkgSum, totalSlPkgSum),
                outOfInputSlPkgSum: treeLogicsController.getPercentageWithoutZero(outOfInputSlPkgSum, totalSlPkgSum),
                gt6DaysSLPkgSum: treeLogicsController.getPercentageWithoutZero(gt6DaysSLPkgSum, totalSlPkgSum),
                numberofLoads
            });
            if (scenarioType !== "single") {
                subTotalObj.totalCostValue += siteItem["sumTotalCost"] / 1000000;
                subTotalObj.totalPerValue += (siteItem["sumTotalCost"] * 100) / scenarioSitesTotalCostSum;
                subTotalObj.totalLoadValue += (siteItem["sumTotalCost"] / siteItem["sumTotalPackages"]);
            }
        });
        return (scenarioType !== "single") ? {
            singleSiteData,
            subTotalObj
        } : singleSiteData
    }

    static async calculateFinalSummaryDeliveryModeWise(parcelRaterStateWise, ltlRaterStateWise, tlRaterStateWise, fleetRaterStateWise, multiSiteDataArr = []) {
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

            let valuesColunms = {
                    siteName: siteItem["siteName"],
                    parcelPer: '',
                    ltlPer: '',
                    tlPer: '',
                    fleetPer: '',
                    totalPer: ''
                },
                total = 0;
            if (parcelRaterStateWise.length > 0) {
                valuesColunms.parcelPer = (parcelSiteObj ? treeLogicsController.getPercentageWithoutZero(parcelSiteObj.totalPkgSum, parcelTotalPkgSum) : "");
                total += parcelSiteObj ? ((parcelSiteObj.totalPkgSum / parcelTotalPkgSum) * 100) : 0;
            }
            if (ltlRaterStateWise.length > 0) {
                valuesColunms.ltlPer = (ltlSiteObj ? treeLogicsController.getPercentageWithoutZero(ltlSiteObj.totalPkgSum, ltlTotalPkgSum) : "");
                total += ltlSiteObj ? ((ltlSiteObj.totalPkgSum / ltlTotalPkgSum) * 100) : 0;
            }
            if (tlRaterStateWise.length > 0) {
                valuesColunms.tlPer = (tlSiteObj ? treeLogicsController.getPercentageWithoutZero(tlSiteObj.totalPkgSum, tlTotalPkgSum) : "");
                total += tlSiteObj ? ((tlSiteObj.totalPkgSum / tlTotalPkgSum) * 100) : 0;
            }
            if (fleetRaterStateWise.length > 0) {
                valuesColunms.fleetPer = (fleetSiteObj ? treeLogicsController.getPercentageWithoutZero(fleetSiteObj.totalPkgSum, fleetTotalPkgSum) : "");
                total += fleetSiteObj ? ((fleetSiteObj.totalPkgSum / fleetTotalPkgSum) * 100) : 0;
            }
            valuesColunms.totalPer = (total.toFixed(2).concat('%'));
            multiSiteDataArr.push(valuesColunms);
        });
        return multiSiteDataArr;
    }

    static async getExcelSheetsReportTemplateWiseForHtml(reportTemplate, inputMainJson, userInfo) {
        if (reportTemplate == "networkComputation") {
            return await this.getFinalSummaryHTMLContent(
                inputMainJson.parcelRaterMainJson || [],
                inputMainJson.ltlRaterMainJson || [],
                inputMainJson.tlRaterMainJson || [],
                inputMainJson.fleetRaterMainJson || [],
                userInfo,
                inputMainJson.siteInfos
            )
        } else if (reportTemplate == "simpleForecast") {
            const inputMainJson = userInfo.forecast;
            return await this.getForecastTemplate(inputMainJson, userInfo)
        }else if (reportTemplate == "portAnalysis") {
            return await this.getPortRaterReportHTMLContent(inputMainJson.portRaterMainJson || [])
        }
    }

    static async getForecastTemplate(inputMainJson, userInfo) {
        const dataVal = JSON.parse(JSON.stringify(inputMainJson)); // Ensure reportTemplate is properly parsed

        let htmlFileContent = fs.readFileSync(config.forecastHTMLFile, {
            encoding: 'utf8',
            flag: 'r'
        });

        const noOfMultiSitesRow = `
            <tr height=21 style='height:15.75pt'>
                <td height=21 class=xl66 style='border:none;height:15.75pt;border-top:none'> </td>
                <td colspan="0" class='xl77 b-top b-right' style='border-top:none;'>_Date_</td>
                <td colspan="2" class='xl72 b-top b-right' style='border-top:none;border-left:none'>_forecastedValue_</td>
                <td colspan="2" class='xl72 b-top b-right' style='border-top:none;border-left:none'>_avgError_</td>
                <td colspan="2" class='xl72 b-top b-right' style='border-top:none;border-left:none'>_lowerBound_</td>
                <td colspan="2" class='xl72 b-top b-right' style='border-top:none;border-left:none'>_upperBound_</td>
                <td colspan=17></td>
            </tr>`;

        let noOfMultiSiteRowValue = '';
        dataVal.forEach((data, idx) => {
            noOfMultiSiteRowValue += noOfMultiSitesRow.replace('_Date_', data.Date)
                .replace('_forecastedValue_', data.Forecast)
                .replace('_avgError_', data.Avg)
                .replace('_lowerBound_', data.Lower)
                .replace('_upperBound_', data.Upper)
        });

        htmlFileContent = htmlFileContent.replace('_name_', userInfo.variableLabel);

        htmlFileContent = htmlFileContent.replace('_forecast_data_', noOfMultiSiteRowValue);

        return htmlFileContent;
    }

    static async getPortRaterReportHTMLContent(portRaterMainJson) {

        const DatesList = portRaterMainJson[0].list[0]["DatesList"];
        const DatesWeekList = portRaterMainJson[0].list[0]["DatesWeekList"];

        const trendPercent = 2 / 100;
        const datesCount = DatesList.length;

        let htmlFileContent = fs.readFileSync(config.portRatorStaticHTMLFile, {
            encoding: 'utf8',
            flag: 'r'
        });

        let headRow1 = '<td rowspan="2" class="b-left">Focus</td><td rowspan="2">Country</td><td rowspan="2">Port</td><td class="b-right" rowspan="2">Locode</td>';
        let headRow2 = '';

        ['Container', 'Commercial', '3 Day Average'].forEach((type) => {
            DatesList.forEach(item => {
                headRow2 += `<td>${item.Date}</td>`;
            });
            headRow1 += `<td class="b-right b-bottom" colspan="${DatesList.length+1}">${type}</td>`;
            headRow2 += `<td class="b-right">Trend</td>`;
        })

        headRow1 += `<td class="b-left b-right" rowspan=2>Reliability</td>`;
        ['Anchor (Days)', 'Port (Days)', 'Total (Days)'].forEach((type) => {
            DatesWeekList.forEach(item => {
                headRow2 += `<td>${item.Date}</td>`;
            });
            headRow1 += `<td class="b-right b-bottom" colspan="${DatesWeekList.length+1}">${type}</td>`;
            headRow2 += `<td class="b-right">Trend</td>`;
        })

        htmlFileContent = htmlFileContent
            .replace('_headerRow1_', `<tr class='b-top'>${headRow1}</tr>`)
            .replace('_headerRow2_', `<tr>${headRow2}</tr>`)

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

            overAllAverage = await treeLogicsController.averageCalculate(avgOfSubTotal)
            const groupedDatesForOverAllTotalList = treeLogicsController.groupByDataList(usRegionWiseOverAllTotalForDay, "Date");
            const groupedDatesForOverAllTotalListForWeek = treeLogicsController.groupByDataList(usRegionWiseOverAllTotalForWeek, "Date");

            let containersOverAllTotalArr = [];
            await groupedDatesForOverAllTotalList.forEach(async item => {
                let sumOfContainer = await treeLogicsController.sumArrayItems(item.list, "Containers");
                overAllUSTotal.push(sumOfContainer);
                containersOverAllTotalArr.push(sumOfContainer);
            });
            overAllUSTotal.push((containersOverAllTotalArr[1] > (containersOverAllTotalArr[0] * (1 + trendPercent))) ? "⬆" : (containersOverAllTotalArr[1] < (containersOverAllTotalArr[0] * (1 - trendPercent))) ? "⬇" : "➡");

            let totalOverAllTotalArr = [];
            await groupedDatesForOverAllTotalList.forEach(async item => {
                let sumOfTotal = await treeLogicsController.sumArrayItems(item.list, "Total")
                overAllUSTotal.push(sumOfTotal);
                totalOverAllTotalArr.push(sumOfTotal);
            });
            overAllUSTotal.push((totalOverAllTotalArr[1] > (totalOverAllTotalArr[0] * (1 + trendPercent))) ? "⬆" : (totalOverAllTotalArr[1] < (totalOverAllTotalArr[0] * (1 - trendPercent))) ? "⬇" : "➡");

            let threeDayAvgOverAllTotalArr = [];
            await groupedDatesForOverAllTotalList.forEach(async item => {
                let sumOfThreeDaysAvg = await treeLogicsController.sumArrayItems(item.list, "ThreeDaysAverage")
                overAllUSTotal.push(sumOfThreeDaysAvg);
                threeDayAvgOverAllTotalArr.push(sumOfThreeDaysAvg);
            });
            overAllUSTotal.push((threeDayAvgOverAllTotalArr[1] > (threeDayAvgOverAllTotalArr[0] * (1 + trendPercent))) ? "⬆" : (threeDayAvgOverAllTotalArr[1] < (threeDayAvgOverAllTotalArr[0] * (1 - trendPercent))) ? "⬇" : "➡");

            overAllUSTotal.push('');
            overAllUSTotal.push(Math.round((overAllAverage + Number.EPSILON) * 100) / 100);
            overAllUSTotal.push(await treeLogicsController.getReliability(overAllAverage));

            let medianDayAnchorOverAllTotalArr = [];
            await groupedDatesForOverAllTotalListForWeek.forEach(async item => {
                let sumOfAnchor = Math.round((await treeLogicsController.averageArrayItems(item.list, "MedianDaysAnchor") + Number.EPSILON) * 100) / 100;
                overAllUSTotal.push(sumOfAnchor !== 0 ? sumOfAnchor : "-");
                medianDayAnchorOverAllTotalArr.push(sumOfAnchor);
            });
            overAllUSTotal.push((medianDayAnchorOverAllTotalArr[1] > (medianDayAnchorOverAllTotalArr[0] * (1 + trendPercent))) ? "⬆" : (medianDayAnchorOverAllTotalArr[1] < (medianDayAnchorOverAllTotalArr[0] * (1 - trendPercent))) ? "⬇" : "➡");

            let medianDaysPortOverAllTotalArr = [];
            await groupedDatesForOverAllTotalListForWeek.forEach(async item => {
                let sumOfMedianDaysPort = Math.round((await treeLogicsController.averageArrayItems(item.list, "MedianDaysPort") + Number.EPSILON) * 100) / 100;
                overAllUSTotal.push(sumOfMedianDaysPort !== 0 ? sumOfMedianDaysPort : "-");
                medianDaysPortOverAllTotalArr.push(sumOfMedianDaysPort);
            });
            overAllUSTotal.push((medianDaysPortOverAllTotalArr[1] > (medianDaysPortOverAllTotalArr[0] * (1 + trendPercent))) ? "⬆" : (medianDaysPortOverAllTotalArr[1] < (medianDaysPortOverAllTotalArr[0] * (1 - trendPercent))) ? "⬇" : "➡");

            let actualTotalOverAllTotalArr = [];
            await groupedDatesForOverAllTotalListForWeek.forEach(async item => {
                let sumOfActualTotal = Math.round((await treeLogicsController.averageArrayItems(item.list, "ActualTotal") + Number.EPSILON) * 100) / 100;
                overAllUSTotal.push(sumOfActualTotal !== 0 ? sumOfActualTotal : "-");
                actualTotalOverAllTotalArr.push(sumOfActualTotal);
            });
            overAllUSTotal.push((actualTotalOverAllTotalArr[1] > (actualTotalOverAllTotalArr[0] * (1 + trendPercent))) ? "⬆" : (actualTotalOverAllTotalArr[1] < (actualTotalOverAllTotalArr[0] * (1 + trendPercent))) ? "⬇" : "➡");
        }
        //--------------------------------------------------------------------------find subtotal of region----------------------------------------------------------------------------------------
        let totalRowsCount = 4; //header 3 rows & last row 1
        let totalRegionDataEndLength = 0;
        let isUsRegion;
        let topBoarderAddedForUs = false;
        let allDatesItems = [];
        let allDatesItemsForWeek = [];
        let mainContentTableRows = '';
        let subTotalAverageOfActualTotalArray = [];
        for (let i = 0; i < portRaterMainJson.length; i++) {
            let regionWiseSubTotal = [];
            let regionWiseSubTotalForWeek = [];

            if (portRaterMainJson[i].Region.split('-')[0] === 'US') {
                if (isOverAllTotalFound) {
                    isOverAllTotalFound = false;
                    // jsonArr.push(overAllUSTotal);
                    topBoarderAddedForUs = true;
                }
                isUsRegion = true;
            } else {
                isUsRegion = false;
            }
            let subTotalRows = '';
            if (portRaterMainJson[i].list.length > 1) {
                totalRowsCount++;
                let subTotalSumOfActualTotal = 0;
                let incNum = 0;
                for (let k = 0; k < portRaterMainJson[i].list.length; k++) {
                    subTotalSumOfActualTotal += portRaterMainJson[i].list[k].COVarActualTotal;
                    incNum += 1;
                    regionWiseSubTotal = [...regionWiseSubTotal, ...portRaterMainJson[i].list[k]["DatesList"]];
                    regionWiseSubTotalForWeek = [...regionWiseSubTotalForWeek, ...portRaterMainJson[i].list[k]["DatesWeekList"]];
                }

                const groupedDatesForSubTotalList = treeLogicsController.groupByDataList(regionWiseSubTotal, "Date");
                const groupedDatesForSubTotalListForWeek = treeLogicsController.groupByDataList(regionWiseSubTotalForWeek, "Date");
                subTotalRows = `<td rowspan=${portRaterMainJson[i].list.length+1}>${portRaterMainJson[i].Region}</td><td  class='b-right' colspan='3'>${portRaterMainJson[i].Region} Subtotal</td>`

                // calculate SubTotal
                let containersSubTotalArr = [];
                await groupedDatesForSubTotalList.forEach(async item => {
                    let sumOfContainer = await treeLogicsController.sumArrayItems(item.list, "Containers");
                    subTotalRows += `<td>${sumOfContainer}</td>`
                    containersSubTotalArr.push(sumOfContainer);
                });
                subTotalRows = await this.appendRowData(containersSubTotalArr, trendPercent, subTotalRows);

                let totalSubTotalArr = [];
                await groupedDatesForSubTotalList.forEach(async item => {
                    let sumOfTotal = await treeLogicsController.sumArrayItems(item.list, "Total")
                    subTotalRows += `<td>${sumOfTotal}</td>`
                    totalSubTotalArr.push(sumOfTotal);
                });

                subTotalRows = await this.appendRowData(totalSubTotalArr, trendPercent, subTotalRows);

                let threeDayAvgSubTotalArr = [];
                await groupedDatesForSubTotalList.forEach(async item => {
                    let sumOfThreeDaysAvg = await treeLogicsController.sumArrayItems(item.list, "ThreeDaysAverage");
                    subTotalRows += `<td>${sumOfThreeDaysAvg}</td>`;
                    threeDayAvgSubTotalArr.push(sumOfThreeDaysAvg);
                });
                subTotalRows = await this.appendRowData(threeDayAvgSubTotalArr, trendPercent, subTotalRows);

                const subTotalAverageOfActualTotal = subTotalSumOfActualTotal / incNum;
                subTotalAverageOfActualTotalArray.push(subTotalAverageOfActualTotal)
                const tempValue = await treeLogicsController.getReliability(subTotalAverageOfActualTotal)
                subTotalRows += `<td style="background: #${await treeLogicsController.getColorForReliability(tempValue)};"></td>`;
                let medianDayAnchorSubTotalArr = [];
                await groupedDatesForSubTotalListForWeek.forEach(async item => {
                    let sumOfAnchor = Math.round((await treeLogicsController.averageArrayItems(item.list, "MedianDaysAnchor") + Number.EPSILON) * 100) / 100;
                    subTotalRows += `<td>${(sumOfAnchor !== 0 ? sumOfAnchor : "-")}</td>`;
                    medianDayAnchorSubTotalArr.push(sumOfAnchor);
                });
                subTotalRows = await this.appendRowData(medianDayAnchorSubTotalArr, trendPercent, subTotalRows);

                let medianDaysPortSubTotalArr = [];
                await groupedDatesForSubTotalListForWeek.forEach(async item => {
                    let sumOfMedianDaysPort = Math.round((await treeLogicsController.averageArrayItems(item.list, "MedianDaysPort") + Number.EPSILON) * 100) / 100;
                    subTotalRows += `<td>${(sumOfMedianDaysPort !== 0 ? sumOfMedianDaysPort : "-")}</td>`;
                    medianDaysPortSubTotalArr.push(sumOfMedianDaysPort);
                });
                subTotalRows = await this.appendRowData(medianDaysPortSubTotalArr, trendPercent, subTotalRows);

                let actualTotalSubTotalArr = [];
                await groupedDatesForSubTotalListForWeek.forEach(async item => {
                    let sumOfActualTotal = Math.round((await treeLogicsController.averageArrayItems(item.list, "ActualTotal") + Number.EPSILON) * 100) / 100;
                    subTotalRows += `<td>${(sumOfActualTotal || "-")}</td>`;
                    actualTotalSubTotalArr.push(sumOfActualTotal);
                });
                subTotalRows = await this.appendRowData(actualTotalSubTotalArr, trendPercent, subTotalRows);

                mainContentTableRows += `<tr class='yellow-bg double-border b-left b-right b-top'>${subTotalRows}</tr>`;
            } else {
                subTotalAverageOfActualTotalArray.push(portRaterMainJson[i].list[0].COVarActualTotal)
            }

            //-------------------------------------------------------------------------------single port calculations-----------------------------------------------------------------------------------------
            for (let j = 0; j < portRaterMainJson[i].list.length; j++) {
                totalRowsCount++;
                allDatesItems = [...allDatesItems, ...portRaterMainJson[i].list[j]["DatesList"]];
                allDatesItemsForWeek = [...allDatesItemsForWeek, ...portRaterMainJson[i].list[j]["DatesWeekList"]];
                // 
                let valueRow = `
                    ${subTotalRows ? '' : `<td>${portRaterMainJson[i].list[j]["Region"]}</td>`}
                    <td>${portRaterMainJson[i].list[j]["Country"]}</td>
                    <td>${portRaterMainJson[i].list[j]["PortName"]}</td>
                    <td class='b-right'>${portRaterMainJson[i].list[j]["LoCode"]}</td>
                `;

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

                portRaterMainJson[i].list[j]["DatesList"].forEach(item => {
                    valueRow += `<td>${item.Containers || "-"}</td>`;
                });
                valueRow += `<td class='b-right ${await this.getArrowClass(ContainersTrend)}'>${ContainersTrend}</td>`;

                portRaterMainJson[i].list[j]["DatesList"].forEach(item => {
                    valueRow += `<td>${item.Total || "-"}</td>`;
                });
                valueRow += `<td class='b-right ${await this.getArrowClass(TotalTrend)}'>${TotalTrend}</td>`;

                portRaterMainJson[i].list[j]["DatesList"].forEach(item => {
                    valueRow += `<td>${item.ThreeDaysAverage || "-"}</td>`;
                });
                valueRow += `<td class='b-right ${await this.getArrowClass(ThreeDaysAverageTrend)}'>${ThreeDaysAverageTrend}</td>`;

                valueRow += `<td class='b-left b-right' style="background: #${await treeLogicsController.getColorForReliability(portRaterMainJson[i].list[j].reliability)};"></td>`;

                portRaterMainJson[i].list[j]["DatesWeekList"].forEach(item => {
                    console.log("item.MedianDaysAnchor => ", item.MedianDaysAnchor);
                    valueRow += `<td>${(item.MedianDaysAnchor ? Number(item.MedianDaysAnchor).toFixed(2) : "-")}</td>`;
                });
                valueRow += `<td class='b-right ${await this.getArrowClass(MedianDaysAnchorTrend)}'>${MedianDaysAnchorTrend}</td>`;

                portRaterMainJson[i].list[j]["DatesWeekList"].forEach(item => {
                    valueRow += `<td>${(item.MedianDaysPort ? Number(item.MedianDaysPort).toFixed(2) : "-")}</td>`;
                });
                valueRow += `<td class='b-right ${await this.getArrowClass(MedianDaysPortTrend)}'>${MedianDaysPortTrend}</td>`;


                portRaterMainJson[i].list[j]["DatesWeekList"].forEach(item => {
                    valueRow += `<td>${(item.ActualTotal ? Number(item.ActualTotal).toFixed(2) : "-")}</td>`;
                });
                valueRow += `<td class='b-right ${await this.getArrowClass(ActualTotalTrend)}'>${ActualTotalTrend}</td>`;
                let tempClass = '';
                if (portRaterMainJson[i].list.length === 1) {
                    tempClass = 'border-all';
                } else if (j + 1 === portRaterMainJson[i].list.length) {
                    tempClass = 'b-bottom';
                }
                mainContentTableRows += `<tr class='b-left b-right ${tempClass}'>${valueRow}</tr>`;
            }
        };

        htmlFileContent = htmlFileContent.replace('_mainContentTableRows_', mainContentTableRows);

        // prints last row
        const groupedDatesList = treeLogicsController.groupByDataList(allDatesItems, "Date");
        const groupedDatesListForWeek = treeLogicsController.groupByDataList(allDatesItemsForWeek, "Date");
        let lastRow = '<td class="bold-font" colspan="4">Overall</td>';

        let containersArr = [];
        await groupedDatesList.forEach(async item => {
            let sumOfContainer = await treeLogicsController.sumArrayItems(item.list, "Containers");
            lastRow += `<td class="bold-font">${sumOfContainer}</td>`;
            containersArr.push(sumOfContainer);
        });

        lastRow = await this.appendRowData(containersArr, trendPercent, lastRow);

        let totalArr = [];
        await groupedDatesList.forEach(async item => {
            let sumOfTotal = await treeLogicsController.sumArrayItems(item.list, "Total")
            lastRow += `<td class="bold-font">${sumOfTotal}</td>`;
            totalArr.push(sumOfTotal);
        });
        lastRow = await this.appendRowData(totalArr, trendPercent, lastRow);

        let threeDayAvgArr = [];
        await groupedDatesList.forEach(async item => {
            let sumOfThreeDaysAvg = await treeLogicsController.sumArrayItems(item.list, "ThreeDaysAverage")
            lastRow += `<td class="bold-font">${sumOfThreeDaysAvg}</td>`;
            threeDayAvgArr.push(sumOfThreeDaysAvg);
        });
        lastRow = await this.appendRowData(threeDayAvgArr, trendPercent, lastRow);

        const reliability = Math.round((await treeLogicsController.averageCalculate(subTotalAverageOfActualTotalArray) + Number.EPSILON) * 100) / 100;
        const reliabilityValue = await treeLogicsController.getReliability(reliability);
        lastRow += `<td class='b-right' style="background: #${await treeLogicsController.getColorForReliability(reliabilityValue)};"></td>`;

        let medianDayAnchorArr = [];
        await groupedDatesListForWeek.forEach(async item => {
            let sumOfAnchor = Math.round((await treeLogicsController.averageArrayItems(item.list, "MedianDaysAnchor") + Number.EPSILON) * 100) / 100;
            lastRow += `<td>${sumOfAnchor || "-"}</td>`;
            medianDayAnchorArr.push(sumOfAnchor);
        });

        lastRow = await this.appendRowData(medianDayAnchorArr, trendPercent, lastRow);

        let medianDaysPortArr = [];
        await groupedDatesListForWeek.forEach(async item => {
            let sumOfMedianDaysPort = Math.round((await treeLogicsController.averageArrayItems(item.list, "MedianDaysPort") + Number.EPSILON) * 100) / 100;
            lastRow += `<td>${sumOfMedianDaysPort || "-"}</td>`;
            medianDaysPortArr.push(sumOfMedianDaysPort);
        });

        lastRow = await this.appendRowData(medianDaysPortArr, trendPercent, lastRow);

        let actualTotalArr = [];
        await groupedDatesListForWeek.forEach(async item => {
            let sumOfActualTotal = Math.round((await treeLogicsController.averageArrayItems(item.list, "ActualTotal") + Number.EPSILON) * 100) / 100;
            lastRow += `<td>${sumOfActualTotal || "-"}</td>`;
            actualTotalArr.push(sumOfActualTotal);
        });
        lastRow = await this.appendRowData(actualTotalArr, trendPercent, lastRow);

        htmlFileContent = htmlFileContent
            .replace('_lastRow_', `<tr class='border-all'>${lastRow}</tr>`)
            .replace('_totalRowsCount_', totalRowsCount)
            .replace(/[\r\n]/g, "");

        return htmlFileContent;
    }

    static async getArrowClass(char) {
        let className = '';
        switch (char) {
            case "⬆":
                className = 'green-bg'
                break;
            case "⬇":
                className = 'red-bg'
                break;

            default:
                className = '';
                break;
        }
        return className;
    }

    static async appendRowData(columnDataArr, trendPercent, lastRow) {
        if (columnDataArr[1] > (columnDataArr[0] * (1 + trendPercent))) {
            lastRow += `<td class='green-bg b-right'>⬆</td>`;
        } else {
            if (columnDataArr[1] < (columnDataArr[0] * (1 + trendPercent))) {
                lastRow += `<td class='red-bg b-right'>⬇</td>`;
            } else {
                lastRow += `<td class='b-right'>➡</td>`;
            }
        }
        return lastRow;
    }

    //=================================Nearshore summary========================================
    static async getHTMLReportFromInputJSON(inputMainJson) {
        let htmlData;
        inputMainJson.nearshoreMainJson['apiUrl'] = config.apiUrl;
        await ejs.renderFile(path.join(__dirname, '../../../views/nearshoresummaryHC.ejs'), inputMainJson.nearshoreMainJson, {}, (err, data) => {
            if (err) console.log(err)
            htmlData = data;
        });
        return htmlData;
    }

    static networkComputationLoadBasedPerSite(singleSiteData, noOfLoads){
      const loadBasedOnSite = []
      for (const siteData of singleSiteData) {
        const totalPer = parseFloat(siteData.totalPer);
        const numberOfLoads = siteData.numberofLoads;
        const loadValue = (totalPer / 100) * numberOfLoads;
          loadBasedOnSite.push({
              siteName: siteData.siteName,
              load: Math.ceil(loadValue)
          })
      }
      let results= []
      for (const element1 of singleSiteData) {
        for (const element2 of loadBasedOnSite) {
          if (element1.siteName === element2.siteName) {
            results.push({
              day1Per: (element1.day1Per.replace('%', '')) * element2.load / 100,
              day2Per: (element1.day2Per.replace('%', '')) * element2.load / 100,
              day3Per: (element1.day3Per.replace('%', '')) * element2.load / 100,
              day4Per: (element1.day4Per.replace('%', '') ) * element2.load / 100,
              day5Per: (element1.day5Per.replace('%', '')) * element2.load / 100,
              day6Per: (element1.day6Per.replace('%', '') / 100) * element2.load / 100,
              moreThan6DayPer: (element1.moreThan6DayPer.replace('%', '') ) * element2.load / 100,
              uptoInputSlPkgSum: (element1.uptoInputSlPkgSum.replace('%', '') ) * element2.load / 100,
              outOfInputSlPkgSum: (element1.outOfInputSlPkgSum.replace('%', '') ) * element2.load / 100,
              gt6DaysSLPkgSum: (element1.gt6DaysSLPkgSum.replace('%', '') ) * element2.load / 100,
            });
          }
        }
      }
      const summedObject = {};
      for (const element of results) {
        for (const key in element) {
          if (summedObject[key]) {
            summedObject[key] += element[key];
          } else {
            summedObject[key] = element[key];
          }
        }
      }
      for (const key in summedObject) {
        summedObject[key] /= noOfLoads;
      }
      return summedObject;
      
    }

    static calculateAverage(data) {
        const dayCount = 7;
        const average = {};
    
        for (let day = 1; day <= dayCount; day++) {
            const sum = data.reduce((acc, site) => acc + (site[Object.keys(site)[0]][day] || 0), 0);
            average[day] = sum / data.length;
        }
    
        return average;
    }
    
}