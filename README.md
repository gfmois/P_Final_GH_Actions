# PRÁCTICA FINAL GITHUB ACTIONS  MOISÉS GUEROLA

### LINTER
> Creamos un workflow dentro de la carpeta `.github/workflows` llamado `p_final_gh_actions_workflow.yml` el cual dentro tendrá la primera configuración, que será el `linter`, para ello creamos un job que dentro tendrá un step que comprobará el código haciendo uso de la action `actions/checkout@v2` y del script del `package.json`.

// WORKFLOW

// AQUÍ IRÁ LA IMAGEN ERROR

> Como vemos cuando lo lanzamos por primera vez el `linter` devuelve error, esto es porque dentro del código existen errores que hacen que falle, estos errores son:
> * El uso de comillas simples y no comillas dobles.
> * El `default` del `case` de dentro del archivo `./pages/api/users/[id].js` no es la última opción.
> * Una variable, en el arvhivo `./pages/api/users/[id].js` usa `var` y no `const` o `let`.
>
> Una vez cambiado todo esto si subimos los cambios el workflow debería haber funcionado:

// AQUÍ FOTO DE QUE SI QUE VA


### CYPRESS
> Creamos un job dentro del workflow creado antes y en este añadimos dos steps, el primero el `checkout` y el segnudo que se encargará de llamar a la action de cypress.
> Para usar la action primero lo que hacemos es hacer un `build` de la aplicación y despues iniciamos los tests, además añadimos el archivo de configuración que tenemos en nuestro proyecto ya creado `cypress.json` dentro del `with` del step de cypress justo antes de hacer el build.
Especificamos que queremos que siga aunque los test fallen para que en el siguiente step cree un archivo llamado `result.txt` el cual guardará el resultado de los tests y el último step será para poder parsar ese `txt` a otro job y le añadimos un `id` para poder llamarlo y saber el resultado de los tests, en este caso el siguiente que se encargará de añadir una badge si todo ha ido bien o no.

// WORKFLOW DE CYPRESS