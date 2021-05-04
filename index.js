const Web3 = require('web3');
const fs = require('fs');
require('dotenv').config();


const MasterChef = require('./MasterChefAbi.json');
const Sushi = require('./SushiAbi.json');


const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_URL));

const ContractChef = new web3.eth.Contract(MasterChef, '0xe8Cc9f640C55f3c5905FD2BBb63C53fb8A3A527d');
const ContractSushi =  new web3.eth.Contract(Sushi, '0xf56b164efd3cfc02ba739b719b6526a6fa1ca32a');

(async () => {
    let uniqueAddresses = {};
    let events = await ContractChef.getPastEvents("Deposit", {
        fromBlock: 0,
        toBlock: 'latest'
    });

    for (let row of events) {
        const user = row.returnValues.user.toLowerCase();
        const amount = parseInt(row.returnValues.amount);

        if (row.returnValues.pid === "0") console.log(user);
        if (row.returnValues.pid === "0") continue;

        if (typeof uniqueAddresses[user] === "undefined") {
            uniqueAddresses[user] = {deposit: amount};
        } else {
            uniqueAddresses[user].deposit += amount;
        }
    }




    for (const user of Object.keys(uniqueAddresses)) {
        uniqueAddresses[user].pending0 = await ContractChef.methods.pendingSushi(0, user).call();
        uniqueAddresses[user].pending1 = await ContractChef.methods.pendingSushi(1, user).call();
        uniqueAddresses[user].pending2 = await ContractChef.methods.pendingSushi(2, user).call();
        uniqueAddresses[user].pending3 = await ContractChef.methods.pendingSushi(2, user).call();
    }
    console.log(uniqueAddresses);
    events = await ContractSushi.getPastEvents("Transfer", {
        fromBlock: 0,
        toBlock: 'latest'
    });

    fs.writeFileSync('SushiTrans.json', JSON.stringify(events));


})()