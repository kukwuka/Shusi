const TestERC20 = artifacts.require("TestERC20");
const GetMerkleHash = require("../index.js")

module.exports = function (deployer) {
    GetMerkleHash(0, 'latest');
    deployer.deploy(TestERC20,"Test", "Test",);

};
