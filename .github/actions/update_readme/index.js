const core = require("@actions/core")
const _fs = require("fs")

const readme = "./README.md"
const result = core.getInput("result") || "success"
let url = "https://img.shields.io/badge/"

const success = "tested%20with-Cypress-04C38E.svg"
const failure = "test-failure-red"

url = `${url}${result == "success" ? success : failure}`

_fs.readFile(readme, "utf-8", (err, data) => {
    if (err) throw err;
    
    if (data.search(success) == -1) {
        data += url
    } else {
        data.replace(success, url)
    }

    _fs.writeFile(readme, data, (err) => {
        if (err) throw err;

        process.exit(0)
    })
})