---
theme: ../../theme
title: Entità e attributi
sottotitolo: Che cosa diventa un’entità e che cosa resta un attributo non è una questione di gusto, lo decidono le domande a cui il database deve rispondere.
volume: archivista
capitolo: 2
numero: 5
lezione: archivista/entita-e-attributi
---

---
layout: epigrafe
autore: G. E. P. Box, Robustness in the Strategy of Scientific Model Building (1979)
---

All models are wrong, but some are useful.

---
layout: obiettivi
---

# Da dove partiamo, dove arriviamo

::prerequisiti::

- La tabella `studente` con nome, casa e anno
- Ridondanza e anomalie di inserimento, aggiornamento e cancellazione
- Leggere un'istruzione al DBMS come una frase

::imparerai::

- Che cos'è un **modello concettuale** e il modello **E/R**
- Decidere fra **entità** e **attributo**, con le domande del database
- I due errori opposti: l'entità nascosta e l'entità inutile
- Disegnare attributi **composti** e **opzionali**; riconoscere i **derivati**

---
layout: definizione
titolo: Dominio, modello concettuale, modello E/R
---

Il **dominio** è la parte di mondo di cui un database conserva i dati: per il registro dei punti, Hogwarts.

Un **modello concettuale** stabilisce quali cose registrare, che cosa conservare di ciascuna e come sono legate, **prima delle tabelle**. Il più usato è il modello **Entità-Associazione** (_Entity-Relationship_, E/R), che si disegna in un diagramma.

---
layout: sezione
---

# Una casa che è solo un nome

McGonagall chiede di registrare anche i colori e l'animale dello stemma di ogni casa.

---

# Colori e animale dentro lo studente

L'unico posto disponibile è la tabella `studente`, con due colonne nuove. È la **prima versione**.

<StatoDb dataset="archivista/casa-attributo" tabelle="studente" :massimo="7" />

---
layout: enunciato
---

`rosso e oro` è scritto **sei volte**, una per ogni Grifondoro, e il leone altrettante.

È la ridondanza del capitolo 1: per cambiare i colori di Grifondoro bisogna correggere sei righe, e una dimenticata basta a dare alla casa due coppie di colori.

---
layout: domanda
affiancata: true
invito: Padma è l'unica di Corvonero. Quante case elenca la seconda istruzione?
---

# Cancelliamo Padma Patil

Cancella la riga di Padma; poi elenca casa, colori e animale, ogni combinazione una volta sola.

<SqlRun dataset="archivista/casa-attributo" seguito>

```sql
DELETE FROM studente
WHERE nome = 'Padma Patil';
SELECT DISTINCT casa, colori_casa,
       animale_casa
FROM studente;
```

</SqlRun>

::risposta::

**Tre**: Corvonero è sparita con Padma, insieme a blu e bronzo e all'aquila. Nella tabella `studente` una casa esiste solo finché qualcuno la nomina.

---
layout: sezione
---

# La casa come entità

Colori e animale riguardano la casa: le diamo una tabella sua.

---
layout: due-colonne
---

# La seconda versione

::sinistra::

La tabella `casa` ha nome, colori e animale. `studente` torna a nome, casa e anno: nella colonna `casa` c'è solo il nome, che rimanda a una riga di `casa`.

<StatoDb dataset="archivista/casa-entita" tabelle="casa" />

::destra::

<SqlRun dataset="archivista/casa-entita" seguito>

```sql
DELETE FROM studente
WHERE nome = 'Padma Patil';
SELECT * FROM casa;
```

</SqlRun>

Le case restano **quattro**: la riga di Padma nominava soltanto Corvonero.

---
layout: definizione
titolo: Entità e attributo
---

Un'**entità** è un insieme di oggetti del dominio con le stesse proprietà, che **esistono per conto proprio**: gli studenti, le case. Ogni singolo oggetto, come Corvonero, è un'**occorrenza** dell'entità.

Un **attributo** è una proprietà di un'entità, che per ogni occorrenza ha un valore: il nome di uno studente, i colori di una casa.

---

# Il criterio per decidere

Nella seconda versione la casa è un'**entità**; nella prima era un **attributo** dello studente. È diventata un'entità per due motivi:

<v-clicks>

- di lei interessa **qualcosa oltre al nome**: i colori, l'animale;
- **esiste anche senza** gli studenti: Corvonero resta una casa anche senza Padma.

</v-clicks>

Il criterio dipende dalle **domande** a cui il database deve rispondere, non dalla cosa in sé. Nel capitolo 1 nessuno chiedeva i colori, e la casa come testo andava bene.

---
layout: due-colonne
---

# Una classe senza metodi, e un po' di storia

::sinistra::

<Callout tipo="code" titolo="Entità e classi">

Entità e occorrenza ricordano classe e istanza, con una differenza: un'entità ha **attributi e nessun metodo**. Che cosa fare con i dati lo decidono i programmi che usano il database.

</Callout>

::destra::

<Callout tipo="history" titolo="Peter Chen, 1976">

Il modello E/R nasce con un articolo di Peter Chen, al MIT, nel primo numero di _ACM Transactions on Database Systems_: un rettangolo per ogni entità, un rombo per ogni associazione. I cerchi degli attributi arrivano dopo.

</Callout>

---
layout: sezione
---

# L'errore opposto

Il criterio non dice di fare di ogni cosa un'entità.

---
layout: due-colonne
sinistra: In questo dominio
destra: In un altro dominio
---

# L'anno di corso: un attributo

::sinistra::

Un'entità `anno` con la sola colonna `numero`, righe da 1 a 7, funziona: ma **non aggiunge nessuna informazione**.

Una tabella in più da tenere aggiornata, per un dato che cambierà solo il giorno in cui Hogwarts aprirà un ottavo anno.

::destra::

La classe di una scuola italiana, la **3A**, è un attributo finché interessa solo la sigla.

Se la scuola vuole anche l'aula e il coordinatore, la classe diventa un'entità. Nessun modello registra tutto: è il senso della frase di Box.

---

# Due segnali da riconoscere

<Callout tipo="warning" titolo="Segnali, non regole">

- <Esito :ok="false" /> `colori_casa` e `animale_casa` in `studente` → due attributi con la stessa parte di nome descrivono un'altra cosa: un'**entità nascosta**.
- <Esito :ok="false" /> un'entità `anno` con il solo `numero` → probabilmente è un **attributo** di un'altra entità.
- <Esito /> l'entità `casa` con nome, colori e animale; `studente` con nome e anno.

</Callout>

Il **direttore** di una casa non è né l'uno né l'altro: è un legame fra due entità che esistono già, casa e professore. È un'**associazione**.

---
layout: sezione
---

# Disegnare entità e attributi

Un rettangolo per l'entità, un segmento con un piccolo cerchio per ogni attributo.

---
layout: due-colonne
sinistra: Attributo composto
destra: Attributo opzionale
---

# Due decisioni prima di disegnare

::sinistra::

«Quanti Weasley ci sono a Hogwarts?» Con il nome in un solo testo bisognerebbe tagliarlo dopo lo spazio.

Il **nominativo** è formato da **nome** e **cognome**, ognuno con un significato proprio.

::destra::

Il **Patronus**: Harry evoca il suo al terzo anno, e quasi nessuno del primo ne ha uno.

Un attributo che può non avere un valore si segna **`(0,1)`**: minimo nessuno, massimo uno. Nelle tabelle, il valore che manca si chiamerà `NULL`.

---
layout: figura
---

# Lo studente e la casa, disegnati

::figura::

<DiagrammaER
  titolo="Le entità studente e casa con i loro attributi"
  descrizione="L'entità studente ha l'attributo composto nominativo, formato da nome e cognome, l'attributo anno e l'attributo opzionale patronus (0,1). L'entità casa ha gli attributi nome, colori e animale."
  :entita="[
    { id: 'studente', col: 0, riga: 0, attributi: [
      { nome: 'nominativo', componenti: ['nome', 'cognome'], lato: 'sopra' },
      { nome: 'anno', lato: 'sotto' },
      { nome: 'patronus', card: '(0,1)', lato: 'sotto' },
    ] },
    { id: 'casa', col: 1, riga: 0, attributi: ['nome', 'colori', 'animale'], latoAttributi: 'sotto' },
  ]"
  :cella="[300, 200]"
/>

---

# Che cosa manca, e perché

- La colonna `casa` **non compare** fra gli attributi di `studente`, e le due entità non sono collegate: il legame è un'**associazione**, la prossima lezione.
- Tutti i cerchi sono **vuoti**: un cerchio pieno segna l'attributo che distingue un'occorrenza dalle altre. Lo vedremo nella lezione sulle **chiavi**.

<Callout tipo="warning" titolo="Il totale dei punti non è un attributo della casa">

Si calcola dalle assegnazioni: è un attributo **derivato**. Memorizzarlo crea una seconda copia da aggiornare a ogni punto. Nei nostri diagrammi i derivati non compaiono: quando servono, si calcolano.

</Callout>

---
layout: sintesi
---

# In sintesi

<Callout tipo="nutshell" titolo="In a nutshell">

- Il **modello concettuale** decide che cosa registrare, prima delle tabelle; il modello **E/R** usa entità, attributi e associazioni.
- **Entità**: oggetti con le stesse proprietà e un'esistenza propria. **Attributo**: una proprietà con un valore per ogni occorrenza.
- È un'entità quando interessa altro oltre al nome ed esiste da sola. Decidono le domande.
- Attributi con la stessa parte di nome: entità nascosta. Entità con un solo attributo: probabilmente un attributo.
- Attributo **composto**: fatto di parti; **opzionale**: `(0,1)`; **derivato**: si calcola, non si memorizza.

</Callout>

---
layout: quiz
numero: 1 di 3
---

# «Ogni studente ha un nome e frequenta un anno, dal primo al settimo.» Un compagno disegna le entità `studente`, `nome` e `anno`. Che cosa non va?

<Opzione perche="Un sostantivo è al più un candidato: di nome e anno interessa solo il valore.">Niente: ogni sostantivo del testo è un'entità.</Opzione>
<Opzione corretta perche="Esatto: l'unica cosa con proprietà proprie è lo studente.">Nome e anno sono attributi di `studente`: di loro non interessa altro.</Opzione>
<Opzione perche="Un valore che si ripete non è un'informazione ripetuta.">`anno` va bene come entità, perché si ripete per molti studenti.</Opzione>
<Opzione perche="Una scuola sola, di cui il testo non dice niente: non registrerebbe nulla.">Manca l'entità `Hogwarts`, che contiene le altre.</Opzione>

---
layout: quiz
numero: 2 di 3
---

# Delle bacchette interessa solo il legno. Un compagno crea l'entità `bacchetta` con il solo attributo `legno`. Che cosa ne pensi?

<Opzione perche="Toccarla non la rende un'entità: decidono le domande.">Va bene: la bacchetta è un oggetto fisico.</Opzione>
<Opzione perche="Due bacchette di agrifoglio sono due fatti diversi, non una copia.">Va bene: lo stesso legno compare per più studenti.</Opzione>
<Opzione corretta perche="Esatto. Con nucleo e lunghezza, la bacchetta diventerebbe un'entità.">Il legno è un attributo dello studente: l'entità non aggiunge informazione.</Opzione>
<Opzione perche="Anche del legno interessa solo il nome.">Va invertita: `legno` entità, `bacchetta` attributo.</Opzione>

---
layout: quiz
numero: 3 di 3
---

# Un compagno vuole aggiungere a `casa` l'attributo `totale_punti`, per leggere la classifica senza calcoli. Che cosa succede?

<Opzione perche="Riguarda la casa, ma si calcola dalle assegnazioni: è una seconda copia.">Niente di male: è un'informazione sulla casa.</Opzione>
<Opzione corretta perche="Esatto: se un programma dimentica di aggiornarlo, il database si contraddice.">È un attributo derivato: crea una copia che ogni assegnazione deve aggiornare.</Opzione>
<Opzione perche="Fra un ricalcolo e l'altro, totale e assegnazioni si contraddicono.">Va bene, se si ricalcola una volta al giorno.</Opzione>
<Opzione perche="Un'entità sposta la copia, non la elimina.">Il totale dovrebbe essere un'entità collegata alla casa.</Opzione>

---
layout: fine
---

# La prossima lezione

La colonna `casa` dello studente e il direttore di ogni casa non sono proprietà: sono **legami fra due entità**. Li disegniamo con il rombo del modello E/R, e vediamo che cosa deve esprimere un'**associazione**.
