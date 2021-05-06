const TestERC20 = artifacts.require("TestERC20");
const MerkleDistributor = artifacts.require("MerkleDistributor");
const {GetMerkleHash} = require("../GetMerkleHash");

module.exports = async (deployer) => {
    let root = await GetMerkleHash(0, 'latest','../');
    await deployer.deploy(TestERC20, "Test", "Test", 0);
    await deployer.deploy(MerkleDistributor, TestERC20.address, root);

};
