
const stripe = require('stripe')(process.env.STRIPE_OPERATING);

//Payout paid events are transfers from Stripe --> bank balance
const chargeDisputeFundsWithdrawn = async req => {
    console.log('Info: called event/stripe/chargeDisputeFundsWithdrawn controller');

    const stripeDispute = req.body.data.object;

     //Get the details of the disputed charge
     const stripeCharge = stripe.charges.retrieve(stripeDispute.charge);

    //Ensure that the request has a repair ID.  If no repair ID, return charge missing repair ID:
    if (stripeCharge.metadata === null || stripeCharge.metadata.repair_id === undefined){
        console.log('Error: disputed charge has null metadata for undefined repair ID');
        throw `charge.dispute.funds_withdrawn for a charge ${stripeCharge.id} that has no repair ID`
    }

    const entryDescription = ``;
    const createdDate = new Date(stripeDispute.created * 1000)
    const formattedCreatedDate = `${(createdDate.getMonth() + 1)}/${createdDate.getDate()}/${createdDate.getFullYear()}`;

    //disputes can have multiple balance_transactions (generally they only have 1)

    const entry = {
        locationid: '100',
        date: formattedCreatedDate,
        journalid: 'STRIPE',
        title: entryDescription,
        referenceno: '',
        sourceentity: '',
        customfields: '',
        lines: [
            {   //Platform
                DOCUMENT: stripeTransfer.balance_transaction,
                ACCOUNTNO: '10341', TR_TYPE: '-1', DEPARTMENT: '', LOCATION: '', DESCRIPTION: entryDescription, VENDORID: '', CLASSID: '', 
                AMOUNT: -(stripeDispute.balance_transactions[0].net / 100)
            },
            {   //Fee
                DOCUMENT: stripeTransfer.balance_transaction,
                ACCOUNTNO: '', TR_TYPE: '1', DEPARTMENT: '', LOCATION: '', DESCRIPTION: entryDescription, VENDORID: '', CLASSID: '', 
                AMOUNT: (stripeDispute.balance_transactions[0].fee / 100)
            },
            {   //Gross
                DOCUMENT: stripeTransfer.balance_transaction,
                ACCOUNTNO: '', TR_TYPE: '1', DEPARTMENT: '', LOCATION: '', DESCRIPTION: entryDescription, VENDORID: '', CLASSID: '', 
                AMOUNT: -(stripeDispute.balance_transactions[0].amount / 100)
            }
        ]
    }

    console.log(entry)
    return await intacct.createEntry(entry);

};

module.exports = {
    chargeDisputeFundsWithdrawn
}