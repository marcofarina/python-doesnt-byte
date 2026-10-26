---
theme: ../../theme
title: Le associazioni
sottotitolo: Un’associazione non è una linea fra due entità che hanno qualcosa a che fare. Registra un fatto preciso, ha un nome, si legge nei due versi e, se si ricava da altre, è una copia.
volume: archivista
capitolo: 2
numero: 6
lezione: archivista/le-associazioni
---

---
layout: epigrafe
autore: Albus Silente, Harry Potter e il Calice di Fuoco (2000)
---

We are only as strong as we are united, as weak as we are divided.

---
layout: obiettivi
---

# Da dove partiamo, dove arriviamo

::prerequisiti::

- Entità, attributo e occorrenza; `studente` e `casa`
- L'attributo derivato, che nei diagrammi non compare
- La casa ripetuta in ogni assegnazione del registro
- Leggere un `JOIN` come una frase

::imparerai::

- Che cos'è un'**associazione** e una sua **occorrenza**
- Riconoscere un'associazione nascosta in un attributo
- Dare un nome all'associazione e leggerla nei due versi
- Distinguere un'associazione **derivata** da una che registra un fatto nuovo

---
layout: sezione
---

# La colonna che collega

Nella tabella `studente`, `anno` e `casa` sembrano uguali. Non lo sono.

---
layout: due-colonne
sinistra: anno · descrive
destra: casa · collega
---

# Due colonne di natura diversa

::sinistra::

Il **3** accanto a Fred Weasley è l'anno che Fred frequenta, e non rimanda a nient'altro.

La colonna `anno` **descrive** lo studente.

::destra::

La parola **Grifondoro** accanto a Fred è il nome di una riga di un'altra tabella, dove stanno colori e animale.

La colonna `casa` **collega** lo studente a un'occorrenza di un'altra entità. Registra un fatto: _Fred Weasley appartiene a Grifondoro_.

---
layout: definizione
titolo: Associazione e occorrenza di associazione
---

Un'**associazione** è un legame fra due entità che il database deve registrare: `appartiene` lega `studente` a `casa`.

Un'**occorrenza di associazione** è una coppia di occorrenze, una per entità, per cui il legame vale: (Harry Potter, Grifondoro). L'associazione è **l'insieme delle sue occorrenze**.

---
layout: figura
---

# Le coppie di appartiene

::figura::

<Figura id="occorrenze-appartiene" />

---
layout: figura
---

# Un rombo con un verbo dentro

::lato::

- Il nome è di solito un **verbo**: con i nomi delle entità forma una frase vera, _lo studente appartiene alla casa_.
- Nel diagramma è un **rombo**, collegato a ciascuna entità.
- La casa non è più un attributo di `studente`: il suo posto è il rombo. Le linee, per ora, non hanno numeri.

::figura::

<DiagrammaER
  titolo="Lo studente appartiene a una casa"
  descrizione="L'entità studente, con nome e anno, è collegata all'entità casa, con nome, colori e animale, dall'associazione appartiene."
  :entita="[
    { id: 'studente', col: 0, riga: 0, attributi: ['nome', 'anno'], latoAttributi: 'sopra' },
    { id: 'casa', col: 0, riga: 2, attributi: ['nome', 'colori', 'animale'], latoAttributi: 'sotto' },
  ]"
  :associazioni="[
    { id: 'appartiene', col: 0, riga: 1, tra: [{ entita: 'studente' }, { entita: 'casa' }] },
  ]"
  :cella="[280, 130]"
/>

---
layout: sezione
---

# Un fatto, due versi

«Harry appartiene a Grifondoro» e «Grifondoro accoglie Harry» sono la stessa coppia.

---

# Una frase girata non è un'altra associazione

<Callout tipo="warning" titolo="Un rombo solo, letto nei due versi">

- <Esito :ok="false" /> due rombi fra `studente` e `casa`, `appartiene` e `accoglie` → le stesse coppie registrate due volte. È la ridondanza del capitolo 1.
- <Esito /> un solo rombo, `appartiene`, letto nei due versi.

</Callout>

Due rombi fra le stesse entità però non sono sempre un errore. **`gioca`**, la squadra di Quidditch, ha coppie diverse da `appartiene`: anche Hermione appartiene a Grifondoro, ma il Quidditch preferisce studiarlo sui libri. **Confronta le coppie**: stesse coppie, un fatto; coppie diverse, due fatti.

---
layout: sezione
---

# Il direttore

Un modo per riconoscere un'associazione anche senza conoscere il dominio.

---
layout: enunciato
---

Un attributo che contiene i **nomi delle occorrenze di un'altra entità** è un'associazione travestita.

Una colonna `direttore` nella tabella `casa` conterrebbe `McGonagall`: il nome di un'occorrenza di `professore`, come `Grifondoro` nella riga di Fred è il nome di un'occorrenza di `casa`.

---
layout: figura
didascalia: Quattro coppie, una per casa. Silente, il preside, non dirige nessuna casa e non compare in nessuna coppia.
---

# L'associazione dirige

::figura::

<DiagrammaER
  titolo="Lo studente appartiene a una casa, la casa è diretta da un professore"
  descrizione="Tre entità in fila: studente, casa e professore. appartiene collega studente e casa, dirige collega casa e professore."
  :entita="[
    { id: 'studente', col: 0, riga: 0, attributi: ['nome', 'anno'], latoAttributi: 'sopra' },
    { id: 'casa', col: 2, riga: 0, attributi: ['nome', 'colori', 'animale'], latoAttributi: 'sopra' },
    { id: 'professore', col: 4, riga: 0, attributi: ['nome', 'materia'], latoAttributi: 'sopra' },
  ]"
  :associazioni="[
    { id: 'appartiene', col: 1, riga: 0, tra: [{ entita: 'studente' }, { entita: 'casa' }] },
    { id: 'dirige', col: 3, riga: 0, tra: [{ entita: 'professore' }, { entita: 'casa' }] },
  ]"
  :cella="[170, 160]"
/>

---
layout: sezione
---

# L'associazione che si ricava

Nel capitolo 1 il registro scriveva la casa dello studente in ogni assegnazione.

---
layout: definizione
titolo: Associazione derivata
---

Un'associazione le cui coppie si ottengono **sempre** passando da altre associazioni è **derivata**. La casa di un'assegnazione lo è: dall'assegnazione si arriva allo studente, dallo studente alla casa.

Come l'attributo derivato, è una seconda copia di informazioni che il database contiene già, e può contraddire l'originale: i cinque punti di Neville finivano in due case.

---
layout: domanda
affiancata: true
invito: Se dirige si ricavasse dalle assegnazioni, ogni professore avrebbe una casa sola. Con quante case compare McGonagall?
---

# Un giro chiuso basta a dire «copia»?

Il professore e la casa dello studente, senza ripetizioni, dalle assegnazioni unite agli studenti:

<SqlRun dataset="archivista/registro-punti" seguito>

```sql
SELECT DISTINCT assegnazione.professore,
       studente.casa
FROM assegnazione
JOIN studente
  ON studente.nome = assegnazione.studente
ORDER BY assegnazione.professore;
```

</SqlRun>

::risposta::

Con **due**: Grifondoro e Serpeverde, perché ha tolto venti punti a Draco. Anche Piton ne ha due, e Silente compare con Grifondoro, che non dirige. `dirige` **non si ricava**: il rombo serve.

---
layout: enunciato
---

Per dire che un'associazione **non** si ricava basta un'eccezione nei dati. Per dire che **si ricava**, i dati non bastano mai.

Anche se oggi ogni professore desse punti solo alla casa che dirige, domani McGonagall potrebbe toglierne a Serpeverde. Serve una **regola del dominio**, e nei dati una regola non sta scritta: la conosce chi usa il database.

---
layout: sintesi
---

# In sintesi

<Callout tipo="nutshell" titolo="In a nutshell">

- Un'**associazione** è un legame fra due entità; una sua **occorrenza** è una coppia per cui il legame vale.
- Si disegna con un **rombo**; il nome è un verbo che forma una frase vera.
- Un attributo che contiene i nomi di occorrenze di un'altra entità è un'**associazione travestita**.
- Si legge nei due versi: due rombi per le stesse coppie sono ridondanza; per coppie diverse, sono due fatti.
- Un'associazione **derivata** si ricava sempre da altre: è una copia. Un'eccezione basta a escluderlo; per affermarlo serve una regola del dominio.

</Callout>

---
layout: quiz
numero: 1 di 3
---

# Un compagno dà a `professore` l'attributo `casa_diretta`, che per McGonagall vale «Grifondoro». Che cosa non va?

<Opzione perche="Che ci sia al massimo un valore non decide: conta che rimandi a un'altra occorrenza.">Niente: un professore dirige al massimo una casa.</Opzione>
<Opzione corretta perche="Esatto: è lo stesso segnale della colonna `casa` di `studente`.">Contiene il nome di un'occorrenza di `casa`: è l'associazione `dirige` travestita.</Opzione>
<Opzione perche="Un direttore è un professore: nome e materia stanno già in `professore`.">Serve un'entità `direttore`.</Opzione>
<Opzione perche="Nella casa, l'attributo resta un'associazione travestita, vista dall'altro lato.">Va spostato in `casa`, con il nome `direttore`.</Opzione>

---
layout: quiz
numero: 2 di 3
---

# Due rombi fra `studente` e `casa`, `appartiene` e `accoglie`, hanno le stesse coppie. Che cosa ne pensi?

<Opzione perche="Un'associazione si legge nei due versi con un rombo solo.">Va bene: servono due rombi per i due versi.</Opzione>
<Opzione perche="Un attributo in più non cambia le coppie.">Va bene, se uno dei due ha un attributo in più.</Opzione>
<Opzione corretta perche="Esatto: basta aggiornarne uno solo perché lo studente risulti in due case.">È la stessa associazione disegnata due volte: prima o poi si contraddicono.</Opzione>
<Opzione perche="Contano le coppie, non i nomi.">È un errore solo se hanno lo stesso nome.</Opzione>

---
layout: quiz
numero: 3 di 3
---

# Oggi ogni professore ha dato punti solo alla casa che dirige. Un compagno toglie il rombo `dirige`, perché «si ricava». Che cosa ne pensi?

<Opzione perche="I dati di oggi coincidono per caso.">Ha ragione: se i dati coincidono, è una copia.</Opzione>
<Opzione corretta perche="Esatto: i dati possono smentire una derivazione, non dimostrarla.">Ha torto: serve una regola del dominio, e nessuna regola lo dice.</Opzione>
<Opzione perche="Un professore nuovo, senza punti dati, non dirigerebbe nessuna casa.">Ha ragione, se ogni professore ha almeno un'assegnazione.</Opzione>
<Opzione perche="Un giro chiuso non è un errore in sé.">Ha torto: un giro chiuso nel diagramma è sempre un errore.</Opzione>

---
layout: fine
---

# La prossima lezione

Uno studente appartiene a **una** casa sola, una casa accoglie **molti** studenti, un professore dirige **al massimo una** casa: questi conteggi diventano le **cardinalità**, e decidono la struttura del database.
