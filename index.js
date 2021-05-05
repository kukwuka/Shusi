const Web3 = require('web3');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();


const MasterChef = require('./MasterChefAbi.json');
const CGT = require('./CGTabi.json');

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_URL));
const ContractChef = new web3.eth.Contract(MasterChef, '0xe8Cc9f640C55f3c5905FD2BBb63C53fb8A3A527d');
const ContractCGT = new web3.eth.Contract(CGT, '0xf56b164efd3cfc02ba739b719b6526a6fa1ca32a');


async function Main(toBlock, endBlock) {
    let pid0Hash = [];
    let pidOtherHash = [];
    let withDrawHash = {pid0Hash, pidOtherHash};
    let AllUsersTokens = 0;
    let pid0 = {};
    let pidOther = {};
    let uniqueAddresses = {pid0, pidOther};
    let eventsDeposit = await ContractChef.getPastEvents("Deposit", {
        fromBlock: toBlock,
        toBlock: endBlock
    });

    let eventsWithdraw = await ContractChef.getPastEvents("Withdraw", {
        fromBlock: toBlock,
        toBlock: endBlock
    });

    for (let event of eventsWithdraw) {
        if (event.returnValues.pid === "0") {
            withDrawHash.pid0Hash.push(event.transactionHash);
            continue;
        }
        withDrawHash.pidOtherHash.push(event.transactionHash);
    }

    for (let row of eventsDeposit) {
        let user = row.returnValues.user.toLowerCase();

        let amount = parseInt(row.returnValues.amount);

        if (row.returnValues.pid === "0") {
            uniqueAddresses.pid0[user] = {deposit: amount}
            continue
        }

        if (typeof uniqueAddresses.pidOther[user] === "undefined") {
            uniqueAddresses.pidOther[user] = {deposit: amount};
        } else {
            uniqueAddresses.pidOther[user].deposit += amount;
        }

    }

    for (const user of Object.keys(uniqueAddresses.pidOther)) {
        uniqueAddresses.pidOther[user].pending1 = Number(await ContractChef.methods.pendingSushi(1, user).call());
        uniqueAddresses.pidOther[user].pending2 = Number(await ContractChef.methods.pendingSushi(2, user).call());
        uniqueAddresses.pidOther[user].pending3 = Number(await ContractChef.methods.pendingSushi(3, user).call());
    }


    for (const user of Object.keys(uniqueAddresses.pid0)) {
        uniqueAddresses.pid0[user].pending0 = Number(await ContractChef.methods.pendingSushi(0, user).call());
    }


    for (let user of Object.keys(uniqueAddresses.pidOther)) {
        let transaction = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${user}&startblock=0&endblock=999999999&sort=asc&apikey=B37NC728AS31WBW26RN9PMR2WTUS22P66F`)
        uniqueAddresses.pidOther[user].harvestedTokens = 0
        for (let i = 0; i < transaction.data.result.length; i++) {
            if (transaction.data.result[i].from === "0xe8Cc9f640C55f3c5905FD2BBb63C53fb8A3A527d".toLowerCase()) {
                if (!withDrawHash.pidOtherHash.includes(transaction.data.result[i].hash)) continue;
                uniqueAddresses.pidOther[user].harvestedTokens += Number(transaction.data.result[i].value)
            }
        }
    }

    for (let user of Object.keys(uniqueAddresses.pid0)) {
        let transaction = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${user}&startblock=0&endblock=999999999&sort=asc&apikey=B37NC728AS31WBW26RN9PMR2WTUS22P66F`)
        uniqueAddresses.pid0[user].harvestedTokens = 0
        for (let i = 0; i < transaction.data.result.length; i++) {
            if (transaction.data.result[i].from === "0xe8Cc9f640C55f3c5905FD2BBb63C53fb8A3A527d".toLowerCase()) {
                if (!withDrawHash.pid0Hash.includes(transaction.data.result[i].hash)) continue;
                uniqueAddresses.pid0[user].harvestedTokens += Number(transaction.data.result[i].value)
            }
        }
    }

    for (let user of Object.keys(uniqueAddresses.pidOther)) {

        uniqueAddresses.pidOther[user].userTokens = uniqueAddresses.pidOther[user].harvestedTokens +
            (Number(uniqueAddresses.pidOther[user].pending1)
                + Number(uniqueAddresses.pidOther[user].pending2)
                + Number(uniqueAddresses.pidOther[user].pending3))
        AllUsersTokens += uniqueAddresses.pidOther[user].userTokens;
    }

    for (let user of Object.keys(uniqueAddresses.pid0)) {
        uniqueAddresses.pid0[user].userTokens = uniqueAddresses.pid0[user].harvestedTokens + Number(uniqueAddresses.pid0[user].pending0)
    }
    for (let user of Object.keys(uniqueAddresses.pidOther)) {

        uniqueAddresses.pidOther[user].DUMMYpart = uniqueAddresses.pidOther[user].userTokens / AllUsersTokens

    }
    fs.writeFile('./logs/CGTpending1.json', JSON.stringify(uniqueAddresses), function (err) {
        if (err) {
            console.log(err);
        }
    });

}

Main(0,'latest')

