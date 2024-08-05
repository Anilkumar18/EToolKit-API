import OrganizationModel from "../models/organization.model";

export const saveData = (data) =>
    OrganizationModel.create(data);

export const findById = (id) =>
    OrganizationModel.findById(id);

export const findByIdAndUpdate = (id, data, options) =>
    OrganizationModel.findByIdAndUpdate(id, data, options);

export const findAll = (condition) =>
    OrganizationModel.find(condition)
        .populate({
            model: 'users',
            path: "createdBy",
            select: "firstName lastName"
        })
        .populate({
            model: 'users',
            path: "updatedBy",
            select: "firstName lastName"
        });


export const findOrganizations = (condition) =>
    OrganizationModel.aggregate([{
        $match: condition
    },
    {
        '$lookup': {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy'
        }
    },
    {
        $unwind: "$createdBy"
    },
    {
        '$lookup': {
            from: 'users',
            localField: 'updatedBy',
            foreignField: '_id',
            as: 'updatedBy'
        }
    },
    {
        $unwind: "$updatedBy"
    },
    {
        $project: {
            _id: 1,
            "companyName": 1,
            "overAllRevenue": 1,
            "iconLogo": 1,
            "eCommerceRevenuePercentage": 1,
            "traditionalRetailRevenuePercentage": 1,
            "eCommerceUnit": 1,
            "traditionalRetailUnit": 1,
            "salesChannelUtilized": 1,
            "createdBy.firstName": 1,
            "createdBy.lastName": 1,
            "updatedBy.firstName": 1,
            "updatedBy.lastName": 1,
            "metaData": 1,
            "createdAt": 1,
            "updatedAt": 1
        }
    }
    ])


export const findByIdAndPopulate = (id) =>
    OrganizationModel.findById(id)
        .populate({
            model: 'users',
            path: "createdBy",
            select: "firstName lastName"
        })
        .populate({
            model: 'users',
            path: "updatedBy",
            select: "firstName lastName"
        })