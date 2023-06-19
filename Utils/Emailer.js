const nodemailer = require("nodemailer");

class Emailer {

     sendEmail = async (email, subject, text) => {
        try {
            const transporter = nodemailer.createTransport({
                service: "hotmail",
                auth: {
                    user: "rinder0001@outlook.com",
                    pass: "creamcheese10!"
                }
            });

            const options = {
                from: "rinder0001@outlook.com",
                to: email,
                subject: subject,
                text: text
            };

            transporter.sendMail(options, function(err, info) {
                if (err) {
                    console.log(err);
                    return err;
                }
                console.log("sent: ", info.response);
                return info.response;
            })

        }
        catch (err) {
            console.log("error: ", err);
            return err;
        }
    }

}


module.exports = new Emailer(); 