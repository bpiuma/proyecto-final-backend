'use strict';
exports.__esModule = true;
exports.send_mail = void 0;
var nodemailer = require('nodemailer');
require('dotenv').config();
var send_mail = function (name, mail, token) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAILUSER,
            pass: process.env.MAILPSSWD
        }
    });
    // reemplazamos todos los "." por "$"
    var nToken = token.replace(".", "$");
    var newToken = nToken.replace(".", "$");
    var mail_options = {
        from: 'wineandsenses@gmail.com',
        to: mail,
        subject: 'Restablecer contraseña',
        html: "\n            <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600px\" bgcolor=\"#C4C4C4\" style=\"color: #5E0000; text-align:center\">\n                <tr height=\"100px\">  \n                    <td bgcolor=\"\" width=\"600px\">\n                        <h2 style=\"color: #5E0000; text-align:center\">Hola <span style=\"color: black\">" + name + "</span></h2>\n                        <p  style=\"color: #5E0000; text-align:center\">\n                            Hemos recibido una solicitud de restablecimiento de contrase\u00F1a de tu cuenta.<br>\n                            Para continuar, haz click en el bot\u00F3n que aparece a continuaci\u00F3n:\n                        </p>\n                    </td>\n                </tr>\n                <tr height=\"100px\" bgcolor=\"\">\n                    <td style=\"color: #fff; text-align:center\">\n                        <a href=" + (process.env.PASSWORD_RECOVERY_URL + newToken) + " class=\"button\"\n                                style=\"\n                                background-color: #5E0000;\n                                border: none;\n                                border-radius: 50px;\n                                color: white;\n                                padding: 15px 32px;\n                                text-align: center;\n                                text-decoration: none;\n                                display: inline-block;\n                                font-size: 16px;\n                                cursor: pointer\">\n                            Cambiar contrase\u00F1a\n                        </a>\n                    </td>\n                </tr>   \n            </table>\n        "
    };
    transporter.sendMail(mail_options, function (error, info) {
        if (error) {
            console.log(error);
        }
        else {
            console.log('Email successfully sent ' + info.response);
        }
    });
};
exports.send_mail = send_mail;
