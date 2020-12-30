const Buffer = require('buffer').Buffer;
const Keygrip = require('keygrip');
const keys = require('../../config/keys');


const keygrip = new Keygrip([keys.cookieKey]);

module.exports= (user) => {
    const sessionObject = {
        passport: {
            user: user._id.toString()
        }
    };
    const session = Buffer.from(
    JSON.stringify(sessionObject)
    ).toString('base64');
    const dakey = 'session=' + session
    const sig = keygrip.sign(dakey);

    return { session, sig };
};