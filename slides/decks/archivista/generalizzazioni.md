---
theme: ../../theme
title: Generalizzazioni
sottotitolo: Studenti e professori hanno nome, cognome e una bacchetta, e il modello li raccoglie sotto la persona. Ma una generalizzazione non ha una traduzione unica in tabelle, e ognuno dei tre modi perde qualcosa.
volume: archivista
capitolo: 2
numero: 11
lezione: archivista/generalizzazioni
---

---
layout: epigrafe
autore: George Orwell, La fattoria degli animali (1945)
---

All animals are equal, but some animals are more equal than others.

---
layout: obiettivi
---

# Da dove partiamo, dove arriviamo

::prerequisiti::

- Entità, attributi, identificatori assegnati apposta
- La `bacchetta` e l'associazione `possiede`
- L'archivio di tutti gli studenti passati da Hogwarts
- Ridondanza e tabelle unite con `JOIN`

::imparerai::

- Riconoscere entità che sono casi particolari di una più generale
- Disegnare una **generalizzazione** e la sua **copertura**
- Che cosa le figlie **ereditano** dal padre
- Che cosa perde ciascuno dei tre modi di farne tabelle

---
layout: sezione
---

# Due entità con le stesse proprietà

Anche Piton ha una bacchetta, come Harry.

---
layout: enunciato
---

Due associazioni `possiede`, nome e cognome due volte, il Patronus due volte: **ogni cosa nuova su tutte le persone va scritta due volte**.

Studenti e professori sono casi particolari della stessa cosa: una persona che vive a Hogwarts.

---
layout: definizione
titolo: Generalizzazione ed ereditarietà
---

Una **generalizzazione** lega un'entità **padre** a una o più entità **figlie** che ne sono casi particolari: ogni occorrenza di una figlia è anche un'occorrenza del padre. Ogni studente è una persona; non ogni persona è uno studente.

Le figlie **ereditano** attributi, identificatore e associazioni: uno studente ha un nome e possiede una bacchetta, anche se il diagramma lo scrive una volta sola, nel padre. Come l'ereditarietà fra classi Python, senza metodi.

---
layout: figura
didascalia: 'La freccia va dalle figlie al padre. A Hagrid hanno spezzato la bacchetta: accanto a persona, in possiede, il minimo è 0.'
---

# La persona generalizza lo studente e il professore

::figura::

<DiagrammaER
  titolo="La persona generalizza lo studente e il professore"
  descrizione="persona (codice, nome, cognome) possiede bacchetta: (0,N) accanto a persona, (1,1) accanto a bacchetta. Sotto persona, una generalizzazione (p,e) con le figlie studente (anno) e professore (materia)."
  :entita="[
    { id: 'bacchetta', col: 0, riga: 0, attributi: ['legno', 'nucleo', 'lunghezza'], latoAttributi: 'sopra' },
    { id: 'persona', col: 2, riga: 0, attributi: [{ nome: 'codice', identificatore: true }, 'nome', 'cognome'], latoAttributi: 'sopra' },
    { id: 'studente', col: 1, riga: 2, attributi: ['anno'], latoAttributi: 'sotto' },
    { id: 'professore', col: 3, riga: 2, attributi: ['materia'], latoAttributi: 'sotto' },
  ]"
  :associazioni="[
    { id: 'possiede', col: 1, riga: 0, tra: [{ entita: 'persona', card: '(0,N)' }, { entita: 'bacchetta', card: '(1,1)' }] },
  ]"
  :generalizzazioni="[
    { padre: 'persona', figli: ['studente', 'professore'], copertura: '(p,e)' },
  ]"
  :cella="[190, 110]"
/>

---

# Una generalizzazione non è un'associazione

<Callout tipo="warning" titolo="Un'occorrenza sola, non due">

- <Esito :ok="false" /> un rombo `è` fra `studente` e `persona` → Harry diventa due occorrenze legate da una coppia; lo studente non eredita niente, e il nome va scritto due volte.
- <Esito /> una generalizzazione fra `persona` e `studente` → Harry è un'occorrenza sola, che appartiene a `persona` e a `studente` insieme.

</Callout>

---
layout: sezione
---

# La copertura

Due lettere accanto alla freccia, che rispondono a due domande sul dominio.

---
layout: due-colonne
sinistra: Totale o parziale?
destra: Esclusiva o sovrapposta?
---

# Le due domande della copertura

::sinistra::

Ogni persona registrata è per forza uno studente o un professore?

**Hagrid** no: è il guardiacaccia. Se il database registra anche lui, la generalizzazione è **parziale**, `p`. Altrimenti **totale**, `t`.

::destra::

Una persona può essere studente e professore insieme?

In un anno scolastico no: **esclusiva**, `e`. Nell'archivio di tutti gli anni sì: **Piton** e **Lupin** hanno studiato e poi insegnato. È **sovrapposta**, `o`.

---
layout: definizione
titolo: Copertura
---

La copertura è **totale** se ogni occorrenza del padre appartiene ad almeno una figlia, **parziale** se alcune non appartengono a nessuna. È **esclusiva** se ogni occorrenza appartiene al massimo a una figlia, **sovrapposta** se può appartenere a più di una.

Si scrive con due lettere: `(t,e)`, `(t,o)`, `(p,e)`, `(p,o)`. Come le cardinalità, non si ricava dai nomi: dipende da che cosa il database registra.

---
layout: figura
---

# Le persone di Hogwarts e le loro figlie

::figura::

<Figura id="copertura-persone" />

---
layout: sezione
---

# Tre modi di farne tabelle

Una tabella non ha figlie: prima di passare alle tabelle, la generalizzazione va tolta.

---
layout: due-colonne
rapporto: 3/2
centro: true
---

# Solo il padre

::sinistra::

| codice | nome | tipo | anno | materia |
|---|---|---|---|---|
| 1 | Harry | studente | 1 | |
| 2 | Severus | professore | | Pozioni |
| 3 | Rubeus | | | |

::destra::

Le figlie spariscono nel padre, con una colonna `tipo`.

- <Esito /> Hagrid ci sta, e `possiede` resta una.
- <Esito :ok="false" /> niente impedisce uno studente con una materia, o senza anno.
- <Esito :ok="false" /> un `tipo` solo non sa dire che Piton è stato studente.

---
layout: due-colonne
---

# Solo le figlie

::sinistra::

| codice | nome | anno |
|---|---|---|
| 1 | Harry | 1 |

| codice | nome | materia |
|---|---|---|
| 2 | Severus | Pozioni |

::destra::

Il padre sparisce; ogni figlia riceve i suoi attributi.

- <Esito /> le regole delle figlie restano.
- <Esito :ok="false" /> **Hagrid non ha una tabella** in cui stare.
- <Esito :ok="false" /> nell'archivio Piton compare due volte: è la ridondanza del capitolo 1.

---
layout: due-colonne
rapporto: 2/3
centro: true
---

# Padre e figlie, collegati

::sinistra::

| codice | nome |
|---|---|
| 1 | Harry |
| 2 | Severus |
| 3 | Rubeus |

| codice | anno |
|---|---|
| 1 | 1 |

::destra::

Restano tutte e tre; il codice di ogni figlia indica una riga di `persona`.

- <Esito /> Hagrid sta solo in `persona`; nome e cognome scritti una volta.
- <Esito :ok="false" /> per nome e anno di uno studente serve un **incrocio** fra due tabelle.
- <Esito :ok="false" /> niente fa rispettare la copertura.

---

# Che cosa conserva, che cosa perde

| Modo | Conserva | Perde |
|---|---|---|
| solo il padre | le persone senza figlia, un'associazione sola | le regole delle figlie, la copertura sovrapposta |
| solo le figlie | le regole delle figlie | le persone senza figlia; nomi scritti due volte |
| padre e figlie | tutte le informazioni | la semplicità delle domande, il controllo della copertura |

Nessuno va bene sempre: si sceglie guardando che cosa il dominio **non può permettersi di perdere**.

---
layout: sintesi
---

# In sintesi

<Callout tipo="nutshell" titolo="In a nutshell">

- Una **generalizzazione** lega un padre a figlie che ne sono casi particolari.
- Le figlie **ereditano** attributi, identificatore e associazioni; nel diagramma hanno solo i propri.
- Non è un'associazione: studente e persona sono la stessa occorrenza.
- La **copertura** è totale o parziale, esclusiva o sovrapposta, e dipende da che cosa si registra.
- Tre modi di farne tabelle: solo il padre, solo le figlie, padre e figlie. Ognuno perde qualcosa.

</Callout>

---
layout: quiz
numero: 1 di 3
---

# Un database registra solo studenti e professori dell'anno in corso, sotto `persona`. Che copertura ha la generalizzazione?

<Opzione corretta perche="Esatto: senza Hagrid ognuno ha una figlia, e in un anno nessuno è entrambe le cose.">`(t,e)`: ognuno è studente o professore, nessuno tutti e due.</Opzione>
<Opzione perche="La copertura riguarda le occorrenze registrate, non la scuola.">`(p,e)`: a Hogwarts c'è anche chi non è né l'uno né l'altro.</Opzione>
<Opzione perche="Quest'anno Piton è soltanto professore.">`(t,o)`: Piton è stato studente ed è professore.</Opzione>
<Opzione perche="Si decide sul dominio, non sui dati.">Non si può dire senza vedere i dati.</Opzione>

---
layout: quiz
numero: 2 di 3
---

# Nel diagramma `studente` ha un solo attributo, `anno`. Uno studente ha un nome?

<Opzione perche="Non è disegnato accanto a `studente` perché sta nel padre.">No: il nome non compare fra i suoi attributi.</Opzione>
<Opzione corretta perche="Esatto: ha tutto ciò che ha una persona, più l'anno.">Sì: lo eredita da `persona`, con il codice e `possiede`.</Opzione>
<Opzione perche="Scritto due volte, la generalizzazione perderebbe il suo scopo.">Sì, ma va scritto anche in `studente`, per chiarezza.</Opzione>
<Opzione perche="L'ereditarietà vale con ogni copertura.">Solo se la copertura è totale.</Opzione>

---
layout: quiz
numero: 3 di 3
---

# Il database deve registrare anche Hagrid, né studente né professore. Quale modo di fare le tabelle non può farlo?

<Opzione perche="Hagrid è una riga di `persona` con il `tipo` vuoto.">Solo il padre.</Opzione>
<Opzione corretta perche="Esatto: senza `persona` restano solo `studente` e `professore`.">Solo le figlie.</Opzione>
<Opzione perche="Hagrid ha una riga in `persona` e nessuna nelle figlie.">Padre e figlie, collegati.</Opzione>
<Opzione perche="Un'entità con un'occorrenza e nessun attributo è l'errore opposto.">Nessuno: serve una figlia `guardiacaccia`.</Opzione>

---
layout: fine
---

# Il prossimo capitolo

Il modello E/R è completo. Si riparte dalle **tabelle**: che cosa è davvero una tabella nel modello relazionale, e quali regole trasformano ogni elemento del diagramma in tabelle senza perdere informazione.
