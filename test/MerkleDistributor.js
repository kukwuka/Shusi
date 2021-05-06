const TestERC20 = artifacts.require("TestERC20");
const MerkleDistributor = artifacts.require("MerkleDistributor");


contract('MerkleDistributor', (accounts) => {
    it('Check Test token', async () => {
        const TestTokenInstance = await TestERC20.deployed();
        const TokenName = await TestTokenInstance.name();
        assert.equal("Test", TokenName);
    })
});