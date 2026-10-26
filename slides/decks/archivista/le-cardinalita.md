---
theme: ../../theme
title: Le cardinalità
sottotitolo: Le cardinalità non sono un’etichetta da aggiungere alla fine. Il minimo decide se un’occorrenza può esistere senza l’altra, il massimo se il legame sta in una colonna.
volume: archivista
capitolo: 2
numero: 7
lezione: archivista/le-cardinalita
---

---
layout: epigrafe
autore: Highlander (1986)
---

There can be only one.

---
layout: obiettivi
---

# Da dove partiamo, dove arriviamo

::prerequisiti::

- Associazioni e occorrenze: `appartiene` e `dirige`
- L'attributo opzionale e il segno `(0,1)`
- La bacchetta come entità, con legno, nucleo e lunghezza
- Il vincolo che fa rifiutare una scrittura

::imparerai::

- Scrivere le cardinalità leggendo il dominio nei due versi
- Che cosa decidono il **minimo** e il **massimo**
- Associazioni **uno a uno**, **uno a molti**, **molti a molti**
- Quando una cardinalità fa rifiutare un fatto vero

---
layout: sezione
---

# Quante case per uno studente

Contiamo le coppie di `appartiene`, partendo da ciascuna delle due entità.

---
layout: figura
---

# Contare le coppie nei due versi

::figura::

<Figura id="cardinalita-coppie" />

---
layout: figura
---

# Due numeri accanto a ogni entità

::lato::

- Accanto a `studente`, **`(1,1)`**: ogni studente compare in almeno una coppia e al massimo in una. Di case, come di Highlander, ce n'è una sola.
- Accanto a `casa`, **`(0,N)`**: una casa può non avere studenti, e non ha un massimo. `N` vuol dire «quante se ne vuole».

::figura::

<DiagrammaER
  titolo="Lo studente appartiene a una casa, con le cardinalità"
  descrizione="studente è collegata a casa da appartiene: (1,1) accanto a studente, (0,N) accanto a casa."
  :entita="[
    { id: 'studente', col: 0, riga: 0, attributi: ['nome', 'anno'], latoAttributi: 'sopra' },
    { id: 'casa', col: 0, riga: 2, attributi: ['nome', 'colori', 'animale'], latoAttributi: 'sotto' },
  ]"
  :associazioni="[
    { id: 'appartiene', col: 0, riga: 1, tra: [{ entita: 'studente', card: '(1,1)' }, { entita: 'casa', card: '(0,N)' }] },
  ]"
  :cella="[280, 130]"
/>

---

# I numeri stanno accanto all'entità che descrivono

Si leggono partendo dall'entità che hanno accanto: «ogni studente appartiene ad almeno una casa e al massimo a una», «ogni casa accoglie da zero a N studenti».

<Callout tipo="warning" titolo="Non all'altro capo della linea">

In UML e nella notazione _crow's foot_ il numero sta all'altro capo, e chi le conosce tende a invertire i lati.

- <Esito :ok="false" /> `(0,N)` accanto a `studente`, `(1,1)` accanto a `casa` → ogni casa ha esattamente uno studente.
- <Esito /> `(1,1)` accanto a `studente`, `(0,N)` accanto a `casa`.

</Callout>

---
layout: sezione
---

# Prima dello smistamento

Il minimo 1 accanto a `studente` dice che uno studente senza casa non esiste.

---
layout: domanda
invito: La casa manca, perché ancora nessuno la conosce. Che cosa fa il DBMS?
---

# Ginny Weasley ad agosto

La segreteria registra gli studenti appena parte la lettera. Ginny sarà smistata solo il 1° settembre.

<SqlRun dataset="archivista/casa-entita" errore>

```sql
INSERT INTO studente (nome, anno)
VALUES ('Ginny Weasley', 1);
```

</SqlRun>

::risposta::

La **rifiuta**: `NOT NULL constraint failed: studente.casa`. Ginny non entra finché il Cappello Parlante non decide, il che per una Weasley è una formalità.

---
layout: enunciato
---

Il minimo risponde a una domanda: un'occorrenza può **esistere senza comparire in nessuna coppia**?

Se il database registra gli studenti dopo lo smistamento, `(1,1)` va bene. Se li registra dalla lettera di ammissione, per qualche settimana uno studente esiste senza casa: serve **`(0,1)`**. La risposta dipende da che cosa il database registra, e da quando.

---
layout: sezione
---

# La seconda bacchetta di Ron

Il massimo decide un'altra cosa.

---
layout: figura
---

# Tutte le bacchette avute

::lato::

La prima bacchetta di Ron era di Charlie, e si è spezzata contro il Platano Picchiatore, con la Ford Anglia volante. Al terzo anno ne ha una nuova.

Se il database conserva **tutte** le bacchette avute, accanto a `studente` il massimo diventa **N**.

::figura::

<DiagrammaER
  titolo="Lo studente possiede una o più bacchette"
  descrizione="studente è collegata a bacchetta da possiede: (1,N) accanto a studente, (1,1) accanto a bacchetta."
  :entita="[
    { id: 'studente', col: 0, riga: 0, attributi: ['nome', 'anno'], latoAttributi: 'sopra' },
    { id: 'bacchetta', col: 0, riga: 2, attributi: ['legno', 'nucleo', 'lunghezza'], latoAttributi: 'sotto' },
  ]"
  :associazioni="[
    { id: 'possiede', col: 0, riga: 1, tra: [{ entita: 'studente', card: '(1,N)' }, { entita: 'bacchetta', card: '(1,1)' }] },
  ]"
  :cella="[280, 130]"
/>

---
layout: due-colonne
sinistra: Massimo 1
destra: Massimo N
---

# Un carattere nel diagramma, una struttura nel database

::sinistra::

Legno, nucleo e lunghezza potrebbero stare **nella riga dello studente**, una volta sola.

Se convenga, lo vedremo nel capitolo 3.

::destra::

Nella riga di Ron servirebbero due legni, due nuclei, due lunghezze, e una cella contiene **un valore solo**.

`legno_2` sposta il problema alla terza bacchetta: le bacchette vanno in una **tabella propria**, una riga per bacchetta.

---
layout: sezione
---

# Uno a uno, uno a molti, molti a molti

I massimi dei due lati danno il nome all'associazione.

---
layout: definizione
titolo: Cardinalità e partecipazione
---

La **cardinalità** di un'entità in un'associazione è la coppia `(min,max)`: in quante occorrenze dell'associazione può comparire ogni sua occorrenza, come minimo e come massimo.

La **partecipazione** è **obbligatoria** se il minimo è 1, **opzionale** se è 0.

---
layout: figura
---

# I tre tipi, e i minimi che non contano

::lato::

- **Uno a uno** (1:1): massimo 1 dai due lati, come `dirige`.
- **Uno a molti** (1:N): come `appartiene`.
- **Molti a molti** (N:N): studenti e corsi.

In `dirige` ogni casa ha un direttore, `(1,1)`; ogni professore ne dirige al massimo una, `(0,1)`: il minimo 0 serve a **Silente**.

::figura::

<DiagrammaER
  titolo="La casa è diretta da un professore"
  descrizione="casa è collegata a professore da dirige: (1,1) accanto a casa, (0,1) accanto a professore."
  :entita="[
    { id: 'casa', col: 0, riga: 0, attributi: ['nome', 'colori', 'animale'], latoAttributi: 'sopra' },
    { id: 'professore', col: 0, riga: 2, attributi: ['nome', 'materia'], latoAttributi: 'sotto' },
  ]"
  :associazioni="[
    { id: 'dirige', col: 0, riga: 1, tra: [{ entita: 'casa', card: '(1,1)' }, { entita: 'professore', card: '(0,1)' }] },
  ]"
  :cella="[280, 130]"
/>

---
layout: sintesi
---

# In sintesi

<Callout tipo="nutshell" titolo="In a nutshell">

- `(min,max)` si scrive accanto all'entità che descrive e si legge partendo da lei.
- Il **minimo**: un'occorrenza può esistere senza coppie? 0 opzionale, 1 obbligatoria.
- Il **massimo**: può comparire in più coppie? 1 oppure N.
- Un minimo sbagliato fa rifiutare un fatto vero, come Ginny prima dello smistamento.
- Un massimo N toglie il legame dalla colonna: servono righe in una tabella propria.
- I massimi danno il tipo: 1:1, 1:N, N:N. Decide il dominio.

</Callout>

---
layout: quiz
numero: 1 di 3
---

# Un compagno scrive `(0,N)` accanto a `studente` e `(1,1)` accanto a `casa`. Che cosa dice il suo diagramma?

<Opzione perche="Era l'intenzione, ma i numeri si leggono dall'entità che hanno accanto.">Ogni studente ha una casa, ogni casa da zero a N studenti.</Opzione>
<Opzione corretta perche="Esatto: ha scritto i numeri all'altro capo, come in UML.">Ogni casa ha esattamente uno studente, e uno studente può avere nessuna casa o molte.</Opzione>
<Opzione perche="Accanto a `studente` il minimo è 0, e accanto a `casa` c'è esattamente uno.">Ogni studente ha almeno una casa, ogni casa al massimo uno studente.</Opzione>
<Opzione perche="Scambiandole cambiano tutte e due le frasi.">Niente: si possono scambiare senza cambiare il significato.</Opzione>

---
layout: quiz
numero: 2 di 3
---

# In `dirige` un compagno scrive `(1,1)` accanto a `professore`. Che cosa succede quando si registra Silente?

<Opzione perche="Il preside non dirige nessuna casa.">Niente: il preside dirige tutte le case.</Opzione>
<Opzione corretta perche="Esatto: con minimo 1 ogni professore deve dirigere una casa.">Silente non si può registrare: accanto a `professore` il minimo giusto è 0.</Opzione>
<Opzione perche="Con minimo 1 la casa diretta non può restare vuota.">Silente viene registrato, con la casa vuota.</Opzione>
<Opzione perche="Il problema è il minimo accanto a `professore`.">Bisogna cambiare il massimo accanto a `casa` in N.</Opzione>

---
layout: quiz
numero: 3 di 3
---

# Il database conserva tutte le bacchette e i loro proprietari precedenti: quella di Ron era di Charlie. Che cardinalità ha `bacchetta` in `possiede`?

<Opzione perche="Vale per la bacchetta di adesso; quella di Charlie compare in due coppie.">`(1,1)`: ogni bacchetta ha un solo studente.</Opzione>
<Opzione perche="Il problema è il massimo, non il minimo.">`(0,1)`: alcune bacchette non hanno proprietario.</Opzione>
<Opzione corretta perche="Esatto: con N dai due lati, `possiede` diventa molti a molti.">`(1,N)`: una bacchetta può passare da più proprietari.</Opzione>
<Opzione perche="Basta un caso nel dominio per sapere che il massimo è N.">Non si può dire: dipende da quante bacchette ha avuto Charlie.</Opzione>

---
layout: fine
---

# La prossima lezione

Le coppie nominano le occorrenze per nome: (Harry Potter, Grifondoro). Funziona finché due studenti non si chiamano allo stesso modo. Succede, e cerchiamo un modo di distinguerli che **non si affidi alla fortuna**.
