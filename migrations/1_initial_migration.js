const TestERC20 = artifacts.require("TestERC20");
const MerkleDistributor = artifacts.require("MerkleDistributor");
const {GetMerkleHash} = require("../GetMerkleHash");

module.exports = async (deployer) => {
    let root = await GetMerkleHash(0, 'latest','../');
    // let root = "0x0057700262a09e9aa61bce7c48036e03abcfe519dbbe76a7035be3d77e6a7c04";
    await deployer.deploy(TestERC20, "Test", "Test", 0);
    await deployer.deploy(MerkleDistributor, TestERC20.address, root);
};
