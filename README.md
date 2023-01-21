# PRÁCTICA FINAL GITHUB ACTIONS  MOISÉS GUEROLA

[success]: https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg
[failure]: https://img.shields.io/badge/test-failure-red
[EndBug/add-and-commit@v9]: https://github.com/EndBug/add-and-commit

![cypress_result](https://img.shields.io/badge/test-failure-red)

### LINTER
> Creamos un workflow dentro de la carpeta `.github/workflows` llamado `p_final_gh_actions_workflow.yml` el cual dentro tendrá la primera configuración, que será el `linter`, para ello creamos un job que dentro tendrá un step que comprobará el código haciendo uso de la action `actions/checkout@v2` y del script del `package.json`.

```yml
  linter_job:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout lint
        uses: actions/checkout@v2
      - run: npm install
      - run: npm run lint
```

<img src="https://raw.githubusercontent.com/gfmois/P_Final_GH_Actions/main/readme_assets/Linter_Workflow_Error.png" />

> Como vemos cuando lo lanzamos por primera vez el `linter` devuelve error, esto es porque dentro del código existen errores que hacen que falle, estos errores son:
> * El uso de comillas simples y no comillas dobles.
> * El `default` del `case` de dentro del archivo `./pages/api/users/[id].js` no es la última opción.
> * Una variable, en el arvhivo `./pages/api/users/[id].js` usa `var` y no `const` o `let`.
>
> Una vez cambiado todo esto si subimos los cambios el workflow debería haber funcionado:

<img src="https://raw.githubusercontent.com/gfmois/P_Final_GH_Actions/main/readme_assets/Linter_Workflow_Success.png" />


### CYPRESS
> Creamos un job dentro del workflow creado antes y en este añadimos dos steps, el primero el `checkout` y el segnudo que se encargará de llamar a la action de cypress.
> Para usar la action primero lo que hacemos es hacer un `build` de la aplicación y despues iniciamos los tests, además añadimos el archivo de configuración que tenemos en nuestro proyecto ya creado `cypress.json` dentro del `with` del step de cypress justo antes de hacer el build.
Especificamos que queremos que siga aunque los test fallen para que en el siguiente step cree un archivo llamado `result.txt` el cual guardará el resultado de los tests y el último step será para poder parsar ese `txt` a otro job y le añadimos un `id` para poder llamarlo y saber el resultado de los tests, en este caso el siguiente que se encargará de añadir una badge si todo ha ido bien o no.

```yml
cypress_job:
    runs-on: ubuntu-latest
    needs: linter_job
    steps:
      - name: Checkout 
        uses: actions/checkout@v3
      - name: Cypress Run
        uses: cypress-io/github-action@v5
        with:
          config-file: cypress.json
          build: npm run build
          start: npm start
        continue-on-error: true
        id: cypressTests
      - name: Guardar resultado en Result.txt
        run: echo ${{ steps.cypressTests.outcome }} > result.txt
      - name: Upload Artifact Result
        uses: actions/upload-artifact@v3
        with:
          name: test_result
          path: result.txt
```

### BADGES
> Creamos un job debajo del job anterior, este se encargará de poner un `badge` dentro del `README`, el cual irá cambiando dependiendo del resultado de los tests que le pasará por `artifact` el job de cypress. Una vez tenga el resultado del job se irá a una action que hemos creado nosotros pasandole la información del resultado y modificará el readme cambiando la badge por uno como que todo ha ido bien [success] o como que ha ido mal [failure]. Una vez se haya modificado se se hará un push y este se hará en el step con la action [EndBug/add-and-commit@v9] añadiendo la información del `pusher` y con el mensaje `Result of the tests on Cypress`.

> Nota: He tenido que modificar los ajustes del repositorio para que el workflow tuviera todos los permisos de lectura y escritura sino no me dejaba modificar el readme desde la action.

#### JOB BADGES
```yml
badge_job:
    runs-on: ubuntu-latest
    needs: cypress_job
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Get Result from Artifact
        uses: actions/download-artifact@v3
        with:
          name: test_result
      - name: Get Result Value
        run: echo "::set-output name=cypress_outcome::$(cat result.txt)"
        id: result_cypress_tests
      - name: Update Readme
        uses: "./.github/actions/update_readme"
        with:
          result: ${{ steps.result_cypress_tests.outputs.cypress_outcome }}
      - name: Commit Readme Changes
        uses: EndBug/add-and-commit@v9
        with:
          add: "."
          author_name: ${{ github.event.pusher.name }}
          autho_email: ${{ github.event.pusher.email }}
          message: "Result of the tests on Cypress"
          push: true
```

#### ACTION PARA ACTUALIZAR EL README
```yml
name: Update Readme Actions
description: Takes the result of the tests and updates the readme adding an badge
inputs:
  result:
    description: Gets the result of Cypress
    required: true
runs:
  using: "node16"
  main: "dist/index.js"
```

#### INDEX.JS DE LA ACTION
```js
const core = require("@actions/core")
const fs = require("fs")

const readme = "./README.md"
const result = core.getInput("result")
let url = "https://img.shields.io/badge/"

const success = "tested%20with-Cypress-04C38E.svg"
const failure = "test-failure-red"

url = `${url}${result == "success" ? success : failure}`

fs.readFile(readme, "utf-8", (err, data) => {
    if (err) throw err;

    if (data.search(success) == -1) {
        data.replace(success, url)
    }

    fs.writeFile(readme, data, (err) => {
        if (err) throw err;

        process.exit(0)
    })
})
```