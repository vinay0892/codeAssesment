const csv = require('csv-parser');
const fs = require('fs');
const json2csv = require('json2csv').parse
const moment = require('moment');


const data_new = [];
const fields = ['Reference','Description','Remarks'];
let fileName = `records_final_${moment().format('YYYY_MM_DD_HH_mm_SS')}.csv`
// const jsonData = [
//     {
//         name:'test1',email:'test1@gmail.com',country:'test1'
//     },
//     {
//         name:'test2',email:'test2@gmail.com',country:'test2'
//     },
//     {
//         name:'test3',email:'test3@gmail.com',country:'test3'
//     }
// ]
// Read data from local csv file

fs.createReadStream('records.csv')
.pipe(csv({}))
.on('data',(data)=>data_new.push(data))
.on('end',()=>{
let duplicateValues = [];
let trimmedData = data_new;
// remove empty spaces in the object keys
trimmedData = trimmedData.map(el => 
    Object.fromEntries(Object.entries(el).map(([key, value]) => ([
      key.replace(/\s+/g, ""),
      value
    ])))
  );
// Loop through the csv data array
for (let i = 0; i < trimmedData.length; i++) {

let mutationValue = parseFloat(trimmedData[i].Mutation);
let endBalance = parseFloat(trimmedData[i].EndBalance);
let startBalance = parseFloat(trimmedData[i].StartBalance);
let typeOfCal = Math.sign(mutationValue);
// logic to check mutation
    if(typeOfCal<1){
        if(Math.abs((startBalance-Math.abs(mutationValue)).toFixed(2))!==(Math.abs(endBalance))){
            duplicateValues.push({
                Reference:trimmedData[i].Reference,
                Description:trimmedData[i].Description,
                Remarks:'Please check for mismatch in the starting balance and mutation value calclulations'
            })
        }
    }
    if(typeOfCal>=1){
        if(Math.abs((startBalance+Math.abs(mutationValue)).toFixed(2))!==(Math.abs(endBalance))){
            duplicateValues.push({
                Reference:trimmedData[i].Reference,
                Description:trimmedData[i].Description,
                Remarks:'Please check for mismatch in the starting balance and mutation value calclulations'
            })
            console.log('-=-add mismatch')
    }}
  for (let j = i + 1; j < trimmedData.length; j++) {
    // If there is a duplicate, push it to the duplicateValues array
    if (parseInt(trimmedData[i].Reference) === parseInt(trimmedData[j].Reference)) {
    duplicateValues.push({
        Reference:trimmedData[i].Reference,
        Description:trimmedData[i].Description,
        Remarks:'Reference number cannot contain duplicate values'
    })
}
  }
}
const csv_new = json2csv(duplicateValues,{fields});

// write data to csv
fs.writeFile( fileName,csv_new,(err)=>{
        if(err){
            console.log('Something went wrong',err)
        }
        else{
            console.log('Calculations completed please refer records_final csv file for additional details')
        }
    })
})