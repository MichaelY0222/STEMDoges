const QRCode = require('weapp-qrcode');  // Use weapp-qrcode to generate QR code

function generateQRCode(canvasId, data) {
  return new Promise((resolve, reject) => {
    QRCode({
      text: data,  // The string to encode in the QR code
      width: 300,  // Width of the QR code
      height: 300, // Height of the QR code
      canvasId: canvasId, // The canvas element id where the QR code will be drawn
      callback: function (res) {
        if (res.errMsg === 'createQRCode:ok') {
          resolve('QR code generated successfully!');
        } else {
          reject('Error generating QR code: ' + res.errMsg);
        }
      }
    });
  });
}

module.exports = {
  generateQRCode,
};
