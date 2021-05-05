const BigNumber = require('bignumber.js');

function decToHex(dec, lengthIn)
{
    let length = lengthIn;
    if (!length) length = 32;
    if (dec < 0)
    {
        // return convertBase((Math.pow(2, length) + decStr).toString(), 10, 16);
        return (new BigNumber(2)).pow(length).add(new BigNumber(dec)).toString(16);
    }
    let result = null;
    try
    {
        result = convertBase(dec.toString(), 10, 16);
    }
    catch (err)
    {
        result = null;
    }
    if (result)
    {
        return result;
    }
    return (new BigNumber(dec)).toString(16);
}

function zeroPad(num, places)
{
    const zero = (places - num.toString().length) + 1;
    return Array(+(zero > 0 && zero)).join('0') + num;
}

function pack(dataIn, lengths)
{
    let packed = '';
    const data = dataIn.map((x) => x);
    for (let i = 0; i < lengths.length; i += 1)
    {
        console.log(data[i]);
        if (typeof (data[i]) === 'string' && data[i].substring(0, 2) === '0x')
        {
            if (data[i].substring(0, 2) === '0x') data[i] = data[i].substring(2);
            packed += zeroPad(data[i], lengths[i] / 4);
        }
        else if (typeof (data[i]) !== 'number' && !(data[i] instanceof BigNumber) && /[a-f]/.test(data[i]))
        {
            if (data[i].substring(0, 2) === '0x') data[i] = data[i].substring(2);
            packed += zeroPad(data[i], lengths[i] / 4);
        }
        else
        {
            packed += zeroPad(decToHex(data[i], lengths[i]), lengths[i] / 4);
        }
    }
    return packed;
}


module.exports = {
    decToHex, zeroPad, pack
};