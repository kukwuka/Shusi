const TestERC20 = artifacts.require("TestERC20");
const MerkleDistributor = artifacts.require("MerkleDistributor");
const {constants} = require('ethers')


contract('MerkleDistributor', (accounts) => {

    contract('MerkleDistributor', (accounts) => {

        it('Check Test token', async () => {
            const TestTokenInstance = await TestERC20.deployed();
            const TokenName = await TestTokenInstance.name();

            assert.equal("Test", TokenName);
        })

        it("Claim", async () => {
            const Merkletree = require("../logs/merkle-tree.json");

            const TestTokenInstance = await TestERC20.deployed();
            const MerkleDistributorInstance = await MerkleDistributor.deployed();

            await TestTokenInstance.setBalance(MerkleDistributor.address, constants.MaxUint256)

            for (let UserProof of Merkletree) {
                const receipt = await MerkleDistributorInstance.claim(UserProof.index, UserProof.address, UserProof.amount, UserProof.proofs);

                assert.equal(receipt.logs.length, 1, 'triggers one event');
                assert.equal(receipt.logs[0].event, 'Claimed', 'should be the "Transfer" event');
                assert.equal(receipt.logs[0].args.index, UserProof.index, 'correct index');
                assert.equal(receipt.logs[0].args.account.toLowerCase(), UserProof.address, 'correct address');
                assert.equal(receipt.logs[0].args.amount, UserProof.amount, 'correct amount');
            }

        });
    });
});