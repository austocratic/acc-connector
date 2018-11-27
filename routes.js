
const express = require('express');
const router = express.Router();
const slack = require('./libraries/slack');
const chargeSucceeded = require('./controllers/event/stripe/chargeSucceeded').chargeSucceeded;
const payoutPaid = require('./controllers/event/stripe/payoutPaid').payoutPaid;
const chargeDisputeFundsWithdrawn = require('./controllers/event/stripe/chargeDisputeFundsWithdrawn').chargeDisputeFundsWithdrawn;

router.get('/api/status', (req, res) => {
    res.status(200).send('App is running');
});

//API Routing
router.post('/api/:source/:subSource', async (req, res, next) => {
    console.log(`Info: received request to /api/${req.params.source}/${req.params.subSource}`);

    try {
        switch(req.params.source) {
            case 'stripe':
                switch(req.body.type) {
                    case 'charge.succeeded':
                        await chargeSucceeded(req)
                    break;
                    case 'payout.paid':
                        await payoutPaid(req)
                    break;
                    case 'charge.dispute.funds_withdrawn':
                        await chargeDisputeFundsWithdrawn(req)
                    break;
                    case 'charge.dispute.funds_reinstated':
                    break;
                    default:
                        console.log('Info: received a stripe event for an unsupported action');
                    break;
                }
            break;
        }

        res.status(200).send('Success')
    } catch (err){
        console.log(`Error: during request to /api/${req.params.source}/${req.params.subSource} ${err}`);

        slack.send({
            username: 'acc-connector',
            icon_url: 'http://megaicons.net/static/img/icons_sizes/12/77/256/cat-grumpy-icon.png',
            channel: 'accounting-alerts',
            text: `Failed to record a Stripe transaction ${err}`
        })

        res.status(500).send(`Failed to post transaction: ${JSON.stringify(err)}`);
    }
});


module.exports = router;