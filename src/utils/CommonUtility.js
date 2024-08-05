import {
  _
} from 'lodash';
import moment from 'moment';
import mongoose from 'mongoose';
import treeLogicsController from '../app/controller/users/treeLogicsNew.controller';

export default class CommonUtility {
  static isUndefinedOrNull(value) {
    return value === undefined || value === null;
  }
  static isValidString(strValue) {
    return !this.isUndefinedOrNull(strValue) && strValue !== '';
  }

  static isEmptyString(strValue) {
    return !this.isUndefinedOrNull(strValue) && strValue === '';
  }

  static isValidObject(objDetail) {
    return !this.isUndefinedOrNull(objDetail) && Object.keys(objDetail).length > 0
  }

  static removeEmptyCharFromArray(sheetDataArr) {
    sheetDataArr.forEach((dataObj) => {
      Object.keys(dataObj).forEach((key) => {
        if (key.toLowerCase().includes('empty')) {
          delete dataObj[key]
        } else if (key.includes(' ')) {
          const cellValue = dataObj[key];
          delete dataObj[key];
          dataObj[key.replace(/ /g, '')] = cellValue;
        }
      })
    });
    return sheetDataArr;
  }

  static convertLowerCasekey(sheetDataArr) {
    sheetDataArr.forEach((dataObj) => {
      Object.keys(dataObj).forEach((key) => {
        const cellValue = dataObj[key];
        delete dataObj[key];
        dataObj[key.replace(/ /g, '')] = cellValue;
      })
    });
    return sheetDataArr;
  }

  static isEqualArray(arr1, arr2) {
    const tempArr1 = JSON.parse(JSON.stringify(arr1));
    const tempArr2 = JSON.parse(JSON.stringify(arr2));
    let idx1 = tempArr1.indexOf('SheetName'),
      idx2 = tempArr2.indexOf('SheetName');
    if (idx1 >= 0) tempArr1.splice(idx1, 1);
    if (idx2 >= 0) tempArr2.splice(idx2, 1);
    const temp = this.getMissedFieldsFromArrays(tempArr1, tempArr2);
    return temp.length === 0 && tempArr1.length >= tempArr2.length;
  }

  static isSubsetOfArrays(mainArr, subArry) {
    const diffValues = [];
    for (let ele of mainArr) {
      if (!subArry.includes(ele)) {
        diffValues.push(ele)
      }
    }
    return diffValues.length > 0 ? true : false;
  }

  static getMissedFieldsFromArrays(mainArr, subContainArr) {

    const tempMissedFields = [];
    let newSubContainArr = JSON.parse(JSON.stringify(subContainArr));
    newSubContainArr = newSubContainArr.map((x) => x.toLowerCase());
    let newmainArr = JSON.parse(JSON.stringify(mainArr));
    newmainArr = newmainArr.map((x) => x.toLowerCase());
    newSubContainArr.forEach((val, idx) => {
      if (!newmainArr.includes(val)) {
        tempMissedFields.push(subContainArr[idx]);
      }
    });
    // newmainArr.forEach((val, idx) => {
    //   if(!newSubContainArr.includes(val)) {
    //     tempMissedFields.push(mainArr[idx]);
    //   }
    // });
    let idx = tempMissedFields.indexOf('SheetName');
    if (idx >= 0) tempMissedFields.splice(idx, 1)
    return tempMissedFields;
  }

  static getMissedUniqueKeys(headersRow, UniqueKeys) {
    const missedKeys = [];
    UniqueKeys.forEach((key) => {
      if (!headersRow.includes(key)) {
        missedKeys.push(key);
      }
    })
    return missedKeys;
  }

  static removeDuplicateFromArray(arrayList) {
    const temp = [];
    arrayList.map((x) => {
      if (x._id) delete x._id;
      return x
    });
    const uniqueArray = [...new Set(arrayList.map((a) => JSON.stringify(a)))].map((a) => JSON.parse(a));
    return uniqueArray;
  }
  
  static appendDataArray(arrayList, keys) {
    arrayList.map((x) => {
      if (x._id) delete x._id;
      return x
    });
    if (Array.isArray(keys) && keys.length > 0) {
      const seen = new Map();
      for (const obj of arrayList) {
        const key = keys.map((key) => obj[key]).join(',');
        seen.set(key, obj);
      }
      arrayList = Array.from(seen.values())
    }
    const uniqueArray = [...new Set(arrayList.map((a) => JSON.stringify(a)))].map((a) => JSON.parse(a));
    uniqueArray.map((x) => {
      x._id = mongoose.Types.ObjectId();
      return x
    });
    return uniqueArray;
  }

  static isSubsetOfObject(obj1, obj2) {
    return _.isMatch(obj1, obj2);
  }

  static getDuplicatedByKeys(arry, keys) {
    if (typeof keys == "string") {
      keys = keys.split(',');
    }
    arry.map((x) => {
      if (x._id) delete x._id;
      return x
    });

    return _.intersectionBy(arry, arry, keys.join(','));
  }

  static getDuplicatedByKeys1(newArry, keys = []) {
    if (typeof keys == "string") {
      keys = keys.split(',');
    }
    const arry = new Array(newArry);
    arry.map(x => {
      if (x._id) delete x._id;
      return x;
    });

    // const tempArrv = [],
    //       duplicatedArr = [];
    // let tempObj = {};
    // if(keys.length > 0) {
    //   arry.forEach((data) => {
    //     tempObj = {};
    //     keys.forEach(key => tempObj[key] = data[key]);
    //     if (tempArrv.indexOf(JSON.stringify(tempObj)) > -1) {
    //       duplicatedArr.push(data);
    //     } else {
    //       tempArrv.push(JSON.stringify(tempObj));
    //     }
    //   });
    // }
    // return ;
    const groupedData = _.groupBy(newArry, "SheetName");
    const duplicateArr = [];
    for (const keyOfData in groupedData) {
      duplicateArr.push(this.findDuplicateValuesFromArray(groupedData[keyOfData], keys));
    }
    return duplicateArr.flat();
  }

  static findDuplicateValuesFromArray(orgArray, arrayOfKeys) {
    const arr3 = [];
    arrayOfKeys.some((key) => {
      const values = orgArray.flatMap((obj) => obj[key]);
      values.some((obj, idx) => {
        if (values.indexOf(obj) !== idx) {
          arr3.push(orgArray.filter((item) => item[key] === obj));
        }
      });
    });
    return arr3;
  };


  static getDuplicatedInArray(arry) {
    const newTempArr = JSON.parse(JSON.stringify(arry));
    const JSArr = [];
    newTempArr.map(item => {
      if (item._id) delete item._id;
      JSArr.push(JSON.stringify(item));
      return JSON.stringify;
    });
    const duplicatedArray = JSArr.filter((item, index) => JSArr.indexOf(item) !== index)
    return duplicatedArray.map(JSON.parse);
  }

  static convertNumberToDate(serial, format, currentFormat = "") {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const fractional_day = serial - Math.floor(serial) + 0.0000001;
    let total_seconds = Math.floor(86400 * fractional_day);
    const seconds = total_seconds % 60;
    total_seconds -= seconds;
    const convertDateToFormat = moment(`${date_info.getDate()}/${date_info.getMonth() + 1}/${date_info.getFullYear()}`, "D/M/YYYY").format(currentFormat);
    const dateDemo = this.getRealDate(convertDateToFormat, currentFormat);

    // const dateDemo = this.getRealDate(`${date_info.getDate()}/${date_info.getMonth() + 1}/${date_info.getFullYear()}`, "D/M/YYYY", currentFormat);
    // const newDate = new Date(dateDemo)
    // const date = moment(newDate).format(format ? format : 'M/D/YY');
    // return this.getPortFormattedDate(date);
    return dateDemo;
  }

  static validateDate(date, currentFormat) {
    const dateSplit = date.split("/");
    const formatSplit = currentFormat.split("/");
    if (dateSplit.length !== 3) return "InValidDateFormat";
    for (let i = 0; i < formatSplit.length; i++) {
      if (formatSplit[i] === "DD" || formatSplit[i] === "D") {
        if (Number(dateSplit[i]) > 31 || Number(dateSplit[i]) < 1) return "InValidDateFormat";
      }
      if (formatSplit[i] === "MM" || formatSplit[i] === "M") {
        if (Number(dateSplit[i]) > 12 || Number(dateSplit[i]) < 1) return "InValidDateFormat";
      }
      if (formatSplit[i] === "YYYY" || formatSplit[i] === "YY") {
        if (dateSplit[i].length !== 2 && dateSplit[i].length !== 4) return "InValidDateFormat";
      }
    }
    return;
  };

  static getPortFormattedDate(date) {
    const dateArr = date.split("/");
    return dateArr[0] + "/" + dateArr[1] + "/" + dateArr[2];
  }

  static getRealDate(dateString = "", format) {
    dateString = dateString.replace(/['"]+/g, '');
    const validateDate = CommonUtility.validateDate(dateString, format);
    const returnStatement = validateDate === "InValidDateFormat" ? validateDate : moment(dateString, format).format('M/D/YYYY');
    return returnStatement;
  }

  static formatPortDate(date, returnDateFormat = "", currentFormat = "") {
    let realDate;
    if (!isNaN(date))
      realDate = this.convertNumberToDate(date, returnDateFormat, currentFormat)
    else
      realDate = this.getRealDate(date, currentFormat);

    if (realDate === "InValidDateFormat") return realDate;

    const newDate = new Date(realDate);
    const returnDate = moment(newDate).format(returnDateFormat ? returnDateFormat : 'M/D/YY');
    return this.getPortFormattedDate(returnDate);
    // }
  }

  static search(nameKey, myArray) {
    for (let i = 0; i < myArray.length; i++) {
      if (myArray[i].columnName === nameKey) return i;
    }
  }

  // const dayFirstFormat = ["DD/MM/YYYY", "D/M/YYYY", "D/M/YY", "DD/M/YYYY", "DD/M/YY", "D/MM/YYYY", "D/MM/YY", "MM/DD/YYYY", "M/D/YYYY", "M/D/YY", "M/DD/YYYY", "M/DD/YY", "MM/D/YYYY", "MM/D/YY"];
}