const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = require('twilio')(accountSid, authToken, {
    lazyLoading: true
});

async function configFunction(message, senderId) {
    try {
        client.messages
            .create({
                from: 'whatsapp:+14155238886',
                body: message,
                to: senderId
            })
            .then(message => console.log(message.sid));
    }
    catch (err) {
        console.log(`Error at Sending Message--> ${err}`)
    }
}
async function whatsapp(req, res) {
    let twilioBody = req.body
    let senderId = twilioBody.From
    let message = twilioBody.Body  //message from user
    console.log(twilioBody)
    await configFunction(`Hello from the other side + ${message}`, senderId)
}
async function messageSentCallback(req, res) {
    let twilioBody = req.body
    let senderId = twilioBody.From
    let message = twilioBody.Body
    console.log(twilioBody)
    // await configFunction('Hello from the other side', senderId)
}
module.exports = {
    whatsapp: whatsapp,
    messageSentCallback: messageSentCallback
}