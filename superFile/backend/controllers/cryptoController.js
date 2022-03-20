var CryptoJS = require("crypto-js");
var secretKey = "ZqMongoSecretKey";

async function encryption(text) {
  var encrypted = CryptoJS.AES.encrypt(String(text), secretKey).toString();
  //   var encrypted = CryptoJS.AES.encrypt(
  //     JSON.stringify(text),
  //     secretKey
  //   ).toString();
  return encrypted;
}

async function decryption(encryptedText) {
  var decryptedText = CryptoJS.AES.decrypt(encryptedText, secretKey).toString(
    CryptoJS.enc.Utf8
  );
  // var decryptedText = JSON.parse(CryptoJS.AES.decrypt(String(encryptedText), secretKey).toString(CryptoJS.enc.Utf8))
  return decryptedText;
}

module.exports = { decryption, encryption };
