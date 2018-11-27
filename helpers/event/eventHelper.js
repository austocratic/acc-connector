


const stringifyProp = (records, prop) => {
    let propArray = records.map(eachRecord=>{return eachRecord[prop]})
    return propArray.toString()
}



module.exports = {
    stringifyProp
}