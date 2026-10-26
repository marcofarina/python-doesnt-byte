---
theme: ../../theme
title: Leggere un dominio e ricavarne il modello
sottotitolo: Il modello E/R si ricava da un testo con un metodo ripetibile. I sostantivi danno i candidati, i verbi le associazioni, le quantità le cardinalità, e ciò che il testo non dice diventa un’ipotesi scritta.
volume: archivista
capitolo: 2
numero: 10
lezione: archivista/leggere-un-dominio
---

---
layout: epigrafe
autore: Sherlock Holmes, Uno scandalo in Boemia (1891)
---

You see, but you do not observe.

---
layout: obiettivi
---

# Da dove partiamo, dove arriviamo

::prerequisiti::

- Entità, attributi e il criterio per decidere
- Associazioni, derivate, e cardinalità
- Identificatori semplici, composti e assegnati apposta
- Molti a molti, e quando serve un'entità

::imparerai::

- Ricavare da un testo entità, attributi e associazioni
- Tradurre le quantità in cardinalità, e scrivere le **ipotesi**
- Scrivere i **vincoli** che il diagramma non esprime
- Produrre e motivare il diagramma di un dominio nuovo

---
layout: enunciato
---

Nella realtà, e in una prova scritta, il dominio arriva **tutto insieme**, in un testo.

Chi lo legge la prima volta disegna subito i rettangoli che gli vengono in mente. Serve invece un metodo in quattro passi, ripetibile su qualunque testo.

---
layout: sezione
---

# Il testo

La biblioteca di Hogwarts vuole un database per i suoi prestiti.

---

# La richiesta della biblioteca

> La biblioteca di Hogwarts vuole un database per i suoi prestiti. Di ogni libro la bibliotecaria registra il titolo, l'anno di pubblicazione e gli autori: un libro può avere più autori, e di ogni autore interessano nome e cognome. Di molti libri la biblioteca possiede più copie, e ogni copia ha un numero d'inventario scritto sul dorso e uno stato di conservazione. Gli studenti prendono in prestito le copie: di ogni prestito si registrano la data in cui la copia esce e la data in cui rientra, che resta vuota finché la copia non torna. Uno studente può avere più copie in prestito nello stesso momento. Alcuni libri sono riservati: si prendono in prestito solo con il permesso firmato da un professore, e la biblioteca vuole sapere quale professore ha firmato ogni permesso.

---
layout: sezione
---

# Primo passo: i candidati

Ogni sostantivo è un candidato. Per ognuno: interessa altro oltre al nome? Esiste da solo?

---

# Il verdetto, candidato per candidato

| Candidato | Verdetto | Perché |
|---|---|---|
| biblioteca, database, bibliotecaria | scartati | una sola, o di loro non si chiede niente |
| libro, autore, copia | entità | hanno attributi propri ed esistono da soli |
| studente, professore | entità | sono già nel modello di Hogwarts |
| titolo, anno, nome, cognome, inventario, stato | attributi | interessa solo il valore |
| riservato | attributo di `libro` | vale sì o no |
| prestito, permesso | da decidere | li decide il secondo passo |

---
layout: due-colonne
sinistra: L'opera
destra: L'oggetto
---

# Libro e copia: la decisione più delicata

::sinistra::

«Ho letto quel **libro**»: titolo, anno, autori.

Sono gli stessi per tutte le copie: stanno in **`libro`**.

::destra::

«Ho perso il libro», o a Hogwarts «il libro mi ha morso»: numero d'inventario e stato.

Riguardano l'oggetto: stanno in **`copia`**. Un'entità sola ripeterebbe titolo e autori in ogni copia.

---
layout: sezione
---

# Secondo passo: i legami

I verbi e le frasi che mettono in relazione due candidati.

---

# Quattro decisioni sui legami

<v-clicks>

- **`scrive`** fra `autore` e `libro`: un autore più libri, un libro più autori. Molti a molti, senza attributi.
- **`esemplare`** fra `copia` e `libro`: uno a molti, ogni copia è di un libro solo.
- **Il prestito è un'entità**: Hermione può prendere la stessa copia a ottobre e a maggio, la coppia si ripete. Lo legano alla copia `riguarda`, allo studente `richiede`.
- **Il permesso è un'associazione**, `firma`: del permesso interessa solo chi l'ha firmato.

</v-clicks>

Il libro di un prestito **non** si disegna: si ricava passando dalla copia. Sarebbe un'associazione derivata.

---
layout: sezione
---

# Terzo passo: le quantità

«Ogni», «più», «alcuni», «può», «solo»: ogni parola così è un pezzo di cardinalità.

---
layout: due-colonne
sinistra: Quello che il testo dice
destra: Quello che non dice, scritto come ipotesi
---

# Cardinalità e ipotesi

::sinistra::

- «più autori» → N accanto a `libro` in `scrive`
- «ogni copia» → `(1,1)` accanto a `copia`
- «più copie in prestito» → `(0,N)` accanto a `studente`
- «alcuni libri» → `(0,1)` accanto a `prestito` in `firma`
- «resta vuota» → `rientro` opzionale, `(0,1)`

::destra::

1. Ogni libro registrato ha almeno una copia: `(1,N)`.
2. Ogni autore ha almeno un libro della biblioteca: `(1,N)`.
3. Un professore firma quanti permessi vuole, anche nessuno: `(0,N)`.

Una scelta non scritta sembra una **svista**.

---

# I vincoli che nessun rombo disegna

Alcune regole del testo non entrano in nessuna cardinalità. Si scrivono accanto al diagramma:

<Callout tipo="note" titolo="Vincoli non esprimibili">

1. Un prestito ha una firma **se e solo se** la copia è di un libro riservato.
2. Una copia ha **al massimo un prestito** con la data di rientro vuota.

</Callout>

Nel capitolo 5 vedremo che alcuni si possono far rispettare al DBMS; altri restano compito dei programmi.

---
layout: sezione
---

# Quarto passo: gli identificatori

Una regola che garantisca valori diversi, oggi e domani.

---

# Chi identifica chi

- **`copia`**: il numero d'**inventario**, assegnato dalla biblioteca e mai ripetuto.
- **`libro`**: il titolo non basta, due libri possono avere lo stesso titolo: serve un **codice**.
- **`autore`**: nome e cognome non bastano: un **codice**.
- **`prestito`**: un **id** progressivo.
- **`studente`** e **`professore`**: matricola e codice, già nel modello.

---
layout: figura
didascalia: Ipotesi 1 e 2. Il titolo non identifica un libro, il numero d'inventario identifica una copia.
---

# Il modello, prima metà: le opere e le copie

::figura::

<DiagrammaER
  titolo="Autori, libri e copie"
  descrizione="autore (codice, nome, cognome) scrive libro (codice, titolo, anno, riservato), (1,N) da tutti e due i lati. copia (inventario, stato) è esemplare di libro: (1,1) accanto a copia, (1,N) accanto a libro."
  :entita="[
    { id: 'autore', col: 0, riga: 0, attributi: [{ nome: 'codice', identificatore: true }, 'nome', 'cognome'], latoAttributi: 'sopra' },
    { id: 'libro', col: 2, riga: 0, attributi: [{ nome: 'codice', identificatore: true }, 'titolo', 'anno', 'riservato'], latoAttributi: 'sopra' },
    { id: 'copia', col: 4, riga: 0, attributi: [{ nome: 'inventario', identificatore: true }, 'stato'], latoAttributi: 'sopra' },
  ]"
  :associazioni="[
    { id: 'scrive', col: 1, riga: 0, tra: [{ entita: 'autore', card: '(1,N)' }, { entita: 'libro', card: '(1,N)' }] },
    { id: 'esemplare', col: 3, riga: 0, tra: [{ entita: 'copia', card: '(1,1)' }, { entita: 'libro', card: '(1,N)' }] },
  ]"
  :cella="[175, 170]"
/>

---
layout: figura
didascalia: Il prestito è un'entità; la firma, un'associazione facoltativa (vincoli 1 e 2 scritti a parte).
---

# Il modello, seconda metà: i prestiti

::figura::

<DiagrammaER
  titolo="Copie, prestiti, studenti e professori"
  descrizione="prestito (id, uscita, rientro opzionale) riguarda copia ((1,1) accanto a prestito, (0,N) accanto a copia), è richiesto da studente ((1,1), (0,N)) ed è firmato da professore ((0,1) accanto a prestito, (0,N) accanto a professore)."
  :entita="[
    { id: 'copia', col: 0, riga: 0, attributi: [{ nome: 'inventario', identificatore: true }, 'stato'], latoAttributi: 'sopra' },
    { id: 'prestito', col: 2, riga: 0, attributi: [{ nome: 'id', identificatore: true }, 'uscita', { nome: 'rientro', card: '(0,1)' }], latoAttributi: 'sopra' },
    { id: 'studente', col: 4, riga: 0, attributi: [{ nome: 'matricola', identificatore: true }, 'nome'], latoAttributi: 'sopra' },
    { id: 'professore', col: 2, riga: 2, attributi: [{ nome: 'codice', identificatore: true }, 'nome'], latoAttributi: 'sotto' },
  ]"
  :associazioni="[
    { id: 'riguarda', col: 1, riga: 0, tra: [{ entita: 'prestito', card: '(1,1)' }, { entita: 'copia', card: '(0,N)' }] },
    { id: 'richiede', col: 3, riga: 0, tra: [{ entita: 'prestito', card: '(1,1)' }, { entita: 'studente', card: '(0,N)' }] },
    { id: 'firma', col: 2, riga: 1, tra: [{ entita: 'prestito', card: '(0,1)' }, { entita: 'professore', card: '(0,N)' }] },
  ]"
  :cella="[175, 120]"
/>

---

# Il diagramma da solo non è il modello

Il modello completo è il diagramma **con le ipotesi e i vincoli scritti accanto**: chi lo legge deve capire ogni scelta senza chiederla.

<Callout tipo="warning" titolo="Due scorciatoie che costano care">

- <Esito :ok="false" /> un rettangolo per ogni sostantivo → `biblioteca`, `permesso`, `bibliotecaria` diventano entità che non registrano niente.
- <Esito :ok="false" /> cardinalità scelte senza scriverlo → chi legge non sa se è una decisione o una distrazione.
- <Esito /> ogni candidato con il suo verdetto, ogni scelta con la sua ipotesi.

</Callout>

---
layout: sezione
---

# Il tuo turno

La Coppa di Quidditch, con i quattro passi. Su carta.

---

# La Coppa di Quidditch

> Ogni anno a Hogwarts le quattro case si contendono la Coppa di Quidditch. Ogni casa ha una squadra di sette giocatori, tutti studenti della casa, e il database registra la squadra di quest'anno. Di ogni giocatore interessa il ruolo, e uno dei sette è il capitano della squadra. Ogni partita si gioca in una data fra due case, e il database deve registrare i punti segnati da ciascuna delle due. Ogni partita è arbitrata da un professore.

Per ogni passo: candidati con verdetto, associazioni, cardinalità, identificatori. Poi il diagramma, con ipotesi e vincoli accanto.

---

# Una soluzione possibile

<v-clicks>

- **Entità**: `casa`, `studente`, `partita`, `professore`. La squadra no: ogni casa ne ha una, e non ha niente di suo.
- **`gioca`** fra studente e casa, con l'attributo `ruolo`: `(0,1)` accanto a studente, **`(7,7)`** accanto a casa.
- **`capitano`** fra le stesse due entità, con coppie diverse: `(0,1)` e `(1,1)`.
- **`sfida`** fra partita e casa, con l'attributo `punti` della coppia: **`(2,2)`** accanto a partita.
- **`arbitra`**: ogni partita ha un professore, `(1,1)`.
- **Identificatori**: nome della casa, matricola, codice del professore, id della partita.

</v-clicks>

---
layout: fine
---

# La prossima lezione

Studenti e professori sono due entità separate, ognuna con nome e identificatore, e tutte e due si legano alle stesse cose. Nell'ultima lezione del capitolo il modello E/R raccoglie in un'entità sola ciò che hanno in comune: le **generalizzazioni**.
