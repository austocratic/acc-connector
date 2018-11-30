
const intacct = require('../../../libraries/intacct');

//Payout paid events are transfers from Stripe --> bank balance
const payoutPaid = async req => {
    console.log('Info: called event/stripe/payoutPaid controller');

    const stripeTransfer = req.body.data.object;

    const entryDescription = ``;
    const createdDate = new Date(stripeTransfer.created * 1000)
    const formattedCreatedDate = `${(createdDate.getMonth() + 1)}/${createdDate.getDate()}/${createdDate.getFullYear()}`;

    const entry = {
        locationid: '100',
        date: formattedCreatedDate,
        journalid: 'STRIPE',
        title: entryDescription,
        referenceno: stripeTransfer.id,
        sourceentity: '',
        customfields: '',
        lines: [
            {
                DOCUMENT: stripeTransfer.balance_transaction,
                ACCOUNTNO: '10204', TR_TYPE: '1', DEPARTMENT: '', LOCATION: '', DESCRIPTION: entryDescription, VENDORID: '', CLASSID: '', 
                AMOUNT: (stripeTransfer.amount / 100)
            },
            {
                DOCUMENT: stripeTransfer.balance_transaction,
                ACCOUNTNO: '10341', TR_TYPE: '-1', DEPARTMENT: '', LOCATION: '', DESCRIPTION: entryDescription, VENDORID: '', CLASSID: '', 
                AMOUNT: (stripeTransfer.amount / 100)
            }
        ]
    }

    console.log(entry)
    return await intacct.createEntry(entry);

};

module.exports = {
    payoutPaid
}