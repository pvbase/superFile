let jwt = require("jsonwebtoken");
var jwtSecret = require("./secretkeys");
let checkToken = (req, res, next) => {
    let token = req.headers["authorization"];
    let apiSource = req.headers.client;
    let secretKey;
    if (apiSource) secretKey = jwtSecret[apiSource].jwtSecret
    else secretKey = jwtSecret["zq"].jwtSecret
    console.log(secretKey)
    // Express headers are auto converted to lowercase
    if (token) {
        return jwt.verify(token, secretKey, (err, decoded) => {
            console.log("jwt1", err, decoded);
            if (err) {
                return { response: false, decoded };
            } else {
                req.decoded = decoded;
                return { response: true, decoded };
            }
        });
    } else {
        return res.json({
            success: false,
            message: "Auth token is not found",
        });
    }
};
module.exports = {
    checkToken: checkToken,
};
