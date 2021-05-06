const Web3 = require('web3');
const fs = require('fs');
const axios = require('axios');
const BigNumber = require('bignumber.js');

require('dotenv').config();

const {pack} = require('./helpers/utils.js');
const {MerkleTree} = require('./helpers/merkleTree.js');

const MasterChef = require('./abi/MasterChefAbi.json');


async function GetMerkleHash(startBlock, endBlock, config = null) {
    require('dotenv').config(config);

    console.log("Starting");

    console.log(process.env.INFURA_URL)
    const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_URL));
    // console.log(web3)

    const ContractChef = new web3.eth.Contract(MasterChef, '0xe8Cc9f640C55f3c5905FD2BBb63C53fb8A3A527d');


    const MasterChefAddress = process.env.MASTER_CHEF_ADDRESS;


    let pid0Hash = [];
    let pidOtherHash = [];
    let withDrawHash = {pid0Hash, pidOtherHash};

    let pid0HashDep = [];
    let pidOtherHashDep = [];
    let DepositHash = {pid0HashDep, pidOtherHashDep};

    let AllUsersTokens = 0;
    let pid0 = {};
    let pidOther = {};
    let uniqueAddresses = {pid0, pidOther};
    // console.log(ContractChef)
    let eventsDeposit = await ContractChef.getPastEvents("Deposit", {
        fromBlock: startBlock,
        toBlock: endBlock
    });


    let eventsWithdraw = await ContractChef.getPastEvents("Withdraw", {
        fromBlock: startBlock,
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

            uniqueAddresses.pid0[user] = {deposit: amount};
            DepositHash.pid0HashDep.push(row.transactionHash);
            continue;
        }

        DepositHash.pidOtherHashDep.push(row.transactionHash);
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
        let transaction = await axios.get(
            `https://api.etherscan.io/api?module=account&action=tokentx&address=${user}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${process.env.API_EthScan}`
        );
        uniqueAddresses.pidOther[user].harvestedTokens = 0;
        for (let i = 0; i < transaction.data.result.length; i++) {
            if (
                transaction.data.result[i].from === MasterChefAddress.toLowerCase()
                &&
                transaction.data.result[i].tokenSymbol === 'CGT'
            ) {
                if (
                    !withDrawHash.pidOtherHash.includes(transaction.data.result[i].hash)
                    &&
                    !DepositHash.pidOtherHashDep.includes(transaction.data.result[i].hash)
                ) continue;
                uniqueAddresses.pidOther[user].harvestedTokens += Number(transaction.data.result[i].value);
            }
        }
    }

    for (let user of Object.keys(uniqueAddresses.pid0)) {
        let transaction = await axios.get(
            `https://api.etherscan.io/api?module=account&action=tokentx&address=${user}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${process.env.API_EthScan}`
        );
        uniqueAddresses.pid0[user].harvestedTokens = 0
        for (let i = 0; i < transaction.data.result.length; i++) {
            if (
                transaction.data.result[i].from === MasterChefAddress.toLowerCase()
                &&
                transaction.data.result[i].tokenSymbol === 'CGT'
            ) {
                if (
                    !withDrawHash.pid0Hash.includes(transaction.data.result[i].hash)
                    &&
                    !DepositHash.pid0HashDep.includes(transaction.data.result[i].hash)
                ) continue;
                uniqueAddresses.pid0[user].harvestedTokens += Number(transaction.data.result[i].value);
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

        uniqueAddresses.pidOther[user].DUMMYpart = uniqueAddresses.pidOther[user].userTokens / AllUsersTokens;

    }
    fs.writeFile('./logs/CGTpending1.json', JSON.stringify(uniqueAddresses), function (err) {
        if (err) {
            console.log(err);
        }
    });


    let AdminUserTokens = 0;
    for (let admin of Object.keys(uniqueAddresses.pid0)) {
        AdminUserTokens += uniqueAddresses.pid0[admin].userTokens;
    }

    let DataForMerkleTree = [];

    for (let user of Object.keys(uniqueAddresses.pidOther)) {
        let amount = AdminUserTokens * uniqueAddresses.pidOther[user].DUMMYpart
        let address = user;
        DataForMerkleTree.push({address, amount})

    }

    fs.writeFile('./logs/DataForMerkleTree.json', JSON.stringify(DataForMerkleTree), function (err) {
        if (err) {
            console.log(err);
        }
    });


    let totalFunds = 0;
    let gIndex = 0;
    const elements = DataForMerkleTree.map((x) => {
        const index = gIndex++;
        const address = x.address;
        const amount = new BigNumber(x.amount).multipliedBy(1).toString(10);
        if (address.length !== 42) throw new Error();
        const packed = pack([index, address, amount], [256, 160, 256]);
        totalFunds += amount * 1;
        return {leaf: Buffer.from(packed, 'hex'), index: index, address: address, amount};
    });

    const merkleTree = new MerkleTree(elements.map(x => x.leaf));

    const root = merkleTree.getHexRoot();
    console.info('root', root);
    console.info('totalFunds', totalFunds);

    fs.writeFileSync('./logs/merkle-tree.json',
        JSON.stringify(elements.map((x) => {
            return {proofs: merkleTree.getHexProof(x.leaf), index: x.index, address: x.address, amount: x.amount};
        })), 'utf8');


    return root
}

module.exports = {
    GetMerkleHash
};