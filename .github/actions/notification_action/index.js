const core = require('@actions/core')
const nodemailer = require('nodemailer')

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: core.getInput('email_user'),
        pass: core.getInput('email_password')
    }
})

let mailToOptions = {
    from: core.getInput("email_user"),
    to: core.getInput('email_addressee'),
    subject: "Resultado Jobs Práctica Final GH Actions",
    html: `
    Estos son los resultados del último commit del repositorio:
    <ul>
        <li>Linter: ${core.getInput('result_linter')}</li>
    </ul>
    <ul>
        <li>Cypress: ${core.getInput('result_cypress')}</li>
    </ul>
    <ul>
        <li>Badges: ${core.getInput('result_badge')}</li>
    </ul>
    <ul>
        <li>Deploy: ${core.getInput('result_deploy')}</li>
    </ul>
    `
}

transporter.sendMail(mailToOptions, (e) => {
    process.exit(0)
})