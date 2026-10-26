---
theme: ../../theme
title: 'Identificare senza ambiguità: le chiavi'
sottotitolo: Due persone possono avere lo stesso nome. Con due James Potter nell’archivio di Hogwarts vediamo come fallisce un identificatore sbagliato e come se ne sceglie uno che regge.
volume: archivista
capitolo: 2
numero: 8
lezione: archivista/le-chiavi
---

---
layout: epigrafe
autore: William Shakespeare, Romeo e Giulietta (1597)
---

What's in a name? That which we call a rose by any other name would smell as sweet.

---
layout: obiettivi
---

# Da dove partiamo, dove arriviamo

::prerequisiti::

- La tabella `studente` e il collegamento per nome con `assegnazione`
- Il **vincolo**: una regola che il DBMS fa rispettare rifiutando una scrittura
- Entità, attributi, associazioni e cardinalità

::imparerai::

- I due modi in cui fallisce un identificatore sbagliato
- Che cos'è un **identificatore** e quali condizioni rispetta
- Scegliere fra un identificatore del dominio e uno assegnato apposta
- Disegnare un identificatore semplice e uno composto

---
layout: sezione
---

# Due James Potter

Un archivio che conserva tutti gli studenti, anno dopo anno, prima o poi incontra due nomi uguali.

---

# Nella famiglia di Harry è già successo

Hogwarts vuole conservare **tutti** gli studenti passati dalla scuola, senza cancellarne nessuno.

- **James Potter**, il padre di Harry: Grifondoro, primo anno
- **James Potter**, il figlio maggiore di Harry: primo anno, più di quarant'anni dopo

Nella tabella `studente` la colonna `nome` è la **chiave**: la colonna con cui il DBMS distingue una riga da tutte le altre, e con cui `assegnazione` indica a chi vanno i punti.

---
layout: domanda
---

# Registriamo i due James Potter

<SqlRun dataset="archivista/registro-punti" database="studente" uscita="destra" errore>

```sql
INSERT INTO studente (nome, casa, anno)
VALUES ('James Potter', 'Grifondoro', 1);
INSERT INTO studente (nome, casa, anno)
VALUES ('James Potter', 'Grifondoro', 1);
```

</SqlRun>

::risposta::

Il primo entra, il secondo viene rifiutato: `UNIQUE constraint failed: studente.nome`. Nella colonna `nome` lo stesso valore non può comparire due volte.

---
layout: enunciato
---

Primo guasto: il database **rifiuta uno studente vero**.

Il DBMS fa rispettare la regola che ha ricevuto, il nome distingue ogni studente. Per questo archivio la regola è falsa, e l'errore arriva nel momento in cui qualcuno prova a scrivere.

---
layout: sezione
---

# Senza chiave

Togliamo la regola: la tabella accetta due righe con lo stesso nome. Che cosa succede ai conti?

---
layout: domanda
invito: Nella lezione sul DBMS Grifondoro aveva 3 punti; arriva un'assegnazione da 10. Quanti ne ha adesso?
---

# Il totale dei punti per casa

<SqlRun dataset="archivista/omonimi" uscita="destra">

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

::risposta::

Grifondoro ha **23** punti, non 13: l'assegnazione a `James Potter` si unisce a tutte e due le righe con quel nome, e i dieci punti entrano nella somma due volte.

---
layout: figura
---

# I dieci punti contati due volte

::figura::

<Figura id="unione-senza-chiave" />

---
layout: enunciato
---

Secondo guasto: la risposta è **sbagliata e nessuno lo segnala**.

La query è corretta, il DBMS la esegue sui dati che ha. È il guasto più pericoloso: nessuno se ne accorge finché qualcuno non rifà il conto a mano.

---
layout: sezione
---

# Che cosa distingue uno studente

Serve un attributo, o un gruppo di attributi, con un valore diverso per ogni occorrenza.

---
layout: definizione
titolo: Identificatore
---

Un **identificatore** di un'entità è un attributo, o un insieme di attributi, che ha un valore diverso per ogni occorrenza: per **tutte** quelle che il database conterrà, non solo per quelle di oggi. Non contiene attributi superflui.

Formato da un solo attributo è **semplice**; da più attributi, **composto**.

---
layout: due-colonne
sinistra: Aggiungere attributi non basta
destra: La strada che regge
---

# La parola che conta è «tutte»

::sinistra::

- **nome**: due James Potter
- **nome + anno**: erano tutti e due al primo anno
- **nome + data di nascita**: due omonimi nati lo stesso giorno sono rari, non impossibili

Ogni attributo aggiunto rende il caso più raro; nessuno lo rende impossibile.

::destra::

Un identificatore **nato apposta per essere unico**: il numero di **matricola** che la segreteria assegna e non riassegna mai.

Non contiene informazioni sullo studente: non lo mettono in difficoltà né un omonimo né un cambio di cognome. A garantire che sia unico è chi lo assegna.

---

# Anche il codice fiscale ha i suoi doppioni

<Callout tipo="info" titolo="Omocodia">

Il codice fiscale si calcola da cognome, nome, sesso, data e comune di nascita: due persone con gli stessi dati hanno lo stesso codice, e l'Agenzia delle Entrate cambia alcune cifre in lettere. È unico perché **qualcuno corregge i doppioni**.

</Callout>

<Callout tipo="tip" titolo="Quando il dominio basta">

Il **nome di una casa** è un buon identificatore: le case sono quattro e una regola del dominio dice che restano quelle. Serve una regola che garantisca valori diversi anche domani; per i nomi delle persone non c'è.

</Callout>

---

# La matricola distingue le righe, non le persone

<Callout tipo="warning" titolo="Attenzione">

- <Esito :ok="false" /> Harry Potter registrato due volte, con due matricole → due righe valide per la stessa persona: i suoi punti si dividono e nessun vincolo se ne accorge.
- <Esito /> Prima di assegnare una matricola nuova, la segreteria controlla che lo studente non sia già registrato.

</Callout>

Un identificatore assegnato apposta garantisce che due righe non si confondano. Che la stessa persona non compaia due volte lo garantisce solo **chi registra i dati**.

---
layout: sezione
---

# Identificatori composti

A volte nessun attributo da solo distingue le occorrenze, e due attributi insieme sì.

---
layout: figura
---

# Il corso: materia e anno

::lato::

- **Materia** da sola: no, Pozioni c'è in più anni
- **Anno** da solo: no, al primo anno ci sono molte materie
- **Materia + anno**: sì, e nessuno dei due è superfluo

::figura::

<DiagrammaER
  titolo="Lo studente identificato dalla matricola, il corso da materia e anno"
  descrizione="Studente ha matricola come identificatore semplice; corso ha materia e anno come identificatore composto."
  :entita="[
    { id: 'studente', col: 0, riga: 0, attributi: [{ nome: 'matricola', identificatore: true }, 'nome', 'anno'], latoAttributi: 'sopra' },
    { id: 'corso', col: 0, riga: 1, attributi: ['materia', 'anno'], latoAttributi: 'sotto', identificatore: ['materia', 'anno'] },
  ]"
  :cella="[280, 200]"
/>

---

# Come si disegna

- **Identificatore semplice**: il cerchio pieno in fondo allo stelo di `matricola`.
- **Identificatore composto**: un segmento che attraversa gli steli di `materia` e `anno` e finisce in un cerchio pieno; i cerchi dei due attributi restano vuoti, perché nessuno dei due da solo identifica un corso.
- **Ogni entità ha il suo identificatore**: senza, una coppia di un'associazione non indicherebbe un'occorrenza precisa.

<Callout tipo="note" titolo="Nomi diversi, stessa idea">
Nel modello E/R si dice <strong>identificatore</strong>; nelle tabelle, dal capitolo 3, diventerà la <strong>chiave primaria</strong>.
</Callout>

---
layout: sintesi
---

# In sintesi

<Callout tipo="nutshell" titolo="In a nutshell">

- Un identificatore sbagliato fallisce in due modi: **rifiuta un dato vero** oppure, senza identificatore, **risponde sbagliato in silenzio**.
- Un identificatore ha un valore diverso per **ogni** occorrenza, anche futura, e nessun attributo superfluo.
- Quelli presi dal dominio vanno bene solo se una **regola del dominio** garantisce valori diversi.
- Uno assegnato apposta, come la **matricola**, distingue le righe, non le persone.
- Semplice: cerchio pieno. Composto: segmento sugli steli che finisce in un cerchio pieno.

</Callout>

---
layout: quiz
numero: 1 di 3
---

# La tabella `professore` ha come chiave il cognome. Arriva un secondo professore con un cognome già presente: che cosa succede?

<Opzione perche="Succederebbe senza chiave, come con i due James Potter nella seconda versione del registro.">Il DBMS lo registra, e le assegnazioni dei due si sommano.</Opzione>
<Opzione corretta perche="Esatto: la chiave sbagliata fa rifiutare un dato vero, nel momento in cui qualcuno prova a scriverlo.">Il DBMS rifiuta il secondo professore, anche se è una persona diversa.</Opzione>
<Opzione perche="Un `INSERT` non sostituisce una riga: se la chiave c'è già, rifiuta la nuova e lascia la vecchia.">Il DBMS sostituisce il primo professore con il secondo.</Opzione>
<Opzione perche="Il DBMS fa rispettare le regole, ma non cambia i dati di sua iniziativa.">Il DBMS aggiunge da solo un numero al cognome.</Opzione>

---
layout: quiz
numero: 2 di 3
---

# Un compagno propone come identificatore di `corso` la terna materia, anno e professore. Che cosa ne pensi?

<Opzione perche="Un identificatore non contiene attributi superflui.">Va bene: più attributi ci sono, più è sicuro.</Opzione>
<Opzione corretta perche="Esatto. E se il professore cambia, cambierebbe anche l'identificatore del corso.">Il professore è superfluo: materia e anno bastano già.</Opzione>
<Opzione perche="Piton tiene Pozioni del primo anno e Pozioni del terzo.">Basta il professore, perché insegna una materia sola.</Opzione>
<Opzione perche="Pozioni si studia in più anni: la materia da sola dà lo stesso valore a corsi diversi.">Basta la materia, perché è il nome del corso.</Opzione>

---
layout: quiz
numero: 3 di 3
---

# Per `casa` un compagno usa un numero assegnato apposta, un altro dice che il nome va benissimo. Chi ha ragione?

<Opzione perche="Falliscono quando nessuna regola garantisce valori diversi. Per le case una regola c'è.">Il primo: gli identificatori del dominio prima o poi falliscono.</Opzione>
<Opzione perche="Lo spazio non è il criterio: conta se i valori resteranno diversi, oggi e domani.">Il primo: un numero occupa meno spazio di un nome.</Opzione>
<Opzione corretta perche="Esatto. Il numero non sarebbe sbagliato, ma non serve.">Il secondo: le case sono quattro, con nomi diversi, e restano quelle.</Opzione>
<Opzione perche="Se il nome distingue già ogni casa, i colori sono superflui.">Nessuno dei due: serve nome e colori insieme.</Opzione>

---
layout: fine
---

# La prossima lezione

Ogni studente segue più corsi, e ogni corso ha più studenti: disegniamo l'associazione **molti a molti**, e cerchiamo il posto giusto per il **voto** che uno studente prende in un corso.
