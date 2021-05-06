const TestERC20 = artifacts.require("TestERC20");
const MerkleDistributor = artifacts.require("MerkleDistributor");
const {GetMerkleHash} = require("../GetMerkleHash");

module.exports = async (deployer) => {
    let root = await GetMerkleHash(0, 'latest','../');
    // let root = "0xf6cacdc654b43466e94e7ccd9da4c0964faa560b256bfae6763340d6487c83a6";
    await deployer.deploy(TestERC20, "Test", "Test", 0);
    await deployer.deploy(MerkleDistributor, TestERC20.address, root);
};
