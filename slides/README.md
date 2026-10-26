# Presentazioni delle lezioni

Ogni lezione del libro può avere una presentazione: le slide che l'insegnante proietta in classe. Le presentazioni sono fatte con [Slidev](https://sli.dev) e usano un tema unico, `slides/theme/`, con la stessa carta, gli stessi font e gli stessi colori del libro.

Nella pagina della lezione, in alto a destra, compare il pulsante **Presenta**, che apre le slide. Compare solo se la lezione ha un mazzo.

Questo file è anche **l'istruzione per l'IA** che genera le lezioni: quando nasce una lezione nuova, nasce anche il suo mazzo, scritto con le regole qui sotto.

## Dove stanno le cose

| Che cosa | Dove |
|---|---|
| Mazzo di una lezione | `slides/decks/<volume>/<slug>.md`, per la lezione `volumes/<volume>/<slug>.mdx` |
| Mazzo da copiare per cominciare | `slides/decks/_modello.md` |
| Tema: layout, componenti, stili | `slides/theme/` |
| Build, PDF, controlli | `slides/scripts/slides.mjs` |
| Presentazioni costruite (non nel repository) | `static/slides/<volume>/<slug>/` |
| Pulsante nella lezione | `src/components/PresentaButton/`, dati da `plugins/presentazioni/` |

## Comandi

Una volta sola, dopo `npm ci`:

```bash
npm run slides:install
```

Anteprima dal vivo di un mazzo, con ricarica a ogni salvataggio:

```bash
npm run slides:dev -- archivista/le-chiavi
```

Controllo della struttura dei mazzi: front matter, scaletta, layout, slot, figure e dataset che esistono, lunghezza dei blocchi di codice:

```bash
npm run slides:check
```

Build delle presentazioni in `static/slides/`, di tutte o di una lezione:

```bash
npm run slides:build -- archivista/le-chiavi
```

Un PDF da distribuire a mano, se serve, si genera a parte con `npm run slides:pdf -- archivista/le-chiavi`.

Verifica visiva delle presentazioni costruite: apre ogni slide in un browser senza finestra e segnala quelle il cui contenuto straborda sul piede, il cui codice è più largo del riquadro o che hanno testo che esce di lato da un callout, una colonna o dalla slide:

```bash
npm run slides:verifica -- archivista/le-chiavi
```

Provino: tutte le slide di un mazzo in un'unica immagine, tre per riga e numerate, come escono nel PDF. Esce in `slides/.provino/<volume>-<slug>.png`:

```bash
npm run slides:provino -- archivista/le-chiavi
```

La CI (`.github/workflows/`) esegue `slides:build` prima di `npm run build`, e nelle pull request anche `slides:verifica`: un mazzo che non passa i controlli blocca la build. In locale, i pulsanti della lezione portano a una 404 finché non hai fatto la build.

## Istruzioni per l'IA: come si scrive un mazzo

Queste regole valgono per chi genera i mazzi, persona o IA. Il tema fa tutto il lavoro grafico: margini, allineamenti, colori, testata, piede e numeri di pagina. **Chi scrive il mazzo sceglie solo i layout e scrive il contenuto.** Niente HTML di impaginazione, niente `style=`, niente classi di UnoCSS: se un contenuto non sta in nessun layout, il layout va aggiunto al tema, non improvvisato nel mazzo.

### 0. Due regole che non si saltano mai

1. **Lezione e slide cambiano insieme.** Chi modifica una lezione (`volumes/<volume>/<slug>.mdx`), persona o IA, aggiorna nello stesso commit il suo mazzo (`slides/decks/<volume>/<slug>.md`): un esempio cambiato, un paragrafo aggiunto o tolto, un quiz nuovo. Chi crea una lezione nuova crea anche il mazzo. Un'IA che lavora su una lezione lo fa **in automatico**, senza aspettare che glielo si chieda. `slides:check` lo fa rispettare: se la lezione è cambiata dopo il mazzo, segnala `la lezione … è cambiata dopo il mazzo: aggiorna le slide`, e la CI si ferma.
2. **Le verifiche le fa chi scrive, tutte, ogni volta.** Prima di consegnare, l'IA esegue da sé i controlli della sezione 7, nell'ordine: struttura, build, verifica (che esegue anche ogni blocco di codice e misura il risultato aperto), e **provino**, cioè l'immagine con tutte le slide, che apre e guarda slide per slide, e se serve rigenera dopo ogni correzione. Corregge finché tutto passa, e riporta l'esito nella pull request. L'insegnante deve ricevere un mazzo che funziona in classe senza doverlo ricontrollare.

### 1. Il punto di partenza è la lezione

Il mazzo racconta la lezione, nello stesso ordine e con gli stessi esempi (Risonanza, Hogwarts, i James Potter). Non introduce concetti che la lezione non ha e non ne salta di importanti. Il testo però è riscritto per la proiezione: frasi brevi, un'idea per slide, elenchi di tre-cinque voci. Lo leggono studenti in un'aula, mentre l'insegnante parla.

Tono: lo stesso del libro, italiano piano, seconda persona, niente enfasi pubblicitaria e niente punti esclamativi. Le virgolette sono quelle della lezione.

### 2. Front matter iniziale

È la prima cosa del file, e la copertina si costruisce da qui. Non ha contenuto proprio.

```yaml
---
theme: ../../theme
title: 'Identificare senza ambiguità: le chiavi'   # il `title` della lezione
sottotitolo: Due persone possono avere lo stesso nome… # una o due frasi dalla `description`
volume: archivista        # la cartella del mazzo: programmatore, artefice, archivista, apprendista
capitolo: 2               # il numero del capitolo (curriculum/toc/<volume>.js); ometti se il volume non ha capitoli
numero: 8                 # la `sidebar_position` della lezione: il numero grande della copertina
lezione: archivista/le-chiavi   # <volume>/<slug>: dice al QR finale e al PDF dove sta la lezione
---
```

### 3. La scaletta

Ogni mazzo segue la stessa scaletta. È questo che rende coerenti le presentazioni di tutto il libro.

1. **Copertina**: la prima slide, vuota (il front matter iniziale).
2. **Epigrafe** (`layout: epigrafe`) se la lezione ne ha una.
3. **Obiettivi** (`layout: obiettivi`): i `:::prereq` e i `:::learn` della lezione, accorciati.
4. Per ogni `##` della lezione:
   - una slide **`layout: sezione`** con il titolo del paragrafo e una frase che dice di che cosa parla;
   - le slide di contenuto, da due a sei.
5. **Sintesi** (`layout: sintesi`): il `:::nutshell`.
6. **Quiz** (`layout: quiz`): una slide per ogni domanda del `<QuizDeck>`, con `numero: 1 di 3`.
7. **Fine** (`layout: fine`): la prossima lezione, dal `:::tip[La prossima lezione]`. Il QR della lezione lo aggiunge il tema.

Un mazzo ha in genere da 18 a 30 slide.

### 4. I layout

| Layout | Quando | Slot e proprietà |
|---|---|---|
| `copertina` | La prima slide, sempre. | Tutto dal front matter iniziale. |
| `epigrafe` | La citazione d'apertura. | Testo nello slot; `autore:`. |
| `obiettivi` | Prerequisiti e obiettivi. | `# Titolo`, poi `::prerequisiti::` e `::imparerai::` con un elenco ciascuno. |
| `sezione` | Apre ogni `##` della lezione. | `# Titolo` del paragrafo, poi una frase. Il numero è automatico e il titolo va nella testata delle slide che seguono. |
| `default` | Testo, elenchi, codice, callout. | `# Titolo` e contenuto. Non serve scriverlo. |
| `due-colonne` | Confronti, codice e spiegazione, i `<Tabs>` del libro. | `# Titolo`, poi `::sinistra::` e `::destra::`. `rapporto: 3/2`, `sinistra:` e `destra:` (etichette), `centro: true`. |
| `definizione` | Un `:::definition`, da solo. | Testo nello slot; `titolo:` (il termine). |
| `enunciato` | L'idea che la slide deve lasciare, in una frase grande. | Primo paragrafo: l'enunciato (il **grassetto** prende il colore del volume). Paragrafi successivi: una nota. |
| `figura` | `<Figura>`, `<DiagrammaER>`, un diagramma mermaid. | `# Titolo`, poi `::figura::` con la figura. `::lato::` (facoltativo) mette un testo breve accanto, a sinistra (`lato: destra` lo sposta). `didascalia:` facoltativa (non per `<Figura>`, che ha le sue). La figura si scala da sola per stare nello spazio. **I diagrammi vanno in questo layout, mai in `due-colonne`.** |
| `domanda` | «Prova a prevedere»: gli `<Spoiler block>` del libro. | `# Titolo` e la domanda o il codice; `::risposta::` compare al clic. `invito:` cambia la frase sopra la risposta. `affiancata: true` mette codice a sinistra e risposta a destra: è obbligatoria quando c'è un blocco di codice di più di 6 righe. |
| `quiz` | Una domanda del quiz. | `# La domanda`, poi un `<Opzione>` per riga; una sola ha `corretta`. `numero: 1 di 3`. |
| `sintesi` | Il `:::nutshell`. | `# In sintesi`, poi `<Callout tipo="nutshell">`. |
| `fine` | L'ultima slide. | `# La prossima lezione` e due righe. |

### 5. I componenti

I componenti del libro hanno un equivalente nelle slide. **Le figure e i diagrammi sono gli stessi del libro**, non copie: si citano per nome.

| Nel libro | Nelle slide |
|---|---|
| `:::warning[Titolo]` … `:::` (e tutti i callout) | `<Callout tipo="warning" titolo="Titolo">` … `</Callout>`. I tipi sono quelli del libro: `prereq`, `learn`, `definition`, `history`, `code`, `cleancode`, `nutshell`, `info`, `tip`, `warning`, `danger`, `note`. Senza `titolo` si usa quello predefinito. Riga vuota dopo il tag di apertura e prima di quello di chiusura, perché il contenuto sia markdown. |
| `<Figura figura={unioneSenzaChiave} />` | `<Figura id="unione-senza-chiave" />`: il nome del file in `src/figure/`. In presentazione si anima come nel libro; nel PDF si ferma sul passo finale. |
| `<DiagrammaER entita={[…]} … />` | `<DiagrammaER :entita="[…]" … />`: si copiano le proprietà dalla lezione e si mette `:` davanti a quelle tra graffe (`:entita`, `:associazioni`, `:cella`). Le stringhe restano come sono. |
| ` ```mermaid ` | Uguale, dentro `::figura::` di un layout `figura`. |
| ` ```py live ` | ` ```python ` dentro `<PyRun>` … `</PyRun>`: in presentazione compare «Esegui», con lo stesso Brython del libro. `uscita="destra"` mette l'output accanto quando sotto non c'è posto. Ogni blocco parte da zero: deve contenere tutto quello che gli serve (import, lettura dei file, definizioni), non può usare variabili di una slide precedente. Le righe `### PRE` della lezione vanno scritte in chiaro. `errore` dichiara un blocco che fallisce apposta (un `AttributeError` da mostrare). |
| Un risultato che non entra sotto il codice | `seguito` su `<PyRun>` o `<SqlRun>`: il tema crea da solo, subito dopo, la slide «… il risultato», con lo stesso blocco eseguito in automatico e a tutta pagina; «Esegui» sulla slide del codice porta lì. **Obbligatorio quando `slides:verifica` dice che il risultato aperto non sta nella slide**, e di regola in ogni layout `domanda`. Non si scrive mai a mano una slide che ripete il blocco. |
| ` ```sql live dataset=archivista/x ` | ` ```sql ` dentro `<SqlRun dataset="archivista/x">`. Con `database` mostra dopo l'esecuzione le tabelle cambiate, come il pannello «Database» del libro (righe nuove, modificate e tolte evidenziate); `database="studente,casa"` sceglie le tabelle. Con `persistente` il database resta modificato da una slide all'altra, per le sequenze INSERT → SELECT. `errore` dichiara una query che fallisce apposta (un vincolo violato). |
| Il pannello «Database» con lo stato iniziale | `<StatoDb dataset="archivista/x" tabelle="studente" :massimo="6" />`: le tabelle del dataset prima di qualsiasi query. Si vede anche nel PDF. |
| `<Spoiler block>` | `layout: domanda`, con la risposta in `::risposta::`. Per una risposta fuori da quel layout: `<Risposta v-click>` … `</Risposta>`. |
| `<Esito />`, `<Esito ok={false} />` | `<Esito />`, `<Esito :ok="false" />`. |
| `<Tabs>` con due schede | `layout: due-colonne` con `sinistra:` e `destra:` come etichette. |
| `<Quiz>` | `layout: quiz` e `<Opzione corretta perche="…">`. Il `perche` è il `<QuizFeedback>`, accorciato; accetta `codice` e **grassetto**. |
| `<Tooltip def="…">parola</Tooltip>` | La parola in **grassetto**; la definizione, se serve, nella frase. |
| `<FileArchivio nome="punti.json" />` | Un blocco ` ```json ` con le righe che servono (al massimo una decina). |
| `<Epigraph author="…">` | `layout: epigrafe` con `autore:`. |

Nella stampa (e in `slides:pdf`) i pulsanti «Esegui» spariscono, le figure si fermano sul passo finale, le risposte dei layout `domanda` e le spiegazioni dei quiz sono già aperte.

### 6. Misure: che cosa sta in una slide

- **Titolo**: al massimo due righe; meglio una. È una frase che dice di che cosa parla la slide («Senza chiave, i punti contano due volte»), non un'etichetta («Esempio»).
- **Testo**: al massimo 60 parole per slide, esclusi codice e callout.
- **Elenchi**: da tre a cinque voci, una riga o due ciascuna.
- **Codice**: al massimo 12 righe se il blocco è da solo sotto il titolo, 10 se c'è anche una frase, 16 come limite assoluto (lo controlla `slides:check`). Le righe stanno sotto i 60 caratteri, sotto i 45 in una colonna di `due-colonne`. Se il codice della lezione è più lungo, si divide su più slide oppure si mostrano solo le righe che contano. Per guidare lo sguardo su un blocco si evidenziano le righe per passi: ` ```python {1-3|5|all} `.
- **Codice eseguibile**: con `<PyRun>` e `<SqlRun>` la frase di spiegazione va **prima** del blocco, perché sotto compare l'output. Se il blocco supera le 8 righe si usa `uscita="destra"`.
- **Callout**: uno per slide, due se sono brevi.
- **Nomi con il doppio trattino basso** (`__init__`, `__str__`, `_Brano__durata`): sempre tra backtick, anche nei titoli. Fuori dal codice il markdown li legge come grassetto e `# __str__` diventerebbe «str» (lo controlla `slides:check`).
- **Diagrammi mermaid**: solo nel layout `figura`, mai in una colonna; orientati in orizzontale (`flowchart LR`) perché la slide è larga e bassa. Per due gruppi da mostrare uno sopra l'altro: `flowchart TB` con `direction LR` dentro ogni `subgraph`, e il primo gruppo scritto per primo.
- **Animazioni**: `v-click` per far comparire le voci di un elenco una alla volta solo quando l'ordine conta (una dimostrazione, un ragionamento a passi). Non su ogni slide.

### 7. Controlli e verifiche: obbligatori prima di consegnare

Un mazzo è finito solo quando passa questi controlli, nell'ordine. Chi genera il mazzo (persona o IA) li esegue da sé e corregge fino a che passano: non li lascia a chi rivede.

1. **Struttura**: `npm run slides:check -- <volume>/<slug>`. Controlla il front matter iniziale (`theme`, `title`, `volume` e `lezione` coerenti con il nome del file, la lezione che esiste), la scaletta (copertina in testa, `fine` in coda), che ogni layout esista nel tema e abbia i suoi slot (`::risposta::`, `::figura::`, `::sinistra::`/`::destra::`, `::prerequisiti::`/`::imparerai::`), che ogni quiz abbia una sola `<Opzione corretta>` e la domanda nel titolo, che le figure (`src/figure/`) e i dataset (`static/sql-datasets/`) citati esistano, che nessun blocco di codice superi le 16 righe. Ogni errore dice slide e motivo.
2. **Build**: `npm run slides:build -- <volume>/<slug>`. Se Slidev non compila, l'errore indica il file e la riga: di solito un tag non chiuso o una riga vuota mancante attorno al markdown dentro un componente.
3. **Verifica visiva**: `npm run slides:verifica -- <volume>/<slug>`. Misura ogni slide costruita e segnala:
   - `straborda di N px in basso`: il contenuto supera il corpo e copre il piede. Si toglie testo, si accorcia il codice, si divide la slide in due. **Non** si rimpicciolisce il testo e non si aggiungono stili;
   - `codice più largo del riquadro`: una riga di codice non entra. Si va a capo nel codice (dentro parentesi, come farebbe un programmatore) o si accorciano i nomi negli esempi, senza cambiarne il senso;
   - `figura ridotta sotto il 60%`: per entrare nello spazio la figura è stata rimpicciolita tanto da non leggersi da un proiettore. Un diagramma E/R si dispone in orizzontale (entità e rombi sulla stessa `riga`, `col` diverse), oppure si toglie lo slot `::lato::` per dargli tutta la larghezza;
   - `contenuto che esce di lato`: un testo, una tabella o un codice in linea supera il bordo destro del suo callout, della sua colonna o della slide. Il codice in linea va già a capo da solo; se la segnalazione resta, di solito c'è una tabella troppo larga o un'espressione lunga che sta meglio in un blocco di codice.
   - `il risultato aperto non sta nella slide`: premendo «Esegui» l'output non entrerebbe per intero sotto il codice. Si aggiunge `seguito` al blocco: il risultato avrà una slide sua, a tutta pagina;
   - `il risultato non sta nemmeno nella sua slide`: anche a tutta pagina l'output è troppo lungo. Si riducono le righe (`LIMIT`), le tabelle mostrate da `database`, o le stampe del programma;
   - `blocco N: va in errore`: la verifica preme «Esegui» su ogni `<PyRun>` e `<SqlRun>`, e quel blocco è finito in errore. Di solito manca un import o una variabile definita in un'altra slide. Se l'errore è voluto, il blocco va dichiarato con `errore`;
   - `doveva andare in errore`: il blocco è dichiarato `errore` ma è andato a buon fine.
   Si ripetono build e verifica finché la lezione risulta `✓`.
4. **Revisione visiva sul provino**: `npm run slides:provino -- <volume>/<slug>`, poi si guarda l'immagine slide per slide. La verifica misura le dimensioni, ma non vede tutto: titoli storpiati dal markdown, backtick rimasti visibili, diagrammi nell'ordine sbagliato, slide troppo vuote o troppo piene rispetto alle vicine, elenchi che vanno a capo male. Chi genera il mazzo apre il provino e corregge quello che trova; un'IA che può leggere immagini lo fa da sé.
5. **Prova in classe**: `npm run slides:dev -- <volume>/<slug>`, poi si scorre tutto il mazzo. Le figure si animano, i pulsanti «Esegui» danno lo stesso risultato della lezione, le risposte dei layout `domanda` e dei quiz compaiono al clic, nessuna slide ha un'aria vuota o affollata rispetto alle altre.

La verifica misura le slide con tutti i clic fatti, poi esegue ogni blocco come farebbe l'insegnante e misura anche il risultato aperto: deve leggersi per intero, senza barre di scorrimento.

Quando un'IA genera una lezione nuova, la consegna comprende la lezione, il mazzo e l'esito dei controlli 1-4 riportato nella descrizione della pull request.

## Mantenere il tema

Il tema è pensato perché i mazzi non lo tocchino mai. Chi lo modifica tiene presente che:

- i token di colore e i font (`theme/styles/token.css`) copiano quelli di `src/css/custom.css`: se cambiano nel libro, vanno cambiati anche qui;
- la griglia (margini, testata, piede) sta tutta in `theme/components/Cornice.vue` e `theme/styles/cornice.css`;
- i componenti React del libro entrano nelle slide attraverso `theme/components/IsolaReact.vue`, e `theme/vite.config.ts` spiega che cosa serve per compilarli;
- un layout nuovo va documentato nella tabella qui sopra e aggiunto a `slides/decks/_modello.md`.
