
const js2xmlparser = require('js2xmlparser');
const axios = require('axios');

const intacctApi = 'https://api.intacct.com/ia/xml/xmlgw.phtml'

const createEntry = async (details) => {

    //If a line has a $0 value, remove it from the entry line array:
    const entryLines = details.lines.filter(eachLine=>eachLine.AMOUNT > 0)

    let entry = {
        control: {
            senderid: process.env.INTACCT_CONTROL_SENDER,
            password: process.env.INTACCT_CONTROL_PASSWORD,
            controlid: 'foobar',
            uniqueid: 'false',
            dtdversion: '3.0'
        },
        operation: {
            authentication: {
                login: {
                    userid: process.env.INTACCT_LOGIN_USER_ID,
                    companyid: process.env.INTACCT_LOGIN_COMPANY_ID,
                    password: process.env.INTACCT_LOGIN_PASSWORD,
                    locationid: details.locationid
                }
            },
            content: {
                function: {
                    "@1": {
                        "controlid": "XML-API-Test22"
                    },
                    create: {
                        GLBATCH: {
                            JOURNAL: details.journalid,
                            BATCH_DATE: details.date,
                            BATCH_TITLE: details.title,
                            REFERENCENO: details.referenceno,
                            ENTRIES: {
                                GLENTRY: entryLines
                            }
                        }
                    }
                }
            }
        }
    }

    const xml = js2xmlparser.parse("request", entry, {declaration: {encoding: 'UTF-8'}}) 

    //console.log(xml);
    //return xml;

    return await axios.post(intacctApi, xml,
    {
        headers: {
            'Content-Type': 'x-intacct-xml-request'
        }
    })
}

module.exports = {
    createEntry
}
