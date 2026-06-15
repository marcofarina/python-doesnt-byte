# Python doesn’t byte

> Il libro di testo, reinventato.

[![Sito](https://img.shields.io/badge/Sito-rainbowbits.cloud-1d68e1?logo=googlechrome&logoColor=white)](https://www.rainbowbits.cloud/python-doesnt-byte/)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/marcofarina/python-doesnt-byte/.github%2Fworkflows%2Fdeploy.yml?label=deploy)
![Version](https://img.shields.io/badge/Book%20version-0.5.0-orange)
![Docusaurus](https://img.shields.io/badge/Built%20with-Docusaurus%203-3ECC5F?logo=docusaurus&logoColor=white)
![Python 3.12](https://img.shields.io/badge/Python-3.12-4584b6?logo=python&labelColor=ffde57)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](code_of_conduct.md)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](http://creativecommons.org/licenses/by-nc-sa/4.0/)

**[Python doesn’t byte](https://www.rainbowbits.cloud/python-doesnt-byte/)** è un libro di testo digitale e open source per imparare Python, pensato per gli studenti della scuola secondaria di secondo grado — in particolare l’indirizzo _Informatica_ degli Istituti Tecnici e l’articolazione _Scienze Applicate_ del Liceo Scientifico.

Non è un PDF né un sito di sole pagine statiche: ogni esempio di codice **si esegue direttamente nel browser** (niente da installare), con un editor in-pagina e la possibilità di modificare, rieseguire e sperimentare.

## Perché questo libro?

Ho scritto questo libro come risposta alla crescente necessità di modernizzare l’insegnamento dell’informatica nelle scuole superiori. Mentre i libri di testo cartacei tradizionali possono risultare antiquati nel contesto veloce e dinamico dell’informatica, qui adotto un approccio diverso: un libro digitale, interattivo e in continua evoluzione.

Il formato digitale offre diversi vantaggi:

- **Flessibilità** — posso aggiornare e adattare i contenuti ai miei corsi e agli ultimi sviluppi del linguaggio in qualsiasi momento.
- **Interattività** — esempi di codice eseguibili in-pagina, query SQL eseguibili nel browser, algoritmi animati passo-passo e materiali multimediali rendono l’apprendimento più pratico e coinvolgente.
- **Accessibilità** — gli studenti vi accedono da qualsiasi luogo e in qualsiasi momento, gratuitamente.
- **Apertura** — la licenza _open source_ promuove condivisione, collaborazione e revisione da parte della comunità.

## I quattro volumi

Il libro è organizzato in volumi indipendenti, ciascuno con la propria sidebar e il proprio percorso:

| Volume | Titolo | Argomenti |
|--------|--------|-----------|
| 1 | **Manuale del Programmatore** | Fondamenti del linguaggio: dati, controllo di flusso, funzioni |
| 2 | **Manuale dell’Artefice** | Programmazione ad oggetti: classi, ereditarietà, design pattern |
| 3 | **Manuale dell’Archivista** | Dati e persistenza: file, SQLite, ORM, integrazione |
| 4 | **Biblioteca dell’Apprendista** | Esercizi, sfide e progetti di laboratorio |

> Il progetto è in fase di sviluppo attivo: alcuni volumi sono ancora in via di popolamento.

## Stack tecnologico

- **[Docusaurus 3](https://docusaurus.io/)** (React 18 + TypeScript) come generatore di sito statico.
- **PyRunner** — runtime custom in-repo per eseguire Python nel browser, basato su **[Brython](https://brython.info/)** 3.12 + **[CodeMirror 6](https://codemirror.net/)**. Espone il fence ` ```py live ` e il componente `<PyRunner />` in MDX.
- **SQLRunner** (_SQL Live Blocks_) — esecutore SQL client-side via **[sql.js](https://sql.js.org/)** (SQLite compilato in WASM) in un Web Worker, con ripristino del database da snapshot. Per il Volume 3; espone il fence ` ```sql live `.
- **Algorithm** — visualizzatore di algoritmi animati (ordinamento e ricerca) con player passo-passo, pseudocodice sincronizzato e preset _Studio_/_Lab_. Componente `<Algorithm />` in MDX.
- Contenuti in **MDX** (italiano), con componenti didattici custom (callout Notion-style, quiz, tooltip, indice dei capitoli).
- **Smart quotes** tipografici applicati automaticamente in build (`remark-smartypants`).
- Deploy automatico su **GitHub Pages** (dominio custom `www.rainbowbits.cloud`) via GitHub Actions.

## Sviluppo locale

Requisiti: **Node.js ≥ 20** e **npm**.

```bash
# Installa le dipendenze
npm install

# Avvia il dev server (hot-reload) su http://localhost:3000/python-doesnt-byte/
npm start

# Build di produzione (la stessa che gira in CI)
npm run build

# Servi localmente il sito buildato
npm run serve
```

Controlli qualità:

```bash
npm run typecheck   # tsc
npm run lint        # ESLint
npm run format      # Prettier
npm run clear       # svuota la cache di Docusaurus (.docusaurus/)
```

## Contributi

Questo è un progetto open source! Se hai suggerimenti, correzioni o nuovi materiali da condividere, sentiti libero di aprire una _issue_ o inviare una _pull request_. Prima di contribuire, dai un’occhiata al [Code of Conduct](code_of_conduct.md).

## Contatti

Per domande o ulteriori informazioni puoi scrivere all’autore: **marco.farina@jcmaxwell.it**.

## Licenza

<p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><span property="dct:title">Python Doesn’t Byte</span> by <span property="cc:attributionName">Marco Farina</span> is licensed under <a href="http://creativecommons.org/licenses/by-nc-sa/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">CC BY-NC-SA 4.0 <img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/nc.svg?ref=chooser-v1"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/sa.svg?ref=chooser-v1"></a></p>

## Donazioni

Secondo il principio del _value for value_, se ritieni che questo progetto educativo ti abbia arricchito culturalmente, puoi considerare di sostenerlo restituendo quel valore attraverso una donazione. Ogni contributo, per quanto modesto, è un riconoscimento dell’impegno per la condivisione della conoscenza.

![Donazione Bitcoin](https://img.shields.io/badge/-Bitcoin-orange?logo=bitcoin)
[![Donazione Lightning](https://img.shields.io/badge/-Lightning-yellow?logo=lightning)](https://getalby.com/p/marcofarina)
[![Ko-fi](https://img.shields.io/badge/-Ko--fi-FF5E5B?logo=kofi&logoColor=white)](https://ko-fi.com/marcofarina)
[![Donazione PayPal](https://img.shields.io/badge/-PayPal-blue?logo=paypal)](https://paypal.me/marcofarina84)
