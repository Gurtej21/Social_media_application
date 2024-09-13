const nodeMailer= require("nodemailer")

const transporter = nodeMailer.createTransport({
    service: "gmail",
    secure: "false",
    auth: {
      user: "gurtejsinghbakshi2gmail.com",
      pass: "nyif gfcp mjtb fped",
    },
  });

  module.exports = transporter
  