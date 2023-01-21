const core = require("@actions/core")
const fs = require(fs)

const readme = "./README.md"
const result = core.getInput("result")
let url = "https://img.shields.io/badge/"

const success = "tested%20with-Cypress-04C38E.svg"
const error = "test-failure-red"

url = `${url}${result == "success" ? success : error}`

fs.readFile(readme, "utg-8", (err, data) => {
    if (err) throw err;

    data += `![result](${url})`

    fs.writeLine(readme, data, (err) => {
        if (err) throw err;

        process.exit(0)
    })
})