import Layout from '@theme/Layout';
import NotFoundContent from '@theme/NotFound/Content';

// Pagina 404 a tutto schermo (rotte fuori dai volumi). Il contenuto Star Wars
// vive in @theme/NotFound/Content, così lo riusa anche il DocRoot swizzlato per
// i 404 *dentro* un volume (path sotto un routeBasePath ma senza doc): vedi
// src/theme/DocRoot/index.tsx, che renderizza <NotFoundContent /> quando non
// trova il doc.
export default function NotFound(): JSX.Element {
  return (
    <Layout>
      <NotFoundContent />
    </Layout>
  );
}
