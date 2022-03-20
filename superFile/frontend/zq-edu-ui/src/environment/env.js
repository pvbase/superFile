const prod = {
    type: 'prod',
    zqBaseUri: 'https://apiuat.zenqore.com',
    gstinApi: 'https://apiuat.zenqore.com'
}
const passive = {
    type: 'passive',
    zqBaseUri: 'https://apiuat.zenqore.com',
    automationUri: 'https://apidev.zenqore.com/test', //Only for Selenium automation
    gstinApi: 'https://apiuat.zenqore.com'
}
const dev = {
    type: 'dev',
    // zqBaseUri: 'https://extapidev.zenqore.com', //test environment
    zqBaseUri: 'https://apidev.zenqore.com', //local environment
    gstinApi: 'https://apiuat.zenqore.com',
    studentUpload: 'http://34.224.12.104:8080'
}
export default { dev, passive, prod }
