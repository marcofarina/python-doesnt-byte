---
theme: ../../theme
title: La stessa informazione scritta due volte
sottotitolo: Quando un dato è scritto in due posti, prima o poi le due copie si contraddicono e niente dice quale sia vera. Insieme, le tre anomalie di una riga che parla di cose diverse.
volume: archivista
capitolo: 1
numero: 3
lezione: archivista/stessa-informazione-due-volte
---

---
layout: epigrafe
autore: Legge di Segal (1961)
---

A man with a watch knows what time it is. A man with two watches is never sure.

---
layout: obiettivi
---

# Da dove partiamo, dove arriviamo

::prerequisiti::

- Liste, dizionari e cicli `for`
- Leggere una lista di dizionari da un file JSON
- `punti.json`, `studenti.json` e l'incrocio fra i due con un dizionario

::imparerai::

- Perché due copie dello stesso dato finiscono per dire cose diverse
- Scrivere un controllo che trova le copie in disaccordo, e i suoi limiti
- Distinguere un valore ripetuto da un'informazione ripetuta
- Le anomalie di **inserimento**, **aggiornamento** e **cancellazione**

---
layout: enunciato
---

Il registro ripete in ogni assegnazione la **casa** dello studente, che sta già in `studenti.json`.

È comodo: il totale di Grifondoro si calcola senza aprire l'altro file. In questa lezione vediamo il costo nascosto di questa comodità.

---
layout: sezione
---

# Due conteggi, due classifiche

Un'assegnazione nuova, con la casa di Neville scritta sbagliata.

---
layout: due-colonne
centro: true
---

# Cinque punti a Neville, in Tassofrasso

::sinistra::

```json
{
  "studente": "Neville Longbottom",
  "casa": "Tassofrasso",
  "punti": 5,
  "professore": "Sprout"
}
```

::destra::

La professoressa Sprout dà cinque punti a Neville. Nella riga, al posto di Grifondoro, è finito **Tassofrasso**.

Contiamo i punti delle case in due modi: con la casa scritta nel registro, e con la casa presa da `studenti.json`.

---
layout: domanda
affiancata: true
invito: Quanti punti ha Grifondoro secondo ciascun conteggio?
---

# Due modi di contare

<PyRun seguito>

```python
import json
from archivio_hogwarts import leggi_file
registro = json.loads(leggi_file("punti.json"))
registro.append({"studente": "Neville Longbottom",
    "casa": "Tassofrasso", "punti": 5, "professore": "Sprout"})
casa_di = {}
for s in json.loads(leggi_file("studenti.json")):
    casa_di[s["nome"]] = s["casa"]
dal_registro, da_studenti = {}, {}
for a in registro:
    c1, c2 = a["casa"], casa_di[a["studente"]]
    dal_registro[c1] = dal_registro.get(c1, 0) + a["punti"]
    da_studenti[c2] = da_studenti.get(c2, 0) + a["punti"]
print(dal_registro["Grifondoro"], da_studenti["Grifondoro"])
```

</PyRun>

::risposta::

**3** secondo il registro, **8** secondo `studenti.json`. I cinque punti di Neville finiscono in due case diverse.

---
layout: enunciato
---

Nessuno dei due conteggi è sbagliato: **sono i dati a contraddirsi**.

Noi sappiamo che Neville è un Grifondoro perché conosciamo la storia. Il programma ha due file in disaccordo e nessun criterio per scegliere. Con 20.000 assegnazioni di studenti sconosciuti, saremmo nella sua stessa posizione.

---
layout: definizione
titolo: Ridondanza
---

Un'informazione scritta in più posti si chiama **ridondanza**. La casa nel registro è una copia: un'informazione sullo studente, che ha già il suo posto in `studenti.json`.

Il difetto più evidente è lo spazio occupato, ma non il più grave: la prima volta che le copie non coincidono, l'archivio ha **due risposte diverse alla stessa domanda**.

---

# Il disaccordo, almeno, si trova

<PyRun uscita="destra">

```python
import json
from archivio_hogwarts import leggi_file
registro = json.loads(leggi_file("punti.json"))
studenti = json.loads(leggi_file("studenti.json"))
registro.append({"studente": "Neville Longbottom",
    "casa": "Tassofrasso", "punti": 5, "professore": "Sprout"})
casa_di = {}
for s in studenti:
    casa_di[s["nome"]] = s["casa"]
for a in registro:
    nome = a["studente"]
    if a["casa"] != casa_di[nome]:
        print(f"{nome}: {a['casa']} contro {casa_di[nome]}")
```

</PyRun>

Il controllo trova Neville, ma **non sa quale casa è giusta**, e va rilanciato dopo ogni modifica.

---

# Virgolette dentro una f-string

<Callout tipo="warning" titolo="Apici singoli, per sicurezza">

- <Esito :ok="false" /> `f"{a["casa"]}"` → `SyntaxError` fino a Python 3.11.
- <Esito /> `f"{a['casa']}"` → funziona in ogni versione.

</Callout>

Nei blocchi del libro funzionano tutte e due, perché il motore segue Python 3.12; nell'editor della scuola potresti avere una versione più vecchia.

---
layout: sezione
---

# Copie che invecchiano

Una copia può diventare falsa anche se nessuno sbaglia l'inserimento.

---
layout: due-colonne
---

# La scorciatoia dell'anno copiato

::sinistra::

```json
{
  "studente": "Neville Longbottom",
  "casa": "Grifondoro",
  "anno": 1,
  "punti": -50,
  "professore": "McGonagall"
}
```

::destra::

Copiamo l'anno in ogni assegnazione, per contare i punti per anno senza incrocio.

Per un anno scolastico funziona. Poi arriva il **1° settembre**: ogni studente passa all'anno successivo, e `studenti.json` va aggiornato.

---

# Il 1° settembre, due cicli invece di uno

```python
def nuovo_anno(studenti, registro):
    for studente in studenti:
        studente["anno"] += 1
    for assegnazione in registro:    # esiste solo per la copia
        assegnazione["anno"] += 1
```

- Il primo ciclo aggiorna **nove** righe, una per studente.
- Il secondo ne aggiorna più di **20.000**, e ogni anno di più.
- Se si dimentica il registro, o il programma si ferma fra i due cicli, i file danno due classifiche diverse. Ogni copia **era vera** quando è stata scritta.

---
layout: figura
---

# Le copie invecchiano con l'originale

::figura::

<Figura id="copie-che-invecchiano" />

---
layout: due-colonne
---

# Copie fatte apposta, valori solo uguali

::sinistra::

<Callout tipo="info" titolo="La cache">

Una copia tenuta apposta per rispondere in fretta è una **cache**. La casa nel registro è una cache improvvisata. Phil Karlton: in informatica ci sono due cose difficili, **invalidare la cache** e dare i nomi alle cose.

</Callout>

::destra::

<Callout tipo="note" titolo="Un valore ripetuto non è sempre una copia">

L'anno **in cui** Neville ha perso 50 punti riguarda l'assegnazione, e il 1° settembre non deve cambiare. Oggi vale 1 come l'anno attuale; da settembre no. Il significato lo decide chi progetta l'archivio.

</Callout>

---
layout: quiz
numero: 1 di 2
---

# Quale campo di un'assegnazione è una copia di un'informazione che appartiene a qualcos'altro?

<Opzione perche="Il nome è il collegamento: dice a chi sono andati i punti.">`"studente"`</Opzione>
<Opzione corretta perche="Esatto: la casa riguarda lo studente e sta già in `studenti.json`.">`"casa"`</Opzione>
<Opzione perche="I punti esistono solo lì: due assegnazioni da cinque sono due fatti.">`"punti"`</Opzione>
<Opzione perche="Anche il professore è un collegamento: dice chi ha assegnato i punti.">`"professore"`</Opzione>

---
layout: sezione
---

# Una riga, tre fatti

Un difetto meno visibile, che riguarda i professori.

---

# Che cosa registra una riga

Flitwick dà dieci punti a Padma Patil, di Corvonero.

| Che cosa registra la riga | Di chi è | Dove altro è scritta |
|---|---|---|
| Padma ha ricevuto 10 punti da Flitwick | dell'assegnazione | da nessuna parte |
| Padma è di Corvonero | di Padma | in `studenti.json` |
| Flitwick insegna a Hogwarts | di Flitwick | da nessuna parte |

Nessun file elenca i professori: per l'archivio un professore esiste solo se compare in un'assegnazione.

---
layout: domanda
affiancata: true
invito: Annulliamo l'assegnazione di Padma, la decima. Che cosa cambia nel secondo elenco?
---

# L'elenco dei professori, prima e dopo

<PyRun seguito>

```python
import json
from archivio_hogwarts import leggi_file
registro = json.loads(leggi_file("punti.json"))

def professori(registro):
    elenco = []
    for a in registro:
        if a["professore"] not in elenco:
            elenco.append(a["professore"])
    return elenco

print(professori(registro))
del registro[9]
print(professori(registro))
```

</PyRun>

::risposta::

**Manca Flitwick**. Annullare l'assegnazione doveva cancellare un fatto solo, e ne ha cancellato un altro: Flitwick era scritto soltanto lì.

---

# E un professore appena arrivato?

Lupin comincia a insegnare due anni dopo. Finché non assegna punti, l'archivio **non sa che esiste**. Per registrarlo subito servirebbe una riga finta:

```json
{ "studente": "", "casa": "", "punti": 0, "professore": "Lupin" }
```

- Chi conta le assegnazioni ne trova una in più, senza avviso.
- Il calcolo dei punti per anno si ferma con un `KeyError`: in `anno_di` non c'è uno studente senza nome.

---
layout: definizione
titolo: Le tre anomalie
---

- **Aggiornamento**: un'informazione scritta in più posti va cambiata in tutti, o l'archivio si contraddice. L'anno copiato nel registro.
- **Inserimento**: un'informazione non si registra finché non c'è un'altra cosa a cui appoggiarla. Lupin.
- **Cancellazione**: eliminare un dato ne elimina altri scritti nella stessa riga. Flitwick.

La causa comune: **una riga che parla di cose diverse**.

---
layout: sezione
---

# Un fatto, un posto

Scrivere ogni informazione una volta sola, nel posto che le appartiene.

---
layout: due-colonne
sinistra: Il rimedio
destra: Il prezzo
---

# Tre file, ognuno con i suoi fatti

::sinistra::

Casa e anno in `studenti.json`, i professori in `professori.json`, e nel registro solo l'assegnazione:

```json
{ "studente": "Padma Patil",
  "punti": 10,
  "professore": "Flitwick" }
```

Niente copie che si contraddicono: Flitwick resta, Lupin entra il giorno in cui arriva.

::destra::

Anche il totale di Grifondoro richiede un **incrocio** scritto a mano, e quasi ogni domanda ne chiede uno.

E il legame resta affidato al codice: niente impedisce un professore che non esiste o un «Logbottom». Abbiamo scambiato dati che si contraddicono con dati che **puntano a nessuno**.

---
layout: enunciato
---

Con i file si sceglie fra **copie da tenere allineate** e **incroci da scrivere**.

Un DBMS tiene ogni informazione al suo posto, ti lascia chiedere un incrocio invece di programmarlo e rifiuta un nome che non compare nell'elenco a cui deve riferirsi.

---
layout: sintesi
---

# In sintesi

<Callout tipo="nutshell" titolo="In a nutshell">

- Una copia di un'informazione che ha già un suo posto è una **ridondanza**.
- Quando due copie divergono, niente nei dati dice quale sia vera.
- Un controllo di coerenza trova i disaccordi, ma non sa correggerli e va rilanciato.
- Una copia diventa falsa anche senza errori, quando cambia l'originale.
- Un valore ripetuto non è sempre una copia: conta il significato.
- Una riga che parla di cose diverse produce le anomalie di inserimento, aggiornamento e cancellazione.
- Rimedio: ogni informazione una volta, al suo posto. Prezzo: gli incroci.

</Callout>

---
layout: quiz
numero: 2 di 2
---

# In `prestiti.json` ogni prestito riporta studente, titolo, autore e data. Un libro prestato una volta sola perde il suo prestito: che cosa perde l'archivio?

<Opzione perche="Sullo scaffale sì, ma l'archivio non lo sa più.">Solo il prestito: il libro resta sullo scaffale.</Opzione>
<Opzione corretta perche="Esatto: è un'anomalia di cancellazione, come Flitwick.">Anche il fatto che la biblioteca possieda quel libro, e chi l'ha scritto.</Opzione>
<Opzione perche="Il titolo di questo libro non sta da nessun'altra parte.">Niente: l'autore compare negli altri prestiti.</Opzione>
<Opzione perche="Una riga in meno lascia il JSON valido.">Il file non è più JSON valido.</Opzione>

---
layout: fine
---

# La prossima lezione

Un DBMS che tiene ogni informazione al suo posto, fa gli incroci al posto tuo e **rifiuta** i dati che non rispettano le regole: vediamo che cosa fa un DBMS al posto del nostro codice.
