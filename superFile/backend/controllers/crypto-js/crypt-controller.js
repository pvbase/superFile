var CryptoJS = require("crypto-js");
var secretKey = 'ZqMongoSecretKey'


module.exports = encryption = async (text) => {
    // var encrypted = CryptoJS.AES.encrypt(String(text), secretKey).toString()
    var encrypted = CryptoJS.AES.encrypt(JSON.stringify(text), secretKey).toString()
    return encrypted
}

module.exports = decryption = async (encryptedText) => {
    // var decryptedText = CryptoJS.AES.decrypt(encryptedText, secretKey).toString(CryptoJS.enc.Utf8);
    var decryptedText = JSON.parse(CryptoJS.AES.decrypt(String(encryptedText), secretKey).toString(CryptoJS.enc.Utf8))
    return decryptedText
}