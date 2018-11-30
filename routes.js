
const express = require('express');
const router = express.Router();
const slack = require('./libraries/slack');
const chargeSucceeded = require('./controllers/event/stripe/chargeSucceeded').chargeSucceeded;
const payoutPaid = require('./controllers/event/stripe/payoutPaid').payoutPaid;
const chargeDisputeFundsWithdrawn = require('./controllers/event/stripe/chargeDisputeFundsWithdrawn').chargeDisputeFundsWithdrawn;
const chargeDisputeFundsReinstated = require('./controllers/event/stripe/chargeDisputeFundsReinstated').chargeDisputeFundsReinstated;

var parseString = require('xml2js').parseString;
var xml = "<root>Hello xml2js!</root>"


router.get('/api/status', (req, res) => {
    res.status(200).send('App is running');
});

const responseSuccess = (req, res) => {
    res.status(200).send(`Successfully recorded transaction ${req.body.data.object.id}`)
};

const readIntacctResponse = (response) => {
    console.log('Info: reading Intacct response');

    //const responseKeys = Object.keys(response)
    //responseKeys.forEach(eachResponseKey=>{console.log(`response has key: ${eachResponseKey}`);})
    parseString(response.data, function (err, result) {
        const intacctResult = result.response.operation[0].result[0];
        //Check if status was not successful
        if (intacctResult.status[0] !== 'success'){
            throw `Request to Intacct was not successful - ${intacctResult.errormessage[0].error[0].errorno[0]} ${intacctResult.errormessage[0].error[0].description[0]} ${intacctResult.errormessage[0].error[0].description2[0]}`
        }
    });
    //console.log('Info: Intacct response.data: ', response.data);
}

//API Routing
router.post('/api/:source/:subSource', async (req, res, next) => {
    console.log(`Info: received request to /api/${req.params.source}/${req.params.subSource}`);

    let response;

    try {
        switch(req.params.source) {
            case 'stripe':
                switch(req.body.type) {
                    case 'charge.succeeded':
                        response = await chargeSucceeded(req)
                        readIntacctResponse(response)
                        responseSuccess(req, res)
                    break;
                    case 'payout.paid':
                        response = await payoutPaid(req)
                        responseSuccess(req, res)
                    break;
                    case 'charge.dispute.funds_withdrawn':
                        response = await chargeDisputeFundsWithdrawn(req)
                        responseSuccess(req, res)
                    break;
                    case 'charge.dispute.funds_reinstated':
                        response = await chargeDisputeFundsReinstated(req)
                        responseSuccess(req, res)
                    break;
                    default:
                        console.log('Info: received a stripe event for an unsupported action');
                        res.status(220).send(`Transaction not recorded.  Unsupported type ${req.body.type}`)
                    break;
                }
            break;
        }

    } catch (err){
        console.log(`Error: during request to /api/${req.params.source}/${req.params.subSource} ${err}`);

        slack.send({
            username: 'acc-connector',
            icon_url: 'http://megaicons.net/static/img/icons_sizes/12/77/256/cat-grumpy-icon.png',
            channel: 'accounting-alerts',
            text: `Failed to record a Stripe transaction for transaction ${req.body.data.object.id} with error: ${err}`
        })

        res.status(500).send(`Failed to post transaction: ${err}`);
    }
});


module.exports = router;