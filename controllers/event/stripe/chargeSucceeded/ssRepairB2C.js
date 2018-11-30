
const intacct = require('../../../../libraries/intacct');
const eventHelper = require('../../../../helpers/event/eventHelper')


const ssRepairB2C = async (details) => {
    console.log("Info: called ssRepairB2C()");
    
    const modelNames = eventHelper.stringifyProp(details.repair, 'model_name');
    const skus = eventHelper.stringifyProp(details.repair, 'sku');
    const partCodes = eventHelper.stringifyProp(details.repair, 'part_code');
    const numberDevices = details.repair.length;

    const entryDescription = `Simple Stock Repair ID: ${details.repair[0].id} | iTech ID: ${details.repair[0].itech_id} | Device: ${modelNames} | SKU: ${skus} | Part Code: ${partCodes} | # of Devices: ${numberDevices} | Zip Code: ${details.repair[0].postal_code} | Service Task ID: `

    const createdDate = new Date(details.stripeCharge.created * 1000)
    const formattedCreatedDate = `${(createdDate.getMonth() + 1)}/${createdDate.getDate()}/${createdDate.getFullYear()}`;

    const laborRate = 40;
    let labor = numberDevices * laborRate;

    //console.log('DEBUG discount: ', details.repair[0].discount);

    const discount = details.repair[0].discount ? details.repair[0].discount : 0;
    
    //If upsell calculates as < $0, then it is a downsell and should reduce the labor amount
    //const upsell = details.repair[0].itech_subtotal - labor;
    //If upsell is greater than 0 return the upsell, otherwise $0 upsell
    const upsell = details.repair[0].itech_subtotal - labor > 0 ? details.repair[0].itech_subtotal - labor : 0;
    //If there is a downsell, reduce the labor rate by the amount of downsell, otherwise $0
    const downsell = details.repair[0].itech_subtotal - labor < 0 ? details.repair[0].itech_subtotal - labor : 0;
    labor = labor + downsell;

    // if (details.repair[0].itech_subtotal - labor > 0){
    //     up = details.repair[0].itech_subtotal - labor
    // } else {
    //     up = 0;
    //     labor = labor - 
    // }

    const entry = {
        locationid: '100',
        date: formattedCreatedDate,
        journalid: 'STRIPE',
        title: entryDescription,
        referenceno: details.stripeCharge.id,
        sourceentity: '',
        customfields: '',
        lines: [
            {
                DOCUMENT: details.stripeChargeTransaction.id,
                ACCOUNTNO: '10341', TR_TYPE: '1', DEPARTMENT: '', LOCATION: '', DESCRIPTION: entryDescription, VENDORID: '', CLASSID: '', 
                AMOUNT: (details.stripeChargeTransaction.net / 100)
            },
            {
                DOCUMENT: '',
                ACCOUNTNO: '60301', TR_TYPE: '1', DEPARTMENT: '', LOCATION: '', DESCRIPTION: entryDescription, VENDORID: 'VEND00534', CLASSID: '30', 
                AMOUNT: (details.stripeChargeTransaction.fee / 100)
            },
            {
                DOCUMENT: details.repair[0].id,
                ACCOUNTNO: '43112', TR_TYPE: '-1', DEPARTMENT: '', LOCATION: '', DESCRIPTION: entryDescription, VENDORID: '', CLASSID: '30',
                AMOUNT: details.repair[0].subtotal
            },
            {
                DOCUMENT: '',
                ACCOUNTNO: '43116', TR_TYPE: '1', DEPARTMENT: '', LOCATION: '', DESCRIPTION: entryDescription, VENDORID: '', CLASSID: '30',
                AMOUNT: discount
            },
            {
                DOCUMENT: '',
                ACCOUNTNO: '20031', TR_TYPE: '-1', DEPARTMENT: '', LOCATION: '', DESCRIPTION: entryDescription, VENDORID: '', CLASSID: '',
                AMOUNT: details.repair[0].tip
            },
            {
                DOCUMENT: '',
                ACCOUNTNO: '23001', TR_TYPE: '-1', DEPARTMENT: '', LOCATION: '', DESCRIPTION: entryDescription, VENDORID: '', CLASSID: '',
                AMOUNT: details.repair[0].sales_tax
            },
            {
                DOCUMENT: details.stripeTransferTransaction.id,
                ACCOUNTNO: '10341', TR_TYPE: '-1', DEPARTMENT: '', LOCATION: '', DESCRIPTION: entryDescription, VENDORID: '', CLASSID: '',
                AMOUNT: -(details.stripeTransferTransaction.net / 100)
            },
            {
                DOCUMENT: details.repair[0].id,
                ACCOUNTNO: '51011', TR_TYPE: '1', DEPARTMENT: '', LOCATION: '', DESCRIPTION: entryDescription, VENDORID: '', CLASSID: '30',
                AMOUNT: labor
            },
            {
                DOCUMENT: details.repair[0].id,
                ACCOUNTNO: '43117', TR_TYPE: '1', DEPARTMENT: '', LOCATION: '', DESCRIPTION: entryDescription, VENDORID: '', CLASSID: '30',
                AMOUNT: upsell
            },
            {
                DOCUMENT: '',
                ACCOUNTNO: '20031', TR_TYPE: '1', DEPARTMENT: '', LOCATION: '', DESCRIPTION: entryDescription, VENDORID: '', CLASSID: '',
                AMOUNT: details.repair[0].tip
            }
        ]
    }

    console.log('Debug: entry lines: ', entry.lines);

    //console.log(entry)
    return await intacct.createEntry(entry);
};

module.exports = {
    ssRepairB2C
}

