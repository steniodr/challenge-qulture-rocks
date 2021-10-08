const got = require('got');
const fs = require('fs');
const json2csv = require('json2csv').parse;
const moment = require('moment');
const dotenv = require('dotenv/config');

(async () => {
    try {
        await firstStep();
        
    } catch (err) {
        console.log(err);
    }

})();

async function firstStep(){
    const httpheaders  = {
        "Authorization": `Token token=${process.env.API_INTEGRATION}`,
        "Content-Type": 'application/json'
    }

    // Endpoint Contracts
    const contracts = 'https://app.qulture.rocks/api_integration/contracts'

    const response = await got(contracts, {headers:httpheaders});
    const presentDay = moment().format('YYYY-MM-DD');

    let rawData = JSON.parse(response.body);
    rawData.contracts.forEach(element => {
        if (element.birth_date) element.age = moment(presentDay).diff(element.birth_date, 'years');
    });

    const csv = json2csv(rawData.contracts, {fields: ['name', 'job_title', 'email', 'department', 'birth_date', 'age'], delimiter: ';'})
    fs.writeFileSync('Contracts.csv', csv, 'utf-8');
};