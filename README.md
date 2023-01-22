# PRÁCTICA FINAL GITHUB ACTIONS  MOISÉS GUEROLA

[success]: https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg
[failure]: https://img.shields.io/badge/test-failure-red
[EndBug/add-and-commit@v9]: https://github.com/EndBug/add-and-commit

## RESULTADO DE LOS ÚLTMOS TESTS

![cypress_result](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)

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

> Para que funcione la action tenemos que compilarla usando el `ncc` de paquete de vercel `@vercel/ncc` ejecutando el comando `npm run build` de dentro de la carpeta de la action o usando desde la terminal `ncc build index.js` nos crea un directorio nuevo llamado `dist` y adentro un fichero `index.js` con nuestro código compilado listo para usarlo en la action.

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
const _fs = require("fs")

const readme = "./README.md"
const result = core.getInput("result") || "success"

const success = "https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg"
const failure = "https://img.shields.io/badge/test-failure-red"

let resultBadge = result == 'success' ? success : failure

_fs.readFile(readme, "utf8", (err, data) => {
    let pos = data.indexOf('(https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)')

    console.log(pos);
    
    if (err) throw err;

    if (pos != -1) {
        console.log(`(${resultBadge})`);
        data = data.replace('(https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)', `(${resultBadge})`)
    } else {
        if (data.indexOf(`(${failure})`) != -1 && result == 'success') {
            data = data.replace(`(${failure})`, `(${success})`)
        }

        if (data.indexOf(`(${success})`) != -1 && result == 'failure') {
            data = data.replace(`(${success})`, `(${failure})`)
        }
    }


    _fs.writeFile(readme, data, (err) => {
        if (err) throw err;

        process.exit(0)
    })
})
```

### Action Funcionando => Tests Pasados
> Para que los tests funcionen vamos al archivo `pages/api/index.js` y modificamos el `POST0` a `POST`, con eso funcionarán todos los tests

![test_success](https://raw.githubusercontent.com/gfmois/P_Final_GH_Actions/main/readme_assets/Badges_Success.PNG)

### Action Funcionando => Tests No Pasados

![test_failure](https://raw.githubusercontent.com/gfmois/P_Final_GH_Actions/main/readme_assets/Badges_Failure.PNG)


[vercel]: https://vercel.com
[p-final-gh-actions]: https://p-final-gh-actions.vercel.app/
[amondnet/vercel-action]: https://github.com/amondnet/vercel-action

### VERCEL
> Nos creamos una cuenta en [Vercel] con `github` y importamos el proyecto de `Next.js` que estámos usando, en la parte de `Build and  Output Settings` habilitamos la opción de `Build Command` para hacer un `Override` y dentro borramos lo que nos deja el input por espacio en blanco:

![vercel-config](https://raw.githubusercontent.com/gfmois/P_Final_GH_Actions/main/readme_assets/VercelConfig.PNG)

> Una vez hecho esto le damos a `Deploy` y nos esperamos ya que se estará desplegando. Una vez desplegado nos generará una url hacia nuestro sitio web, la mia es la siguiente: [p-final-gh-actions]. Hecho esto nos vamos al workflow que tenemos y creamos un nuevo step para configurar `vercel`, en esta caso usaremos la action del siguiente repositorio [amondnet/vercel-action]:

#### WORKFLOW VERCEL
```yml
deploy_job:
  runs-on: ubuntu-latest
  needs: cypress_job
  steps:
    - name: Checkout
      uses: actions/checkout@v3
    - name: Upload to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        working-directory: ./
```

> Como vemos tenemos que configurar varios `secrets`, para ello vamos a `vercel` y dentro del proyecto creado, en el apartado de `settings`, encontraremos el `project-id`, lo copiamos y lo guardamos dentro de los secrets de nuestro repositorio de github, al igual que `vercel-token` y el `vercel-org-id` que se encuentran en los ajustes de la cuenta, dentro de `Tokens`, creamos uno con el nombre que querramos y le damos a generar, automáticamente nos generará uno el cual guardaremos como `VERCEL_TOKEN` y el `vercel-org-id` lo encontraremos en nuestra cuenta abajo de todo como `Your ID`:

#### TOKEN

![vercel-token](https://raw.githubusercontent.com/gfmois/P_Final_GH_Actions/main/readme_assets/Vercel_Settings_Token.PNG)

### VERCEL FUNCIONANDO
  #### GITHUB
  ![vercel-working-gh](https://raw.githubusercontent.com/gfmois/P_Final_GH_Actions/main/readme_assets/Vercel_Working_1.PNG)

  #### VERCEL
  ![vercel-page-1](https://raw.githubusercontent.com/gfmois/P_Final_GH_Actions/main/readme_assets/Vercel_Page_1.PNG)

> Para ver que si que funciona aquí está subido por primera vez y lo que voy a hacer es modificar un poco el `index.js` y poner mi nombre y algo más, subirlo con un push y ver si ha cambiado:

  ### VERCEL CAMBIANDO COSAS

  ![vercel-page-2](https://raw.githubusercontent.com/gfmois/P_Final_GH_Actions/main/readme_assets/Vercel_Page_2.gif)

  > Ahora si vamos a https://p-final-gh-actions-gfmois.vercel.app/ veremos el resultado

### MAIL JOB
> En este job haremos que envie un mensaje a los usuarios del repositorio, para ello creamos un nuevo job en el workflow llamado `notification_job` el cual se esperará a que todos los demás jobs se acaben para ejecutarse y tomará todos los resultados de los jobs anteriores usando una action que vamos a crear, creamos una carpeta dentro de `.github/actions` llamada `notification_action` y dentro ponemos un `action.yml` y un `index.js` que tendrán dentro lo siguiente:

#### INDEX

```js
const core = require('@actions/core')
const nodemailer = require('nodemailer')

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
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
    if (e != null) {
      throw err;
    }
    process.exit(0)
})
```

> Como vemos hay que configurar varios inputs en el `action.yml` para poder pasarselos al index, estos son los resultados de los jobs y la información del correo, tanto quien lo envia como para quien va el correo. Para recoger el resultado de los test simplemente como `notification_job` depende de todos los tests cuando tengamos que pasar por los inputs del with usaremos: `${{ needs.job.result }}` y con eso pasarémos a la action el valor del job que querramos.

> Para poder pasar los datos del correo los pasaremos por `secrets` y para ello tendrémos que configurar un poco el email. Dentro de `gmail` vamos al apartado de `seguridad` y en `Contraseñas para aplicaciones` generamos una, esa contraseña que nos da la copiaremos dentro de los `secrets` del repositorio como `EMAIL_PASSWORD`, tanto `EMAIL_ACCOUNT` como `EMAIL_ADDRESSEE` los dejamos dentro de secrets en texto plano.

#### CONFIGURACIÓN DE EMAIL
![email-nodemailer](https://raw.githubusercontent.com/gfmois/P_Final_GH_Actions/main/readme_assets/NodeMailer_Password_Application.PNG)

> Una vez tenemos configurado el `index.js` y los `secrets` del repositorio vamos a la `action.yml` dentro de nuestra carpeta y añadimos lo siguiente:

```yml
name: Send Email using Mailgun Action
description: Sends an email with the result of the others jobs
inputs:
  result_linter:
    description: Gets the result of the linter's execution job
    required: true
  result_cypress:
    description: Gets the result of the Cypress' execution job
    required: true
  result_badge:
    description: Gets the result of the badge's execution job
    required: true
  result_deploy:
    description: Gets the result of the deploy's execution job
    required: true
  email_user:
    description: Gmail Account
    required: true
  email_password:
    description: Gmail Account
    required: true
  email_addressee:
    description: Where goes the email
    required: true
runs:
  using: "node16"
  main: "dist/index.js"
```

> Mensaje recibido de gmail:

> Nota: Me lo pone partido porque puse mal el nombre de `deploy_job`:

![email-msg](https://raw.githubusercontent.com/gfmois/P_Final_GH_Actions/main/readme_assets/Email_Result.PNG)

[lowlighter/metrics@latest]: https://github.com/lowlighter/metrics
[gfmois]: https://github.com/gfmois/gfmois.git

### METRICS
> Para crear el job para que añada las métricas a nuestro readme personal creamos un nuevo job que utilizará la action [lowlighter/metrics@latest], para ello nos vamos a nuestro repositorio que contiene el README, [gfmois], y añadimos un workflow, el cual dentro contendrá lo siguiente:

```yml
name: Metrics for gfmois
on:
  push:
    branches: main
    
jobs:
  metrics_job:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Metrics Action
        uses: lowlighter/metrics@latest
        with:
          filename: metrics.plugin.activity.svg
          token: ${{ secrets.TOKEN }}
          base: ""
          plugin_activity: yes
          plugin_activity_days: 0
          plugin_activity_filter: issue, pr, release, fork, review, ref/create
```

> Con este workflow creado dentro del repositorio [gfmois] al final del `README` añadimos dentro de una etiqueta `img` el `src` siguiente `/metrics.plugin.activity.svg` con eso al final del archivo, que es donde yo lo he añadido, veremos lo siguiente:

![img-repo](https://raw.githubusercontent.com/gfmois/P_Final_GH_Actions/main/readme_assets/Github_GFMOIS.PNG)
