const { BLOCKFROST_PROJECTID, BLOCKFROST_URI  } = require('../config');
const axios = require('axios');

const getStakeInfo = async (stake_key) => {

    try {
        let result = await axios({
            method: "GET",
            url: BLOCKFROST_URI + 'accounts/' + stake_key,
            headers: {
                project_id: BLOCKFROST_PROJECTID
            }
        });
    
        return result.data.controlled_amount/1000000;
    } catch (e) {
        console.error('ERROR: Unable to obtain information for wallet: ' + stake_key);
        throw new Error('Could not find wallet information on blockfrost');
    }
}

module.exports = {
    getStakeInfo
}