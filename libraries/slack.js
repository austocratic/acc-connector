const axios = require('axios');

const send = async message => {
    return await axios.post(process.env.SLACK_HOOK, message)
};

module.exports = {
    send
}