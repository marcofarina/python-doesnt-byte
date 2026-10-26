---
theme: ../../theme
title: Che cosa fa un DBMS al posto tuo
sottotitolo: Un database non è un file più grosso. Il DBMS risponde alle domande, incrocia le tabelle, rifiuta un nome che non esiste e coordina chi scrive insieme.
volume: archivista
capitolo: 1
numero: 4
lezione: archivista/che-cosa-fa-un-dbms
---

---
layout: epigrafe
autore: E. F. Codd, A Relational Model of Data for Large Shared Data Banks (1970)
---

Future users of large data banks must be protected from having to know how the data is organized in the machine (the internal representation).

---
layout: obiettivi
---

# Da dove partiamo, dove arriviamo

::prerequisiti::

- `punti.json`, `studenti.json` e l'incrocio con un dizionario
- La ridondanza e la regola «un fatto, un posto»
- Leggere e riscrivere un file JSON con `json`

::imparerai::

- Perché un database non è un file più grosso
- Una domanda che descrive il risultato contro un programma che descrive i passi
- Quando un **vincolo** rifiuta un dato e quando lo lascia passare
- Riconoscere un **aggiornamento perso**

---
layout: enunciato
---

Con i file si sceglie fra **copie che si contraddicono** e **incroci scritti a mano**. E resta una domanda: che cosa succede se due professori scrivono insieme?

Mettiamo il registro in un database e guardiamo, un problema alla volta, che cosa fa il DBMS al posto del nostro programma.

---
layout: sezione
---

# Il registro in un database

Il programma non apre più un file: manda una richiesta al DBMS e riceve la risposta.

---
layout: definizione
titolo: Database e DBMS
---

Un **database** è un insieme di dati organizzati secondo una struttura stabilita in anticipo, conservati in modo permanente e **condivisi** da più programmi e utenti.

Un **DBMS** (_Database Management System_) è il software che lo gestisce: conserva i dati, risponde alle richieste e fa rispettare le regole sui dati. Il database sono i dati, il DBMS è il programma.

---

# Tre tabelle, un fatto per posto

- **`studente`**: nome, casa e anno, come `studenti.json`.
- **`professore`**: l'elenco dei professori, che nei file non c'era.
- **`assegnazione`**: chi ha ricevuto i punti, quanti e da chi. Senza la casa.

<StatoDb dataset="archivista/registro-punti" tabelle="assegnazione" :massimo="5" />

---
layout: figura
---

# Le tabelle si collegano attraverso i nomi

::figura::

<Figura id="tabelle-collegate" />

---
layout: sezione
---

# Domande senza programma

Al DBMS si fa una richiesta, una **query**, e lui risponde con una tabella.

---

# Il totale di ogni casa

La query si legge quasi come una frase. La sintassi la impareremo più avanti: per ora conta la forma.

<SqlRun dataset="archivista/registro-punti" uscita="destra">

```sql
SELECT studente.casa,
       SUM(assegnazione.punti) AS totale
FROM assegnazione
JOIN studente
  ON studente.nome = assegnazione.studente
GROUP BY studente.casa
ORDER BY totale DESC;
```

</SqlRun>

La casa non sta in `assegnazione`: l'**incrocio** con `studente` lo fa il DBMS.

---
layout: due-colonne
sinistra: Con i file · i passi
destra: Con il DBMS · il risultato
---

# La domanda di Silente, in due modi

::sinistra::

```python
anno_di = {}
for s in studenti:
    anno_di[s["nome"]] = s["anno"]

per_anno = {}
for a in registro:
    anno = anno_di[a["studente"]]
    per_anno[anno] = (
        per_anno.get(anno, 0) + a["punti"])
```

::destra::

<SqlRun dataset="archivista/registro-punti">

```sql
SELECT studente.anno,
       SUM(assegnazione.punti)
FROM assegnazione
JOIN studente
  ON studente.nome =
     assegnazione.studente
GROUP BY studente.anno;
```

</SqlRun>

---
layout: definizione
titolo: Dichiarativo e imperativo
---

Python descrive i **passi**: costruisci un dizionario, scorri il registro, accumula. È un linguaggio **imperativo**.

SQL, il linguaggio delle query, descrive il **risultato**: in che ordine leggere le righe e dove accumulare lo sceglie il DBMS. È un linguaggio **dichiarativo**, come la Stanza delle Necessità: chiedi quello che ti serve, e come prepararlo è affar suo.

---

# Ogni domanda è una query

La domanda di McGonagall, che con i file era un programma nuovo.

<SqlRun dataset="archivista/registro-punti" uscita="destra">

```sql
SELECT assegnazione.professore,
       -SUM(assegnazione.punti) AS tolti
FROM assegnazione
JOIN studente
  ON studente.nome = assegnazione.studente
WHERE studente.casa = 'Grifondoro'
  AND assegnazione.punti < 0
GROUP BY assegnazione.professore
ORDER BY tolti DESC;
```

</SqlRun>

Per il DBMS non esistono domande previste e domande nuove. E per trovare in fretta costruisce da solo un **indice**, aggiornato a ogni inserimento.

---
layout: sezione
---

# Il nome che non esiste

Nel file JSON «Neville Logbottom» è entrato senza avvisi. E nel database?

---
layout: domanda
affiancata: true
invito: Che cosa fa il DBMS con il nome scritto male?
---

# Un'assegnazione con il nome sbagliato

Inserisci nella tabella `assegnazione`, nelle colonne `studente`, `punti` e `professore`, questi valori:

<SqlRun dataset="archivista/registro-punti" errore>

```sql
INSERT INTO assegnazione
  (studente, punti, professore)
VALUES ('Neville Logbottom', 5, 'Sprout');
```

</SqlRun>

::risposta::

Lo **rifiuta**: `FOREIGN KEY constraint failed`. Il nome `Neville Logbottom` non compare nella tabella `studente`, e la riga non entra.

---
layout: definizione
titolo: Vincolo
---

Una regola sui dati che il DBMS fa rispettare a **ogni scrittura** si chiama **vincolo**. Quello che lega una colonna alle righe di un'altra tabella è un vincolo di **chiave esterna**.

Con i file l'errore arrivava a chi leggeva, magari mesi dopo. Con il DBMS arriva **a chi scrive, mentre scrive**, e vale per qualunque programma, anche per quello che qualcuno scriverà l'anno prossimo.

---

# Un nome che esiste non è il nome giusto

<Callout tipo="warning" titolo="Il vincolo controlla l'esistenza, non la verità">

- <Esito :ok="false" /> `'Neville Logbottom'` → rifiutato: non esiste.
- <Esito :ok="false" /> `'Harry Potter'` → **accettato** senza avvisi: i punti di Neville finiscono a Harry.
- <Esito /> `'Neville Longbottom'` → accettato, ed è il nome giusto.

</Callout>

Il DBMS ferma i dati **impossibili**, non quelli sbagliati ma possibili. A chi andassero davvero i punti lo sa solo chi li ha assegnati.

---
layout: domanda
affiancata: true
invito: Lupin non è fra i professori. Come fai accettare la sua assegnazione, senza cambiarla?
---

# La prima assegnazione di Lupin

<SqlRun dataset="archivista/registro-punti" database="professore,assegnazione" seguito>

```sql
INSERT INTO professore (nome)
VALUES ('Lupin');
INSERT INTO assegnazione
  (studente, punti, professore)
VALUES ('Neville Longbottom', 10, 'Lupin');
```

</SqlRun>

::risposta::

Prima Lupin entra in `professore`, poi la sua assegnazione. Con i file un professore esisteva solo se dava punti; qui **non può dare punti finché non esiste**. Il vincolo stabilisce l'ordine delle scritture.

---
layout: sezione
---

# Due professori nello stesso momento

La domanda lasciata in sospeso nella prima lezione.

---
layout: domanda
affiancata: true
invito: Il file parte da 18 assegnazioni. Quante ne contiene alla fine?
---

# Due salvataggi sullo stesso file

<PyRun>

```python
import json
from archivio_hogwarts import leggi_file
disco = leggi_file("punti.json")
mcgonagall = json.loads(disco)
piton = json.loads(disco)
mcgonagall.append({"studente": "Ron Weasley", "punti": -5})
piton.append({"studente": "Draco Malfoy", "punti": 5})
disco = json.dumps(mcgonagall)
disco = json.dumps(piton)
registro = json.loads(disco)
print(len(registro), registro[-1])
```

</PyRun>

::risposta::

**19**, non 20: Piton ha salvato sopra una copia letta prima che McGonagall salvasse la sua. L'assegnazione di Ron è sparita.

---
layout: figura
---

# L'ultimo che salva cancella l'altro

::figura::

<Figura id="aggiornamento-perso" />

---
layout: definizione
titolo: Aggiornamento perso
---

Due programmi leggono lo stesso dato, lo modificano ciascuno per conto suo, e l'**ultimo che scrive cancella il lavoro dell'altro**. Nessuna istruzione dà errore.

Nella realtà l'ordine dipende da chi salva per ultimo: a volte succede e a volte no, e un errore che succede solo a volte è il più difficile da trovare.

---
layout: figura
---

# Con il DBMS, nessuno riscrive il registro

::figura::

<Figura id="insert-coordinati" />

---
layout: sintesi
---

# In sintesi

<Callout tipo="nutshell" titolo="In a nutshell">

- Un database non è un file più grosso: il DBMS fa lavori che prima stavano in ogni programma.
- Al DBMS si manda una **query**; gli incroci li fa lui.
- Una query descrive il risultato (**dichiarativo**), un programma i passi (**imperativo**).
- Un **vincolo** è una regola che il DBMS fa rispettare a ogni scrittura, per qualunque programma.
- Il vincolo controlla che un nome esista, non che sia giusto, e decide l'ordine delle scritture.
- Riscrivere lo stesso file in due può perdere una scrittura in silenzio: l'**aggiornamento perso**.

</Callout>

---
layout: quiz
numero: 1 di 3
---

# Sprout scrive per sbaglio cinque punti a `'Hermione Granger'` invece che a Neville. Che cosa fa il DBMS?

<Opzione perche="Il vincolo rifiuta solo i nomi che non esistono, e Hermione c'è.">Rifiuta con `FOREIGN KEY constraint failed`.</Opzione>
<Opzione corretta perche="Esatto: per il vincolo la riga è valida. Il resto lo sa solo chi ha assegnato i punti.">Accetta l'inserimento.</Opzione>
<Opzione perche="Nessuna regola dichiarata riguarda quante assegnazioni ha uno studente.">Accetta, ma avvisa che Hermione ha altre assegnazioni.</Opzione>
<Opzione perche="Il DBMS non chiede conferme: esegue o rifiuta.">Chiede conferma prima di scrivere.</Opzione>

---
layout: quiz
numero: 2 di 3
---

# Perché, con un database, le assegnazioni di McGonagall e Piton non si perdono?

<Opzione perche="Una copia di sicurezza non impedisce che una scrittura cancelli l'altra.">Il DBMS fa una copia di sicurezza prima di ogni salvataggio.</Opzione>
<Opzione corretta perche="Esatto: nessun programma ha una copia del registro da riscrivere.">Ogni programma manda solo la sua riga, e il DBMS la aggiunge senza riscrivere le altre.</Opzione>
<Opzione perche="La velocità rende l'errore più raro, non impossibile.">Il DBMS è così veloce che i salvataggi non si sovrappongono.</Opzione>
<Opzione perche="Un DBMS serve molti utenti insieme: è uno dei motivi per cui esiste.">Il DBMS accetta un solo utente alla volta.</Opzione>

---
layout: quiz
numero: 3 di 3
---

# Un compagno dice che un database è un file JSON più grande e più veloce. Quale fatto della lezione lo smentisce?

<Opzione perche="Anche i dizionari JSON hanno chiavi con un nome.">Le tabelle hanno colonne con un nome.</Opzione>
<Opzione corretta perche="Esatto: un file conserva qualunque cosa, il DBMS controlla le scritture.">Il DBMS ha rifiutato un'assegnazione a uno studente che non esiste.</Opzione>
<Opzione perche="Anche un programma può stampare una tabella.">Il DBMS mostra le risposte come tabelle.</Opzione>
<Opzione perche="Anche prima i dati stavano in più file, senza controlli sui collegamenti.">I dati stanno in più tabelle invece che in un file.</Opzione>

---
layout: fine
---

# Il prossimo capitolo

Le tre tabelle di questa lezione sono arrivate già pronte. Si parte dal problema che viene prima: dato un dominio, come si decide **quali tabelle servono**? Si comincia dalle **entità** e dai loro **attributi**.
