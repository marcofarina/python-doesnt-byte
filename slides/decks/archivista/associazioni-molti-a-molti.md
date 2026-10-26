---
theme: ../../theme
title: Le associazioni molti a molti
sottotitolo: Un’associazione molti a molti non sta in un attributo, e i suoi attributi appartengono alla coppia. Ogni coppia però compare una volta sola, e quando lo stesso fatto si ripete serve un’entità.
volume: archivista
capitolo: 2
numero: 9
lezione: archivista/associazioni-molti-a-molti
---

---
layout: epigrafe
autore: Alexandre Dumas, I tre moschettieri (1844)
---

Tous pour un, un pour tous.

---
layout: obiettivi
---

# Da dove partiamo, dove arriviamo

::prerequisiti::

- Le cardinalità e i tre tipi di associazione
- L'identificatore di `corso`, materia e anno, e quello assegnato apposta
- Il registro dei punti e la tabella `assegnazione`

::imparerai::

- Perché un'associazione **molti a molti** non sta in un attributo
- Decidere se un attributo è di un'entità o **dell'associazione**
- Perché una coppia compare una volta sola, e quando serve un'**entità**

---
layout: sezione
---

# I corsi in una colonna

Ogni studente segue più corsi, e ogni corso ha più studenti. Proviamo con una colonna.

---

# Tutti i corsi in una cella

Come per la casa, una colonna nella tabella `studente`: i corsi stanno nella stessa cella, separati da virgole.

<StatoDb dataset="archivista/corsi-colonna" tabelle="studente" :massimo="4" />

---
layout: domanda
invito: Quanti nomi elenca?
---

# Chi segue Pozioni?

Il nome degli studenti per cui la colonna `corsi` è uguale a `Pozioni`:

<SqlRun dataset="archivista/corsi-colonna" seguito>

```sql
SELECT nome FROM studente
WHERE corsi = 'Pozioni';
```

</SqlRun>

::risposta::

**Nessuno**, anche se tutti e nove seguono Pozioni. La cella contiene `Erbologia, Incantesimi, Pozioni, Trasfigurazione`: un testo che contiene Pozioni senza essere Pozioni.

---
layout: enunciato
---

Il DBMS non ha sbagliato: l'errore è **quattro coppie in una cella sola**.

Ogni domanda sui corsi diventa un lavoro sul testo, che troverebbe Pozioni anche in «Pozioni avanzate». E una domanda non ha risposta in nessun modo: **che voto ha preso Hermione in Pozioni?**

---
layout: sezione
---

# Il voto è della coppia

Né di Hermione, né del corso di Pozioni.

---
layout: definizione
titolo: Attributo di un'associazione
---

Un **attributo di un'associazione** ha un valore per ogni **coppia**, e non per le occorrenze delle due entità prese una per una.

Il voto di Hermione in Pozioni esiste perché Hermione segue quel corso: Hermione ha un voto per ogni corso, il corso un voto per ogni studente. Il voto appartiene alla coppia (Hermione Granger, Pozioni del primo anno).

---
layout: figura
---

# L'iscrizione, con il voto

::lato::

- Con attributi suoi, il nome naturale è spesso un **sostantivo**: l'**iscrizione**.
- `voto` esce dal rombo, come gli attributi di un'entità escono dal rettangolo.
- Ogni studente ha almeno un corso, `(1,N)`; un corso può non avere ancora iscritti, `(0,N)`.

::figura::

<DiagrammaER
  titolo="Lo studente si iscrive a un corso, con un voto"
  descrizione="studente (matricola) è collegata a corso (materia e anno) da iscrizione, con l'attributo voto. (1,N) accanto a studente, (0,N) accanto a corso."
  :entita="[
    { id: 'studente', col: 0, riga: 0, attributi: [{ nome: 'matricola', identificatore: true }, 'nome'], latoAttributi: 'sopra' },
    { id: 'corso', col: 0, riga: 2, attributi: ['materia', 'anno'], latoAttributi: 'sotto', identificatore: ['materia', 'anno'] },
  ]"
  :associazioni="[
    { id: 'iscrizione', col: 0, riga: 1, attributi: ['voto'], latoAttributi: 'destra', tra: [{ entita: 'studente', card: '(1,N)' }, { entita: 'corso', card: '(0,N)' }] },
  ]"
  :cella="[280, 150]"
/>

---

# Una riga per ogni coppia

Nelle tabelle, un'associazione molti a molti diventa una **tabella propria**, con una riga per ogni coppia. Come si costruisce, lo vedremo nel capitolo 3.

<StatoDb dataset="archivista/iscrizione" tabelle="iscrizione" :massimo="6" />

---
layout: domanda
invito: In quale materia Neville ha il voto più alto?
---

# I voti di Neville

<SqlRun dataset="archivista/iscrizione" seguito>

```sql
SELECT materia, voto FROM iscrizione
WHERE studente = 'Neville Longbottom';
```

</SqlRun>

::risposta::

**Erbologia**, 10; in Pozioni ha 4, e chi l'ha visto sciogliere un calderone non se ne stupisce. Lo stesso Neville compare in quattro coppie, con quattro voti: il voto sta nella coppia.

---
layout: sezione
---

# La stessa coppia due volte

Il registro dei punti sembra un'altra associazione molti a molti, con l'attributo `punti`.

---
layout: enunciato
---

Piton toglie un punto a Harry per insolenza, e poi **un altro** per non aver aiutato Neville.

Un'associazione è un insieme di coppie: (Piton, Harry Potter) c'è oppure non c'è. Non può esserci due volte.

---
layout: figura
---

# La stessa coppia, due volte

::figura::

<Figura id="coppia-ripetuta" />

---

# Le scorciatoie non funzionano

- **Sommare** i due punti in −2 perde un'informazione: sono stati due volte uno, in due momenti diversi.
- **Aggiungere la data** non cambia niente: l'occorrenza resta la coppia, e la data sarebbe una sola.

<Callout tipo="definition" titolo="Quando il fatto si ripete">

Quando lo stesso fatto può ripetersi per la stessa coppia, non è un'associazione: è un'**entità**, con un'occorrenza per ogni volta che succede. Le occorrenze si distinguono con un identificatore assegnato apposta, come l'`id` della tabella `assegnazione`.

</Callout>

---
layout: figura
didascalia: Ogni assegnazione è ricevuta da uno studente e data da un professore; le due di Piton a Harry hanno due id diversi.
---

# L'assegnazione come entità

::figura::

<DiagrammaER
  titolo="L'assegnazione come entità fra lo studente e il professore"
  descrizione="Tre entità in fila: studente, assegnazione (id e punti) e professore. riceve collega studente (0,N) e assegnazione (1,1); dà collega professore (0,N) e assegnazione (1,1)."
  :entita="[
    { id: 'studente', col: 0, riga: 0, attributi: [{ nome: 'matricola', identificatore: true }, 'nome'], latoAttributi: 'sopra' },
    { id: 'assegnazione', col: 2, riga: 0, attributi: [{ nome: 'id', identificatore: true }, 'punti'], latoAttributi: 'sopra' },
    { id: 'professore', col: 4, riga: 0, attributi: ['nome', 'materia'], latoAttributi: 'sopra' },
  ]"
  :associazioni="[
    { id: 'riceve', col: 1, riga: 0, tra: [{ entita: 'studente', card: '(0,N)' }, { entita: 'assegnazione', card: '(1,1)' }] },
    { id: 'dà', col: 3, riga: 0, tra: [{ entita: 'professore', card: '(0,N)' }, { entita: 'assegnazione', card: '(1,1)' }] },
  ]"
  :cella="[170, 160]"
/>

---
layout: enunciato
---

La domanda per scegliere: **la stessa coppia può comparire più di una volta?**

Uno studente si iscrive a un corso una volta sola: l'iscrizione è un'associazione. Un professore può dare punti allo stesso studente quante volte vuole: l'assegnazione è un'entità.

---
layout: sintesi
---

# In sintesi

<Callout tipo="nutshell" titolo="In a nutshell">

- Una molti a molti non sta in un attributo: più valori in una cella rendono ogni domanda un lavoro sul testo.
- Un **attributo dell'associazione** ha un valore per ogni coppia: il voto è dell'iscrizione.
- Con attributi, il nome è spesso un sostantivo: l'iscrizione.
- Un'associazione è un insieme di coppie: ogni coppia compare **una volta sola**.
- Se lo stesso fatto si ripete per la stessa coppia, è un'**entità**, legata alle altre da due uno a molti.

</Callout>

---
layout: quiz
numero: 1 di 3
---

# Quale di questi attributi appartiene all'associazione `iscrizione` fra `studente` e `corso`?

<Opzione perche="Ha un valore per ogni corso, uguale per tutti gli iscritti: è di `corso`.">L'aula in cui si tiene il corso.</Opzione>
<Opzione corretta perche="Esatto: ha un valore per ogni coppia studente-corso.">La data in cui lo studente si è iscritto al corso.</Opzione>
<Opzione perche="Ha un valore per ogni studente, uguale per tutti i suoi corsi: è di `studente`.">L'anno che lo studente frequenta.</Opzione>
<Opzione perche="Dipende dal corso, non dalla coppia.">Il nome del professore che tiene il corso.</Opzione>

---
layout: quiz
numero: 2 di 3
---

# Lo stesso studente può prendere in prestito lo stesso libro più volte, in giorni diversi. Come si modella il prestito?

<Opzione perche="La coppia (studente, libro) comparirebbe una volta sola, con una data sola.">Associazione molti a molti con l'attributo `data`.</Opzione>
<Opzione corretta perche="Esatto: il prestito si ripete per la stessa coppia, quindi è un'entità.">Un'entità `prestito` con `data`, legata a studente e libro da due uno a molti.</Opzione>
<Opzione perche="È il tentativo dei corsi in una colonna.">Un attributo `libri_presi` con i titoli separati da virgole.</Opzione>
<Opzione perche="Un conteggio perde le date dei singoli prestiti.">Associazione con un attributo `numero_prestiti`.</Opzione>

---
layout: quiz
numero: 3 di 3
---

# Un compagno sostituisce la colonna `corsi` con `corso_1`, `corso_2`, `corso_3` e `corso_4`. Che cosa resta da risolvere?

<Opzione perche="L'associazione è ancora dentro `studente`: i problemi si sono spostati.">Niente: ogni cella contiene un valore solo.</Opzione>
<Opzione perche="Una colonna per materia richiede colonne nuove, e il voto resta senza posto.">Solo i nomi delle colonne.</Opzione>
<Opzione corretta perche="Esatto: serve una tabella propria, una riga per coppia.">Il quinto corso non ci sta, Pozioni va cercata in quattro colonne, e il voto non ha posto.</Opzione>
<Opzione perche="Lo studente resta identificato dalla matricola.">L'identificatore dello studente.</Opzione>

---
layout: fine
---

# La prossima lezione

Hai tutti gli elementi del modello E/R. Finora il dominio è cresciuto una richiesta alla volta: ora partiamo da un testo che descrive un dominio intero, la **biblioteca di Hogwarts**, e lo trasformiamo in un modello con un metodo ripetibile.
