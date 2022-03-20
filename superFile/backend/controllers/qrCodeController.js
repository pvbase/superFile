var qr = require("qr-image");
var fs = require("fs");

//var qr_svg = qr.image("0123456789a, mehul patel, IV C, 13/11/2020, 34343.33, Cash", { type: 'svg' });
//qr_svg.pipe(require('fs').createWriteStream('i_love_qr.svg'));

// var svg_string = qr.imageSync("e-c4au_b]g4aua0u eue4f0dibLuuRi?duf)d!c%c)i-b(bib\b^i`Rb\"d u", { type: 'svg' });
// var svg_string = qr.imageSync("http://www.google.com", { type: "svg" });

exports.generateQrCode = async function (url) {
  var svg_string = qr.imageSync(url, { type: "svg" });
  return svg_string;
};
