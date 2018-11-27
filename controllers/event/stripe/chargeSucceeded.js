
const stripe = require('stripe')(process.env.STRIPE_OPERATING);
const icracked = require('../../../libraries/icracked');
const slack = require('../../../libraries/slack');
const ssRepairB2C = require('./chargeSucceeded/ssRepairB2C').ssRepairB2C;
const ssRepairVerizon = require('./chargeSucceeded/ssRepairVerizon').ssRepairVerizon;


const chargeSucceeded = async req => {
    console.log('Info: called event/stripe/chargeSucceeded controller');

    const stripeCharge = req.body.data.object;

    //Ensure that the request has a repair ID.  If no repair ID, return charge missing repair ID:
    if (stripeCharge.metadata === null || stripeCharge.metadata.repair_id === undefined){
        console.log('Error: charge had null metadata for undefined repair ID');
        throw `charge.succeeded ${req.body.data.object.id} has no repair ID`
    }

    //Use the repair ID to look up transaction details in the DB
    const repair = await icracked.getRepair(stripeCharge.metadata.repair_id);

    //Get stripe charge transaction, transfer, transfer transaction objects
    const stripeChargeTransaction = await stripe.balance.retrieveTransaction(stripeCharge.balance_transaction)
    const stripeTransfer = await stripe.transfers.retrieve(stripeCharge.transfer)
    const stripeTransferTransaction = await stripe.balance.retrieveTransaction(stripeTransfer.balance_transaction) 

    //console.log('# of records: ', repair.length)
    if (repair[0].ledger_id === null){
        console.log('Info: a charge.succeeded event with no ledger activity (not SS)');
        
        slack.send({
            username: 'acc-connector',
            icon_url: 'http://megaicons.net/static/img/icons_sizes/12/77/256/cat-grumpy-icon.png',
            channel: 'accounting-alerts',
            text: `Repair did not decrement the ledger`,
            attachments: [{
                //"text": "Charge Details:",
                "color": "#FFA500",
                "fields": [
                    {
                        "title": "Amount",
                        "value": "$" + (Math.abs(stripeCharge.amount) / 100),
                        "short": true
                    },
                    {
                        "title": "Repair ID",
                        "value": stripeCharge.metadata.repair_id,
                        "short": true
                    },
                    {
                        "title": "Link to charge",
                        "value": 'https://dashboard.stripe.com/payments/' + stripeCharge.id,
                        "short": true
                    }
                ]
            }]
        })

    } else {
        console.log(`Info: checking SS charge.succeeded event for program ${repair[0].program_id}`);
        //Check the program ID
        switch (repair[0].program_id) {
            //B2C repair
            case 1:
                await ssRepairB2C({
                    repair,
                    stripeCharge,
                    stripeChargeTransaction,
                    stripeTransfer,
                    stripeTransferTransaction
                })
            break;
            //Verizon
            case 11:
                await ssRepairVerizon({
                    repair,
                    stripeCharge,
                    stripeChargeTransaction,
                    stripeTransfer,
                    stripeTransferTransaction
                })
            break;
            default:
            console.log(`Info: received a charge.succeeded for an unsupported program ${repair[0].program_id}`);
            break;
        }
    }
};

module.exports = {
    chargeSucceeded
}