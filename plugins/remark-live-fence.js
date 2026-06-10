/**
 * Factory condivisa per i remark plugin "live fence": trasforma i code fence
 *   ```<lang> live [key=value ...]
 * in un elemento JSX (<PyRunner>, <SQLRunner>, ...) con il sorgente passato
 * come prop `code`.
 *
 * Usata da plugins/pyrunner/remark.js e plugins/sqlrunner/remark.js.
 * Convive con i fence normali (```py senza `live` resta un code block).
 */

function isLiveMeta(meta) {
  if (!meta) return false;
  // meta è una stringa tipo "live" o "live readonly title=foo" ecc.
  return /(^|\s)live(\s|=|$)/.test(meta);
}

function parseMeta(meta, { numericKeys, file, langLabel }) {
  // Estrae chiave/valore. Supporta "live" (booleano implicito) e "key=value".
  const out = {};
  if (!meta) return out;
  const tokens = meta.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  for (const tok of tokens) {
    const eq = tok.indexOf('=');
    if (eq === -1) {
      if (tok === 'live') continue; // marker, niente prop
      out[tok] = true;
    } else {
      const key = tok.slice(0, eq);
      let value = tok.slice(eq + 1);
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      if (key === 'live') continue;
      // Meta numerici (maxLines, maxRows, ...): un valore non numerico
      // verrebbe silenziosamente rimpiazzato dal default a runtime — meglio
      // un warning a build time, con il file incriminato.
      if (numericKeys.has(key) && !/^\d+$/.test(value)) {
        console.warn(
          `[${langLabel}] ${file?.path ?? '(file sconosciuto)'}: meta "${key}=${value}" non è un numero — verrà usato il default.`,
        );
      }
      out[key] = value;
    }
  }
  return out;
}

function toMdxAttributes(propsObj) {
  const attrs = [];
  for (const [name, value] of Object.entries(propsObj)) {
    if (value === true) {
      attrs.push({ type: 'mdxJsxAttribute', name, value: null });
    } else {
      attrs.push({
        type: 'mdxJsxAttribute',
        name,
        value: String(value),
      });
    }
  }
  return attrs;
}

function makeCodeAttribute(code) {
  // Passa il codice come prop `code={"..."}` con expression letterale.
  // Più sicuro di un children text node: MDX non re-interpreta il contenuto.
  const literal = JSON.stringify(code);
  return {
    type: 'mdxJsxAttribute',
    name: 'code',
    value: {
      type: 'mdxJsxAttributeValueExpression',
      value: literal,
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          body: [
            {
              type: 'ExpressionStatement',
              expression: {
                type: 'Literal',
                value: code,
                raw: literal,
              },
            },
          ],
        },
      },
    },
  };
}

/**
 * @param {object} options
 * @param {string[]} options.langs       lang dei fence da trasformare (es. ['py', 'python'])
 * @param {string}   options.componentName  nome del componente JSX (es. 'PyRunner')
 * @param {string[]} [options.numericKeys]  meta che devono essere numerici
 */
function makeLiveFenceRemark({ langs, componentName, numericKeys = [] }) {
  const langSet = new Set(langs);
  const numericSet = new Set(numericKeys);
  return function remarkLiveFence() {
    return async (tree, file) => {
      const { visit } = await import('unist-util-visit');
      visit(tree, 'code', (node, index, parent) => {
        if (!parent || index == null) return;
        if (!langSet.has(node.lang)) return;
        if (!isLiveMeta(node.meta)) return;

        const props = parseMeta(node.meta, {
          numericKeys: numericSet,
          file,
          langLabel: componentName,
        });
        const attributes = [
          ...toMdxAttributes(props),
          makeCodeAttribute(node.value),
        ];

        const jsxNode = {
          type: 'mdxJsxFlowElement',
          name: componentName,
          attributes,
          children: [],
        };

        parent.children.splice(index, 1, jsxNode);
      });
    };
  };
}

module.exports = { makeLiveFenceRemark };
