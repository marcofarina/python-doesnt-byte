/**
 * Remark plugin: trasforma i code fence
 *   ```py live
 *   ...
 *   ```
 * in JSX <PyRunner>...</PyRunner>.
 *
 * Convive con i code fence normali (```py senza `live` resta un normale code block).
 */

function isLiveMeta(meta) {
  if (!meta) return false;
  // meta è una stringa tipo "live" o "live readonly title=foo" ecc.
  return /(^|\s)live(\s|=|$)/.test(meta);
}

function parseMeta(meta) {
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

function remarkPyRunner() {
  return async (tree) => {
    const { visit } = await import('unist-util-visit');
    visit(tree, 'code', (node, index, parent) => {
      if (!parent || index == null) return;
      if (node.lang !== 'py' && node.lang !== 'python') return;
      if (!isLiveMeta(node.meta)) return;

      const props = parseMeta(node.meta);
      const attributes = [
        ...toMdxAttributes(props),
        makeCodeAttribute(node.value),
      ];

      const jsxNode = {
        type: 'mdxJsxFlowElement',
        name: 'PyRunner',
        attributes,
        children: [],
      };

      parent.children.splice(index, 1, jsxNode);
    });
  };
}

module.exports = remarkPyRunner;
