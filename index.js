const got = require('got');
const fs = require('fs');
const json2csv = require('json2csv').parse;
const moment = require('moment');
const dotenv = require('dotenv/config');

(async () => {
    const headers  = {
        "Authorization": `Token token=${process.env.API_INTEGRATION}`,
        "Content-Type": 'application/json'
    }

    // Endpoint Contracts
    const contracts = 'https://app.qulture.rocks/api_integration/contracts';
    // Endpoint User Importer
    const importer = 'https://app.qulture.rocks/api_integration/user_importers';

    try {
        await firstStep(headers, contracts);
        await secondStep(headers, contracts, importer);
        
    } catch (err) {
        console.log(err);
    }

})();

async function firstStep(headers, contracts){
    let response;
    try {
        response = await got(contracts, {headers:headers});
        let rawData = JSON.parse(response.body);
        const presentDay = moment().format('YYYY-MM-DD');
        rawData.contracts.forEach(element => {
            if (element.birth_date) element.age = moment(presentDay).diff(element.birth_date, 'years');
        });
    
        const csv = json2csv(rawData.contracts, {fields: ['name', 'job_title', 'email', 'department', 'birth_date', 'age'], delimiter: ';'})
        fs.writeFileSync('Contracts.csv', csv, 'utf-8');
    } catch (err) {
        console.log(`Error found in first step: \n${err}`);
    }
};
async function secondStep(headers, contracts, importer){
    const newUser = {
        "user_importer": {
          "send_invite_mails": false,
          "data": [
            {
              "name": "Stenio D. Rapchan",
              "active": true,
              "email": "steniodr@hotmail.com",
              "tags": ["Customer Success Engineer", "Dev. Node.js"],
              "supervisor_email": "kloh@qulture.rocks",
              "supervisor_cpf": '76629084888',
              "area": "North",
              "location": "São Paulo",
              "level": "Reborn",
              "rg": "123456789",
              "cpf": "80967699878",
              "country": "Brazil",
              "education": "Uninove",
              "department": "TI",
              "job_title": "Customer Success Engineer",
              "nickname": "steniodr",
              "sex": "male",
              "remove_supervisor": false,
              "termination_reason": null,
              "birth_date": "1997-11-10",
              "termination_date": null,
              "admission_date": "2021-10-18",
              "last_career_move_date": "2016-01-30"
            }
          ]
        },
        "include": "progress"
    }

    let response;
    let body;
    let userID;

    try {
        response = await got.post(importer, {
            headers: headers,
            json: newUser
        });

        if(response.statusCode >= 200 && response.statusCode < 300) {
            console.log(`Successsful request`);
            console.log(response.statusMessage);

            body = JSON.parse(response.body);
            userID = body.user_importer.id;
            console.log(userID);
        }
    } catch (err) {
        console.log(`Error found in Post request: \n${err}`);
    }

    do{
        await sleep(5);
        response = await got(`${importer}/${userID}`, {headers:headers});
        body = JSON.parse(response.body);
    } while(body.user_importer.state != 'done')

    try {
        response = await got(contracts, {headers:headers});
        body = JSON.parse(response.body);
        const presentDay = moment().format('YYYY-MM-DD');
        body.contracts.forEach(element => {
            if (element.birth_date) element.age = moment(presentDay).diff(element.birth_date, 'years');
        });
    
        const csv = json2csv(body.contracts, {fields: ['name', 'job_title', 'email', 'department', 'birth_date', 'age'], delimiter: ';'})
        fs.writeFileSync('newContracts.csv', csv, 'utf-8');
    } catch (err) {
        console.log(`Error found in Get request: \n${err}`);
    }

};
function sleep(seg) {
    return new Promise(resolve => setTimeout(resolve, (seg * 1000)));
};