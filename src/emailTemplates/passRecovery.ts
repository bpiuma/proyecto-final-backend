'use strict'

const nodemailer = require('nodemailer');
require('dotenv').config();

export const send_mail_recovery = (name: string, mail: string, token: string) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAILUSER,
            pass: process.env.MAILPSSWD
        }
    });

    // reemplazamos todos los "." por "$"
    let nToken = token.replace(".","$")
    let newToken = nToken.replace(".","$")

    let mail_options = {
        from: 'wineandsenses@gmail.com',
        to: mail,
        subject: 'Restore password',
        html: `
            <table border="0" cellpadding="0" cellspacing="0" width="600px" bgcolor="#C4C4C4" style="color: #5E0000; text-align:center">
                <tr height="100px">  
                    <td bgcolor="" width="600px">
                        <h2 style="color: #5E0000; text-align:center">Hello <span style="color: black">${name}</span></h2>
                        <p  style="color: #5E0000; text-align:center">
                            We have received a password reset request for your account.<br>
                            To continue, click on the button below.<br>
                            Please note that this link expires in one hour.
                        </p>
                    </td>
                </tr>
                <tr height="100px" bgcolor="">
                    <td style="color: #fff; text-align:center">
                        <a href=${process.env.PASSWORD_RECOVERY_URL + newToken} class="button"
                                style="
                                background-color: #5E0000;
                                border: none;
                                border-radius: 50px;
                                color: white;
                                padding: 15px 32px;
                                text-align: center;
                                text-decoration: none;
                                display: inline-block;
                                font-size: 16px;
                                cursor: pointer">
                            Change Password
                        </a>
                    </td>
                </tr>   
            </table>
        `
    };
    transporter.sendMail(mail_options, (error: any, info: { response: string; }) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email successfully sent ' + info.response);
        }
    });
};