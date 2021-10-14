const got = require('got');
const fs = require('fs');
const json2csv = require('json2csv').parse;
const moment = require('moment');
const dotenv = require('dotenv/config');

(async () => {
    
    // Headers
    const headers  = {
        "Authorization": `Token token=${process.env.API_INTEGRATION}`,
        "Content-Type": 'application/json'
    }
    const headersGraphQL = {
        "Authorization": `Bearer ${process.env.PLATFORM_API}`,
        "Content-Type": 'application/json'
    }

    // Endpoints
    const endpointContracts = 'https://app.qulture.rocks/api_integration/contracts';
    const importer = 'https://app.qulture.rocks/api_integration/user_importers';
    const endpointGraphQL = `https://api.qulture.rocks/graphql/2756`;

    // Queries and Variables
    const contractsQuery = `
    query SelectContractList($per: Int!, $page: Int!, $filter: ContractScope) {
        contracts(per: $per, page: $page, filter: $filter) {
        pageInfo {
        ...PageInfoFragment
        __typename
        }
        nodes {
        __typename
        ...SelectContractItemFragment
        }
        __typename
        }
       }
       fragment SelectContractItemFragment on Contract {
        __typename
        id
        name
        jobTitle
        email
        department
        birthDate {
          rawDate
        }
       }
       fragment PageInfoFragment on PaginationPageInfo {
        nextPage
        nodesCount
        page
        pagesCount
        previousPage
        totalCount
        __typename
    }`
    const variables = {
        "per": 10,
        "page": 1
    }

    // Current date
    const presentDay = moment().format('YYYY-MM-DD');

    console.log(`
    ===============================================================

        Welcome to Qulture Rocks Challenge by Stenio D. Rapchan

     Hi inspector...
     The Challenge was splited into three steps.

     Please, take a seat and let's "Rocks"

    ===============================================================
    `);

    try {
        console.log('\tFirst Step Started...');
        await firstStep(headers, endpointContracts, presentDay);
        console.log('\tFirst Step Completed...\n');
  
        console.log('\tSecond Step Started...');
        await secondStep(headers, endpointContracts, importer, presentDay);
        console.log('\tSecond Step Completed...\n');

        console.log('\tThird Step Started...');
        await thirdStep(endpointGraphQL, headersGraphQL, contractsQuery, variables, presentDay);
        console.log('\tThird Step Completed...\n');
        
    } catch (err) {
        console.log(err);
    } finally{
    
    console.log(`
    ===============================================================

            Qulture Rocks Challenge by Stenio D. Rapchan
        
     Thanks for the attention

     Shutting down system...

     Questions and suggestions are welcome!

        Graciously
        Stenio D. Rapchan!

    ===============================================================
    `);

    }

})();

async function firstStep(headers, endpoint, currentDate){
    let response;
    try {
        console.log('\t\t Making the Contract List Request...');
        response = await got(endpoint, {headers:headers});
        let rawData = JSON.parse(response.body);
        console.log('\t\t Inserting "Age" where there is a birthday...');
        const contracts = await insertAges(currentDate, rawData.contracts);
    
        console.log('\t\t Creating "Contracts1.csv" file...');
        const csv = json2csv(contracts, {fields: ['name', 'job_title', 'email', 'department', 'birth_date', 'age'], delimiter: ';'})
        fs.writeFileSync('Contracts1.csv', csv, 'utf-8');
    } catch (err) {
        console.log(`\t\t # Error found in first step: \n${err}`);
    }
};
async function secondStep(headers, endpoint, importer, currentDate){
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
        console.log('\t\t Inserting a new user with Post request...');
        response = await got.post(importer, {
            headers: headers,
            json: newUser
        });

        if(response.statusCode >= 200 && response.statusCode < 300) {
            console.log(`\t\t Successsful request: ${response.statusMessage}`);

            body = JSON.parse(response.body);
            userID = body.user_importer.id;
        }
    } catch (err) {
        console.log(`\t\t # Error found in Post request: \n${err}`);
    }

    do{
        console.log('\t\t Waiting until the new user status equals "done"...');
        await sleep(5);
        response = await got(`${importer}/${userID}`, {headers:headers});
        body = JSON.parse(response.body);
    } while(body.user_importer.state != 'done')

    try {
        response = await got(endpoint, {headers:headers});
        body = JSON.parse(response.body);
        console.log('\t\t Inserting "Age" where there is a birthday...');
        const contracts = await insertAges(currentDate, body.contracts);
    
        console.log('\t\t Creating "Contracts2.csv" file...');
        const csv = json2csv(contracts, {fields: ['name', 'job_title', 'email', 'department', 'birth_date', 'age'], delimiter: ';'})
        fs.writeFileSync('Contracts2.csv', csv, 'utf-8');
    } catch (err) {
        console.log(`\t\t # Error found in Get request: \n${err}`);
    }

};
async function thirdStep(endpoint, headers, query, variables, currentDate){
    async function consumeAPIGraphQL(endpoint, headers, query, variables = {}){
        const response = await got.post(endpoint, {
            headers: headers,
            body: JSON.stringify({query, variables})
        });

        const data = JSON.parse(response.body);
        return data;
    }

    console.log('\t\t Making the Contract List Request...');
    const rawContracts = await consumeAPIGraphQL(endpoint, headers, query, variables);
    fs.writeFileSync('teste.json', JSON.stringify(rawContracts), 'utf-8');
    
    console.log('\t\t Inserting "Age" where there is a birthday...');
    const contracts = await insertAges(currentDate, rawContracts.data.contracts.nodes, true);

    console.log('\t\t Creating "Contracts3.csv" file...');
    const csv = json2csv(contracts, {fields: ['name', 'jobTitle', 'email', 'department', 'birthDate.rawDate', 'age'], delimiter: ';'})
    fs.writeFileSync('Contracts3.csv', csv, 'utf-8');
}
function sleep(seg) {
    return new Promise(resolve => setTimeout(resolve, (seg * 1000)));
};
function insertAges(currentDate, contracts, GraphqlType = false){
    if (GraphqlType){
        contracts.forEach(elem => {
            if (elem.birthDate) elem.age = moment(currentDate).diff(elem.birthDate.rawDate, 'years');
        })
    }
    else{
        contracts.forEach(elem => {
            if (elem.birth_date) elem.age = moment(currentDate).diff(elem.birth_date, 'years');
        })
    }

    return contracts;
}