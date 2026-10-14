# Come contribuire

Grazie per l’interesse in Python Doesn’t Byte. Questa pagina spiega come proporre una modifica.

## Regola principale: le pull request vanno su `dev`

| Branch | A cosa serve | Chi ci scrive |
|---|---|---|
| `main` | Versione pubblicata sul sito. Ogni push fa partire il deploy. | Solo il maintainer, con una release da `dev`. |
| `dev` | Lavoro in corso. | Il maintainer e le pull request dei contributor. |

Una pull request verso `main` che non arriva da `dev` viene bloccata da un controllo automatico.

## Procedura

1. Fai il fork del repository e clonalo.
2. Parti da `dev`, non da `main`:
   ```bash
   git checkout dev
   git checkout -b fix/descrizione-breve
   ```
3. Fai la modifica e controlla che il sito si costruisca:
   ```bash
   npm ci
   npm run lint
   npm run build
   ```
4. Apri la pull request con base `dev`. Se GitHub propone `main`, cambia la base prima di inviare.

## Che cosa serve in una pull request

- Un messaggio di commit nel formato `tipo(ambito): descrizione`, per esempio `fix(lezioni): corregge un refuso`.
- Una descrizione che dica che cosa cambia e perché.
- Per le lezioni, il contenuto in italiano e le regole di tono del progetto. Se hai dubbi, apri prima una issue.

## Sostenitori

Il nome di un sostenitore compare nell’elenco (`src/lib/v4vData.ts`) solo dopo che il maintainer ha verificato la donazione. Non modificare quel file in una pull request: scrivi a marco.farina@jcmaxwell.it.

## Segnalare un problema

Apri una issue. Per le questioni di sicurezza scrivi direttamente al maintainer, senza pubblicare i dettagli.

Partecipando accetti il [Code of Conduct](code_of_conduct.md). I contenuti sono sotto licenza CC BY-NC-SA 4.0.
