// Dati della campagna Value 4 Value.
//
// ⚠️ PLACEHOLDER — aggiorna a mano questi valori.
//   - `raised`: euro raccolti finora (la barra obiettivi si calcola su questo);
//   - `milestones`: i traguardi (l'ultimo è il massimo della barra);
//   - `DONORS`: l'elenco dei sostenitori (tier 3 = ringraziamento speciale).
// Quando avrai dati reali, sostituiscili qui: il resto della pagina si adatta.

import type { IconName } from '@site/src/components/Icon';

export interface Milestone {
  amount: number;
  title: string;
  desc: string;
  icon: IconName;
}

export interface Donor {
  name: string;
  /** 1 = sostenitore · 2 = ricorrente · 3 = ringraziamento speciale (cuore) */
  tier: 1 | 2 | 3;
}

export const V4V_GOALS = {
  currency: '€',
  raised: 4, // PLACEHOLDER
  year: 2026,
  costNote:
    'Il sito è ospitato gratis su GitHub Pages: restano il dominio e gli strumenti con cui sviluppo e aggiorno il libro (sì, anche l’assistente AI che mi dà una mano). Ogni traguardo sblocca qualcosa di concreto.',
  milestones: [
    {
      amount: 100,
      title: 'Dominio coperto',
      desc: 'Il rinnovo annuale del dominio è ripagato: il libro resta online.',
      icon: 'check',
    },
    {
      amount: 250,
      title: 'Strumenti di sviluppo',
      desc: 'Coperti gli abbonamenti agli strumenti con cui scrivo e aggiorno tutto.',
      icon: 'code',
    },
    {
      amount: 500,
      title: 'Un nuovo manuale',
      desc: 'Un libro nuovo su una materia nuova (es. Reti & Sicurezza).',
      icon: 'sparkles',
    },
  ] as Milestone[],
};

// PLACEHOLDER — sostenitori di esempio.
export const V4V_DONORS: Donor[] = [
  { name: 'Thomas A.', tier: 1 },
  { name: 'Maggy B.', tier: 1 },
];

// Metodi di donazione.
//   - paypal / satispay: URL aperti in una nuova scheda; il QR codifica l'URL.
//   - lightning: offer riutilizzabile BOLT12. Due forme della STESSA offer:
//       · `offer` (lno1…) = forma nuda, è ciò che copia il bottone «copia»;
//       · `uri`  (bitcoin:?lno=lno1…) = la stessa offer dentro un URI BIP21
//         «unificato» (è esattamente la forma che condivide Phoenix): è ciò che
//         codifica il QR, così scansionando/toccando si apre il wallet.
//     PLACEHOLDER: sostituisci con la tua offer aggiornando `BOLT12_OFFER`
//     (l'`uri` si ricava da sola col prefisso BIP21).
const BOLT12_OFFER =
  'lno1zrxq8pjw7qjlm68mtp7e3yvxee4y5xrgjhhyf2fxhlphpckrvevh50u0qdaewpd6jqxqq08nvcng62qfleufc5a2sufe5mqqm53wldypdnucxqsrlxpe0d836srvq5hlhcsyr7t7wvk96dg84qjs5nmajezzgc6r09gqqvegjc9jrgwc4m2c9h74wuhyp5749y38rcd3te7q7aeu256qxprsxqd8ns2x6wkc8lr7crzyh43xuthl6mfhqt5easp0qh89ymlwn7hej0capgf6pva4p030ng83ptagggfuef5v6qqsrl5p4zht6yfv50xj0a7nekuwpy'; // PLACEHOLDER — offer BOLT12

export const V4V_LINKS = {
  paypal: 'https://paypal.me/marcofarina84',
  satispay:
    'https://web.satispay.com/download/qrcode/S6Y-CON--4EF569E6-A3F1-409E-AD1C-5EEAA0EAC5F7',
  lightning: {
    offer: BOLT12_OFFER,
    uri: `bitcoin:?lno=${BOLT12_OFFER}`,
  },
};
