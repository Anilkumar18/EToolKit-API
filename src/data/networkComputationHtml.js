const networkComputationHTML = `<html>
<head>
<style>
.highcharts-figure,
.highcharts-data-table table {
  width: 100%;
}

.highcharts-data-table table {
  font-family: Verdana, sans-serif;
  border-collapse: collapse;
  border: 1px solid #ebebeb;
  margin: 10px auto;
  text-align: center;
  width: 100%;
  max-width: 500px;
}

.highcharts-data-table caption {
  padding: 1em 0;
  font-size: 1.2em;
  color: #555;
}

.highcharts-data-table th {
  font-weight: 600;
  padding: 0.5em;
}

.highcharts-data-table td,
.highcharts-data-table th,
.highcharts-data-table caption {
  padding: 0.5em;
}

.highcharts-data-table thead tr,
.highcharts-data-table tr:nth-child(even) {
  background: #f8f8f8;
}

.highcharts-data-table tr:hover {
  background: #f1f7ff;
}

.report-div-html {

height: 100%;
background-color: #fff;
}
.report-div-html tbody {
background-color: #ffffff;
}
.report-div-html .networkComputationReportTbl tr {
mso-height-source: auto;
}
.report-div-html .networkComputationReportTbl col {
mso-width-source: auto;
}
.report-div-html .networkComputationReportTbl br {
mso-data-placement: same-cell;
}
.report-div-html .networkComputationReportTbl .bt-rm {
border-top: none !important;
}
.report-div-html .networkComputationReportTbl .bl-rm {
border-left: none !important;
}
.report-div-html .networkComputationReportTbl .br-rm {
border-right: none !important;
}
.report-div-html .networkComputationReportTbl .bb-rm {
border-bottom: none !important;
}
.report-div-html .networkComputationReportTbl .green-bg {
background: #b4de86;
}
.report-div-html .networkComputationReportTbl .border-all {
border: 1.5pt solid windowtext !important;
}
.report-div-html .networkComputationReportTbl .border-rm {
border: none !important;
}
.report-div-html .networkComputationReportTbl .b-bottom {
border-bottom: 1.5pt solid windowtext !important;
}
.report-div-html .networkComputationReportTbl .b-top {
border-top: 1.5pt solid windowtext !important;
}
.report-div-html .networkComputationReportTbl .b-left {
border-left: 1.5pt solid windowtext !important;
}
.report-div-html .networkComputationReportTbl .b-right {
border-right: 1.5pt solid windowtext !important;
}
.report-div-html .networkComputationReportTbl .style0 {
mso-number-format: General;
text-align: general;
vertical-align: bottom;
white-space: nowrap;
mso-rotate: 0;
mso-background-source: auto;
mso-pattern: auto;
color: windowtext;
font-size: 12pt;
font-weight: 400;
font-style: normal;
text-decoration: none;
font-family: Calibri;
mso-generic-font-family: auto;
mso-font-charset: 0;
border: none;
mso-protection: locked visible;
mso-style-name: Normal;
mso-style-id: 0;
}
.report-div-html .networkComputationReportTbl td {
mso-style-parent: style0;
padding-top: 1px;
padding-right: 1px;
padding-left: 1px;
mso-ignore: padding;
color: windowtext;
font-size: 12pt;
font-weight: 400;
font-style: normal;
text-decoration: none;
font-family: Calibri;
mso-generic-font-family: auto;
mso-font-charset: 0;
mso-number-format: General;
text-align: general;
vertical-align: bottom;
border: none;
mso-background-source: auto;
mso-pattern: auto;
mso-protection: locked visible;
white-space: nowrap;
mso-rotate: 0;
}
.report-div-html .networkComputationReportTbl .xl65 {
mso-style-parent: style0;
font-size: 26pt;
font-weight: 700;
text-align: left;
vertical-align: middle;
border: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl66 {
mso-style-parent: style0;
text-align: center;
vertical-align: middle;
border: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl67 {
mso-style-parent: style0;
mso-number-format: "\\$0.00";
text-align: center;
vertical-align: middle;
border: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl68 {
mso-style-parent: style0;
font-size: 14pt;
font-weight: 700;
text-align: center;
vertical-align: middle;
border: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl69 {
mso-style-parent: style0;
text-align: center;
vertical-align: middle;
border-top: 0.5pt dashed windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 1.5pt solid windowtext;
border-left: 1.5pt solid windowtext;
}
.report-div-html .networkComputationReportTbl .xl70 {
mso-style-parent: style0;
text-align: center;
vertical-align: middle;
border-top: 0.5pt dashed windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 1.5pt solid windowtext;
border-left: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl71 {
mso-style-parent: style0;
mso-number-format: "\\$0.00";
text-align: center;
vertical-align: middle;
border-top: 0.5pt dashed windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 1.5pt solid windowtext;
border-left: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl72 {
mso-style-parent: style0;
mso-number-format: "\\$0.00";
text-align: center;
vertical-align: middle;
border-top: 0.5pt dashed windowtext;
border-right: 1.5pt solid windowtext;
border-bottom: 1.5pt solid windowtext;
border-left: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl73 {
mso-style-parent: style0;
text-align: center;
vertical-align: middle;
border-top: 0.5pt dashed windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 1.5pt solid windowtext;
border-left: 0.5pt dashed windowtext;
background: #ffff33;
mso-pattern: black none;
}
.report-div-html .networkComputationReportTbl .xl74 {
mso-style-parent: style0;
text-align: center;
vertical-align: middle;
border-top: 0.5pt dashed windowtext;
border-right: 1.5pt solid windowtext;
border-bottom: 1.5pt solid windowtext;
border-left: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl75 {
mso-style-parent: style0;
font-weight: 700;
text-align: center;
vertical-align: middle;
border: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl76 {
mso-style-parent: style0;
font-weight: 700;
text-align: center;
vertical-align: middle;
border-top: 1.5pt solid windowtext;
border-right: 1.5pt solid windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 1.5pt solid windowtext;
}
.report-div-html .networkComputationReportTbl .xl77 {
mso-style-parent: style0;
mso-number-format: "\\$0.00";
text-align: center;
vertical-align: middle;
border-top: 0.5pt dashed windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 1.5pt solid windowtext;
border-left: 1.5pt solid windowtext;
}
.report-div-html .networkComputationReportTbl .xl78 {
mso-style-parent: style0;
text-align: center;
vertical-align: middle;
border-top: 0.5pt dashed windowtext;
border-right: 1.5pt solid windowtext;
border-bottom: 1.5pt solid windowtext;
border-left: 1.5pt solid windowtext;
}
.report-div-html .networkComputationReportTbl .xl79 {
mso-style-parent: style0;
text-align: center;
vertical-align: middle;
border-top: 0.5pt dashed windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 1.5pt solid windowtext;
border-left: 1.5pt solid windowtext;
mso-pattern: black none;
}
.report-div-html .networkComputationReportTbl .xl80 {
mso-style-parent: style0;
mso-number-format: "\\$0.00";
text-align: center;
vertical-align: middle;
border-top: 0.5pt dashed windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 1.5pt solid windowtext;
}
.report-div-html .networkComputationReportTbl .xl81 {
mso-style-parent: style0;
text-align: center;
vertical-align: middle;
border-top: 0.5pt dashed windowtext;
border-right: 1.5pt solid windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 1.5pt solid windowtext;
}
.report-div-html .networkComputationReportTbl .xl82 {
mso-style-parent: style0;
text-align: center;
vertical-align: middle;
border-top: 0.5pt dashed windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 1.5pt solid windowtext;
mso-pattern: black none;
}
.report-div-html .networkComputationReportTbl .xl83 {
mso-style-parent: style0;
text-align: center;
vertical-align: middle;
border-top: 0.5pt dashed windowtext;
border-right: 1.5pt solid windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl84 {
mso-style-parent: style0;
text-align: center;
vertical-align: middle;
border-top: 1.5pt solid windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 1.5pt solid windowtext;
border-left: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl85 {
mso-style-parent: style0;
mso-number-format: "\\$0.00";
text-align: center;
vertical-align: middle;
border-top: 1.5pt solid windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 1.5pt solid windowtext;
border-left: 1.5pt solid windowtext;
}
.report-div-html .networkComputationReportTbl .xl86 {
mso-style-parent: style0;
mso-number-format: "\\$0.00";
text-align: center;
vertical-align: middle;
border-top: 1.5pt solid windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 1.5pt solid windowtext;
border-left: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl87 {
mso-style-parent: style0;
text-align: center;
vertical-align: middle;
border: 1.5pt solid windowtext;
}
.report-div-html .networkComputationReportTbl .xl88 {
mso-style-parent: style0;
font-weight: 700;
text-align: center;
vertical-align: middle;
border-top: 1.5pt solid windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 1.5pt solid windowtext;
}
.report-div-html .networkComputationReportTbl .xl89 {
mso-style-parent: style0;
font-weight: 700;
text-align: center;
vertical-align: middle;
border-top: 1.5pt solid windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl90 {
mso-style-parent: style0;
font-weight: 700;
mso-number-format: "\\$0.00";
text-align: center;
vertical-align: middle;
border-top: 1.5pt solid windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 1.5pt solid windowtext;
}
.report-div-html .networkComputationReportTbl .xl91 {
mso-style-parent: style0;
font-weight: 700;
mso-number-format: "\\$0.00";
text-align: center;
vertical-align: middle;
border-top: 1.5pt solid windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl92 {
mso-style-parent: style0;
font-weight: 700;
text-align: center;
vertical-align: middle;
border-top: 1.5pt solid windowtext;
border-right: 1.5pt solid windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl93 {
mso-style-parent: style0;
text-align: center;
vertical-align: middle;
border-top: 0.5pt dashed windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 1.5pt solid windowtext;
}
.report-div-html .networkComputationReportTbl .xl94 {
mso-style-parent: style0;
text-align: center;
vertical-align: middle;
border-top: 1.5pt solid windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 1.5pt solid windowtext;
border-left: 1.5pt solid windowtext;
}
.report-div-html .networkComputationReportTbl .xl95 {
mso-style-parent: style0;
font-size: 14pt;
font-weight: 700;
text-align: center;
vertical-align: middle;
border-top: 1.5pt solid windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 1.5pt solid windowtext;
}
.report-div-html .networkComputationReportTbl .xl96 {
mso-style-parent: style0;
font-size: 14pt;
font-weight: 700;
text-align: center;
vertical-align: middle;
border-top: 1.5pt solid windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl97 {
mso-style-parent: style0;
font-size: 14pt;
font-weight: 700;
mso-number-format: "\\$0.00";
text-align: center;
vertical-align: middle;
border-top: 1.5pt solid windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl98 {
mso-style-parent: style0;
font-size: 14pt;
font-weight: 700;
mso-number-format: "\\$0.00";
text-align: center;
vertical-align: middle;
border-top: 1.5pt solid windowtext;
border-right: 1.5pt solid windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl99 {
mso-style-parent: style0;
font-size: 14pt;
font-weight: 700;
text-align: center;
vertical-align: middle;
border-top: 1.5pt solid windowtext;
border-right: 1.5pt solid windowtext;
border-bottom: 0.5pt dashed windowtext;
border-left: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl100 {
mso-style-parent: style0;
text-align: center;
vertical-align: middle;
border-top: 0.5pt dashed windowtext;
border-right: 0.5pt dashed windowtext;
border-bottom: 1.5pt solid windowtext;
border-left: 1.5pt solid windowtext;
background: #ffff33;
mso-pattern: black none;
}
.report-div-html .networkComputationReportTbl .xl101 {
mso-style-parent: style0;
text-align: left;
vertical-align: middle;
border: 0.5pt dashed windowtext;
}
.report-div-html .networkComputationReportTbl .xl102 {
mso-style-parent: style0;
text-align: right;
vertical-align: middle;
border: 0.5pt dashed windowtext;
}
.report-div-html .portRatorReportTbl table,
.report-div-html .portRatorReportTbl td,
.report-div-html .portRatorReportTbl th {
border: 0.5pt dotted windowtext;
}
.report-div-html .portRatorReportTbl table {
width: 100%;
border-collapse: collapse;
}
.report-div-html .portRatorReportTbl td {
font-size: 12pt;
font-weight: 400;
font-style: normal;
text-decoration: none;
font-family: Calibri;
text-align: center;
vertical-align: middle;
white-space: nowrap;
}
.report-div-html .portRatorReportTbl td:first-child {
background: white;
}
.report-div-html .portRatorReportTbl .yellow-bg {
background: #ffff33;
}
.report-div-html .portRatorReportTbl .green-bg {
background: green;
}
.report-div-html .portRatorReportTbl .light-green {
background: #4cae4c;
}
.report-div-html .portRatorReportTbl .red-bg {
background: #e11414;
}
.report-div-html .portRatorReportTbl .title {
font-size: 24pt;
height: 30pt;
padding: 0;
border: 1px solid #000;
}
.report-div-html .portRatorReportTbl .bold-font {
font-weight: bold;
}
.report-div-html .portRatorReportTbl .double-border {
border-style: double;
}
.report-div-html .portRatorReportTbl .border-all {
border: 1.5pt solid windowtext !important;
}
.report-div-html .portRatorReportTbl .b-bottom {
border-bottom: 1.5pt solid windowtext !important;
}
.report-div-html .portRatorReportTbl .b-top {
border-top: 1.5pt solid windowtext !important;
}
.report-div-html .portRatorReportTbl .b-left {
border-left: 1.5pt solid windowtext !important;
}
.report-div-html .portRatorReportTbl .b-right {
border-right: 1.5pt solid windowtext !important;
}
.highcharts-container{
height: 300px !important
}
</style>
</head>
<body link=blue vlink=purple>
<div style='display: flex'>
    <figure class='highcharts-figure' style =''>
    <div id='mapContainer'></div>
    </figure>
    <figure class='highcharts-figure'>
    <div id='container'></div>
    <div>
        <div style='display: -webkit-box'>
        <label for='siteList'>Site Names: </label>
        <div id='siteList'> </div>
        <label for='servicesDays' style='padding-left: 10px;'>Service Days: </label>
        <input type='number' id='speedBox'  min='1' max='7' name='servicesDays' />
        </div>
    </div>
    </figure>
</div>
<div class= 'report-div-html'>`;
export default networkComputationHTML