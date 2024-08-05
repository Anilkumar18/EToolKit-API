import OrganizationModel from '../../../db/models/organization.model';
import * as organizationQueries from "../../../db/queries/organization.query"
import {
    serverLog
} from '../../../utils/logger';
import * as excelDataQueries from "../../../db/queries/excelData.query";

export default class adminOrganizationController {

    static async createOrganization(req, res) {
        try {
            const {
                companyName,
                geographicScope,
                overAllRevenue,
                city,
                eCommerceRevenuePercentage,
                traditionalRetailRevenuePercentage,
                eCommerceUnit,
                traditionalRetailUnit,
                salesChannelUtilized,
                iconLogo,
                metaData
            } = req.body;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`)

            const organization = new OrganizationModel({
                companyName,
                geographicScope,
                overAllRevenue,
                city,
                metaData,
                eCommerceRevenuePercentage,
                traditionalRetailRevenuePercentage,
                eCommerceUnit,
                traditionalRetailUnit,
                salesChannelUtilized,
                iconLogo,
                createdBy: req.headers.id,
                updatedBy: req.headers.id
            });

            await organizationQueries.saveData(organization);

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}] [loggedInUser : ${req.headers.id}], {response : Organization named "${companyName}" is added successfully!}`)

            res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.organizationCreated, [], []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async updateOrganization(req, res) {
        try {

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request to update {organizationId : ${req.params.id}} request_payload : ${JSON.stringify(req.body)}}`)

            let organization = await organizationQueries.findById(req.params.id);
            let newMetaData = [];

            if (organization.metaData && organization.metaData.length > 0) {
                for (const metaData of organization.metaData) {
                    if (metaData.variableName == 'state') {
                        metaData["value"] = req.body.state ? req.body.state : metaData.value
                    }
                    if (metaData.variableName == 'products') {
                        metaData["value"] = req.body.products ? req.body.products : metaData.value
                    }
                    newMetaData.push(metaData);
                }
            } else {
                const productMeta = {
                    variableName: "products",
                    fileId: "636b96e457173a4c28ce69da",
                    fileName: "Products",
                    value: req.body.products
                }
                const stateMeta = {
                    variableName: "state",
                    fileId: "636b987d57173a4c28d0a387",
                    fileName: "States",
                    value: req.body.state
                }
                newMetaData.push(productMeta)
                newMetaData.push(stateMeta)
            }

            await organizationQueries.findByIdAndUpdate(req.params.id, {
                companyName: req.body.companyName ? req.body.companyName : organization.companyName,
                geographicScope: req.body.geographicScope ? req.body.geographicScope : organization.geographicScope,
                overAllRevenue: req.body.overAllRevenue ? req.body.overAllRevenue : organization.overAllRevenue,
                city: req.body.city ? req.body.city : organization.city,
                metaData: newMetaData,
                eCommerceRevenuePercentage: req.body.eCommerceRevenuePercentage ? req.body.eCommerceRevenuePercentage : organization.eCommerceRevenuePercentage,
                traditionalRetailRevenuePercentage: req.body.traditionalRetailRevenuePercentage ? req.body.traditionalRetailRevenuePercentage : organization.traditionalRetailRevenuePercentage,
                eCommerceUnit: req.body.eCommerceUnit ? req.body.eCommerceUnit : organization.eCommerceUnit,
                traditionalRetailUnit: req.body.traditionalRetailUnit ? req.body.traditionalRetailUnit : organization.traditionalRetailUnit,
                salesChannelUtilized: req.body.salesChannelUtilized ? req.body.salesChannelUtilized : organization.salesChannelUtilized,
                iconLogo: req.body.iconLogo ? req.body.iconLogo : organization.iconLogo,
                updatedBy: req.headers.id
            }, {
                new: true
            });

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : Organization having name "${req.body.companyName}" is updated successfully!}`)

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.updateOrganization, [], []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async organizationList(req, res) {
        try {
            const organizationList = await organizationQueries.findOrganizations({
                isDeleted: false
            });

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(organizationList)}}`);

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.organizationGet, organizationList, []));

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async organizationDetail(req, res) {
        try {
            const organizationDetails = await organizationQueries.findByIdAndPopulate(req.params.id);
            const newOrgDetails = JSON.parse(JSON.stringify(organizationDetails));

            const getFileDetails = await adminOrganizationController.getDetails(newOrgDetails)

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(getFileDetails)}}`);

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.organizationGet, getFileDetails, []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    // this will also used in user organization details api
    static async getDetails(OrgDetails) {
        serverLog.info(`[getDetails], { request : ${JSON.stringify(OrgDetails)} }`);
        const newOrgDetails = new Object(OrgDetails);
        for (const metaData of newOrgDetails.metaData) {
            let data;
            if (metaData.variableName == 'products') {
                data = await excelDataQueries.findOne({ fileName: metaData.fileName }, {
                    _id: 1,
                    'fileData.Category': 1,
                    'fileData.Name': 1,
                    'fileData._id': 1
                });
            }

            if (metaData.variableName == 'state') {
                data = await excelDataQueries.findOne({ fileName: metaData.fileName }, {
                    _id: 1,
                    'fileData.Region': 1,
                    'fileData.StateName': 1,
                    'fileData._id': 1
                });
            }
            let result = await data.fileData.map(obj => {

                const isActive = metaData.value.includes(String(obj._id));
                return {
                    ...obj,
                    isSelected: isActive
                }
            })
            newOrgDetails[metaData.variableName] = result;
        }
        delete newOrgDetails.metaData;

        serverLog.info(`[getDetails], { return : ${JSON.stringify(newOrgDetails)}}`);
        return newOrgDetails;
    }
}