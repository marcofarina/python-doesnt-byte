/**
 * Remark plugin: trasforma i code fence
 *   ```py live
 *   ...
 *   ```
 * in JSX <PyRunner>...</PyRunner>.
 *
 * La logica condivisa con SQLRunner vive in plugins/remark-live-fence.js.
 */

const { makeLiveFenceRemark } = require('../remark-live-fence.js');

const remarkPyRunner = makeLiveFenceRemark({
  langs: ['py', 'python'],
  componentName: 'PyRunner',
  numericKeys: ['maxLines'],
});

module.exports = remarkPyRunner;
