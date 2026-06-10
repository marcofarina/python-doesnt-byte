/**
 * Remark plugin: trasforma i code fence
 *   ```sql live [dataset=... stateful maxRows=...]
 *   ...
 *   ```
 * in JSX <SQLRunner>...</SQLRunner>.
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
