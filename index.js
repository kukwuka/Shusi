const yargs = require('yargs');
const {hideBin} = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;

const {GetMerkleHash} = require("./GetMerkleHash");

try {
    if (!argv.s && !argv.e) {
        console.log('Input node index.js --s=[Number] --e=[Number]')
    } else {
        GetMerkleHash(argv.s, argv.e);
    }
} catch (e) {
    console.error(e)
}