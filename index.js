const csv = require('csv-parser');
const fs = require('fs');
const json2csv = require('json2csv').parse
const moment = require('moment');
const xml2js = require('xml2js');

const data_new = [];
const fields = ['Reference','Description','Remarks'];
let fileName = `records_final_${moment().format('YYYY_MM_DD_HH_mm_SS')}.csv`;
let fileNameXlsx = `records_final_${moment().format('YYYY_MM_DD_HH_mm_SS')}.xlsx`;

// Read data from local csv file
const xlsx = require('xlsx');
const path = require('path')
const ext = path.extname('sampleData.exports.xlsx');

async function trimdata_(data){
    try{
        let trimData = data
        return trimData.map(el => 
            Object.fromEntries(Object.entries(el).map(([key, value]) => ([
              key.replace(/\s+/g, ""),
              value
            ])))
          );
    }catch(err){}
}
async function checkCalculations(data){
    let duplicateValues = [];
    try{
        for (let i = 0; i < data.length; i++) {
            let mutationValue = parseFloat(data[i].Mutation);
            let endBalance = parseFloat(data[i].EndBalance);
            let startBalance = parseFloat(data[i].StartBalance);
            let typeOfCal = Math.sign(mutationValue);
        // logic to check mutation
            if(typeOfCal<1){
                if(Math.abs((startBalance-Math.abs(mutationValue)).toFixed(2))!==(Math.abs(endBalance))){
                    duplicateValues.push({
                        Reference:data[i].Reference,
                        Description:data[i].Description,
                        Remarks:'Please check for mismatch in the starting balance and mutation value calclulations'
                    })
                }
            }
            else if(typeOfCal>=1){
                if(Math.abs((startBalance+Math.abs(mutationValue)).toFixed(2))!==(Math.abs(endBalance))){
                    duplicateValues.push({
                        Reference:data[i].Reference,
                        Description:data[i].Description,
                        Remarks:'Please check for mismatch in the starting balance and mutation value calclulations'
                    })
            }}
            for (let j = i + 1; j < data.length; j++) {
            // If there is a duplicate, push it to the duplicateValues array
            if (parseInt(data[i].Reference) === parseInt(data[j].Reference)) {
                duplicateValues.push({
                Reference:data[i].Reference,
                Description:data[i].Description,
                Remarks:'Reference number cannot contain duplicate values'
                })
            }
            }
           
        }
        return duplicateValues
    }catch(err){
        throw err
    }
}
async function writeFIleNew(data_new){
    // this type we can check from the incoming request , and the same logic is applied for different file types.
    // For now iam handling .csv and .xlsx and iam reading only those two formats.

    // let fileType = path.extname(incomingFileName)
    try{
        let vala =  await trimdata_(data_new);
        if(vala && vala.length>0){
            let newVal = await checkCalculations(vala);
            if(newVal && newVal.length>0){
                // logic to handle wrong file types
                // if(fileType !== '.csv' || fileType !=='.xlsx'){
                //     console.log('Please upload or use CSV or XLSX file only, othe file types are not supported')
                // }
                // if(path == '.csv'){
                    writeFileToCSV(newVal)
                // }
                // if(path == '.xlsx'){
                    
                    writeFileToXLSX(newVal)
                    // }
            }            
                }
            }catch(err){

            }
}
async function writeFileToCSV(data){
    const csv_new = json2csv(data,{fields});
    fs.writeFile( fileName,csv_new,(err)=>{
        if(err){
            console.log('Something went wrong',err)
        }
        else{
            console.log('Calculations completed please refer records_final csv file for additional details')
        }
        })
}
async function writeFileToXLSX(data){
    try{
        const ws_ = xlsx.utils.json_to_sheet(data) 
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws_, 'Responses')
        xlsx.writeFile(wb, fileNameXlsx)
    }catch(err){

    }
}
// CSV file
fs.createReadStream('records.csv')
.pipe(csv({}))
.on('data',(data)=>data_new.push(data))
.on('end',()=>{
writeFIleNew(data_new)
     
})
// excel file
const workbook = xlsx.readFile('records.xlsx');  // Step 2
let workbook_sheet = workbook.SheetNames;                // Step 3
let workbook_response = xlsx.utils.sheet_to_json(        // Step 4
    workbook.Sheets[workbook_sheet[0]]
);
console.log('work',workbook_response)
if(workbook_response && workbook_response.length>0){
    writeFIleNew(workbook_response)
}