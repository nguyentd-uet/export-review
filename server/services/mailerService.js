const nodemailer = require('nodemailer');

module.exports.sendMail = function (toEmail, html) {

    // create reusable transporter object using the default SMTP transport
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'nguyentd1501.uet@gmail.com',
            pass: 'ducnguyen1501'
        }
    });

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"Nguyen Tran 👻"', // sender address
        to: toEmail, // list of receivers
        subject: 'Completed crawl', // Subject line
        text: 'You recieved message from Nguyen Tran 👻', // plaintext body
        html: html // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });
}