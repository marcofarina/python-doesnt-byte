/**
 * Remark plugin: trasforma i code fence
 *   ```sql live [dataset=... stateful maxRows=...]
 *   ...
 *   ```
 * in JSX <SQLRunner>...</SQLRunner>.
 *
 * Meta booleani riconosciuti dal componente (passano come prop senza valore):
 *   stateful     il DB sopravvive tra un'esecuzione e l'altra
 *   runOnMount   esegue al caricamento della pagina
 *   readonly     editor non modificabile
 *   hideQuery    mostra solo la tabella del risultato; la query compare a
 *                richiesta («Mostra la query») e parte da sola al caricamento
 *
 * La logica condivisa con PyRunner vive in plugins/remark-live-fence.js.
 */

const { makeLiveFenceRemark } = require('../remark-live-fence.js');

const remarkSqlRunner = makeLiveFenceRemark({
  langs: ['sql'],
  componentName: 'SQLRunner',
  numericKeys: ['maxLines', 'maxRows', 'timeout'],
});

module.exports = remarkSqlRunner;
