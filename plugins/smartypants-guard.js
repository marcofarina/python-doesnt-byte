// Guard per remark-smartypants.
//
// smartypants converte gli apici dritti della prosa in virgolette curve, ma
// salta solo i nodi `code`/`inlineCode` del Markdown e gli elementi HTML
// style/script. Non conosce i NOSTRI componenti che renderizzano codice via
// children testuali — in particolare <InlineCode>, che produce un <code> e il
// cui contenuto (es. kind="string" con "Hello, World!") DEVE mantenere gli
// apici dritti perché è codice, non prosa.
//
// Strategia: due trasformatori remark da mettere attorno a smartypants
// (`remarkPlugins: [protectCode, smartypants, restoreCode]`). `protectCode`
// sostituisce gli apici dentro questi componenti con un placeholder della
// stessa lunghezza (così smartypants non li tocca e gli indici di splice
// restano validi); `restoreCode` rimette i valori originali. Lo stash viaggia
// su `file.data`, condiviso fra i due trasformatori per lo stesso file.

// Componenti i cui children testuali sono codice e non vanno "smart-quotati".
// Estendere qui se in futuro si aggiungono altri componenti code-like.
const CODE_COMPONENTS = new Set(['InlineCode']);

// Placeholder: un carattere qualunque NON-apice, lunghezza 1, per preservare
// la lunghezza del testo (smartypants splicea per indici).
const PLACEHOLDER = '·'; // middle dot, improbabile nel codice sorgente

function collectProtectedTextNodes(node, inside, out) {
  if (!node || typeof node !== 'object') return;

  const isCodeComponent =
    (node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') &&
    typeof node.name === 'string' &&
    CODE_COMPONENTS.has(node.name);

  const within = inside || isCodeComponent;

  if (within && node.type === 'text' && typeof node.value === 'string') {
    out.push(node);
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      collectProtectedTextNodes(child, within, out);
    }
  }
}

function protectCode() {
  return (tree, file) => {
    const nodes = [];
    collectProtectedTextNodes(tree, false, nodes);

    const stash = [];
    for (const node of nodes) {
      if (/['"]/.test(node.value)) {
        stash.push([node, node.value]);
        node.value = node.value.replace(/['"]/g, PLACEHOLDER);
      }
    }
    file.data.__smartypantsGuard = stash;
  };
}

function restoreCode() {
  return (tree, file) => {
    const stash = file.data.__smartypantsGuard;
    if (!stash) return;
    for (const [node, value] of stash) {
      node.value = value;
    }
    delete file.data.__smartypantsGuard;
  };
}

module.exports = { protectCode, restoreCode };
