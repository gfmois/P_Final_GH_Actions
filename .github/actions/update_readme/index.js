const core = require("@actions/core")
const _fs = require("fs")

const readme = "./README.md"
const result = core.getInput("result") || "success"

const success = "https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg"
const failure = "https://img.shields.io/badge/test-failure-red"

let resultBadge = result == 'success' ? success : failure

_fs.readFile(readme, "utf8", (err, data) => {
    let pos = data.indexOf('[test_result_badge]')

    console.log(pos);
    
    if (err) throw err;

    if (pos != -1) {
        console.log(`[${resultBadge}]`);
        data = data.replace('[test_result_badge]', `[${resultBadge}]`)
    } else {
        if (data.indexOf(`[${failure}]`) != -1 && result == 'success') {
            data = data.replace(`[${failure}]`, `[${success}]`)
        }

        if (data.indexOf(`[${success}]`) != -1 && result == 'failure') {
            data = data.replace(`[${success}]`, `[${failure}]`)
        }
    }


    _fs.writeFile(readme, data, (err) => {
        if (err) throw err;

        process.exit(0)
    })
})