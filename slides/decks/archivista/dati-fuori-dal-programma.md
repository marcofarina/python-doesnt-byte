---
theme: ../../theme
title: I dati che non stanno più nel programma
sottotitolo: Un registro salvato in JSON conserva i dati ma non risponde a nessuna domanda. Ogni domanda nuova è codice da scrivere, e ogni risposta costa la lettura dell’intero file.
volume: archivista
capitolo: 1
numero: 2
lezione: archivista/dati-fuori-dal-programma
---

---
layout: epigrafe
autore: Albus Silente, Harry Potter e il Calice di Fuoco
---

I sometimes find, and I am sure you know the feeling, that I simply have too many thoughts and memories crammed into my mind.

---
layout: obiettivi
---

# Da dove partiamo, dove arriviamo

::prerequisiti::

- Liste, dizionari e cicli `for`
- Funzioni con parametri
- Salvare e rileggere una lista di dizionari con il modulo `json`

::imparerai::

- Distinguere dove stanno i dati da dove sta il codice che risponde
- Stimare quanto costa una domanda nuova su un archivio JSON
- Incrociare due file con un dizionario costruito apposta
- Perché, con un file, la risposta costa quanto il file

---
layout: enunciato
---

Con JSON i dati **escono dal programma** e sopravvivono al suo spegnimento.

Ora guardiamo che cosa succede quando quel file comincia a servire: qualcuno fa domande, le domande cambiano, il file cresce. Il nostro esempio è il registro dei punti delle case di Hogwarts.

---
layout: sezione
---

# Il registro delle case

Ogni volta che un professore assegna o toglie punti, il registro riceve una riga.

---
layout: due-colonne
rapporto: 1/1
---

# Una riga per ogni assegnazione

::sinistra::

```json
[
  {"studente": "Hermione Granger",
   "casa": "Grifondoro",
   "punti": -5,
   "professore": "McGonagall"},
  {"studente": "Harry Potter",
   "casa": "Grifondoro",
   "punti": 5,
   "professore": "McGonagall"},
  ...
]
```

::destra::

`punti.json` contiene le 18 assegnazioni del primo anno di Harry che ci servono.

Per rileggerlo bastano tre righe del Volume 1:

```python
import json

with open("punti.json") as f:
    registro = json.load(f)
```

---
layout: figura
---

# Il file su disco, la copia in memoria

::figura::

<Figura id="file-e-copia" />

---
layout: sezione
---

# Ogni domanda è un programma

Il file conserva i dati. Chi risponde alle domande?

---
layout: domanda
affiancata: true
invito: Quanti punti ha Grifondoro? Prova a stimarlo prima di eseguire.
---

# La domanda di McGonagall

<PyRun>

```python
import json
from archivio_hogwarts import leggi_file

registro = json.loads(leggi_file("punti.json"))

totale = 0
for assegnazione in registro:
    if assegnazione["casa"] == "Grifondoro":
        totale += assegnazione["punti"]
print(f"Grifondoro: {totale} punti")
```

</PyRun>

::risposta::

**Tre punti**. I 170 di Silente coprono quasi da soli i 150 tolti in una notte da McGonagall.

---
layout: domanda
affiancata: true
invito: Fra i Grifondoro, chi è costato più punti alla casa?
---

# Una seconda domanda, un altro programma

<PyRun seguito>

```python
import json
from archivio_hogwarts import leggi_file
registro = json.loads(leggi_file("punti.json"))

persi = {}
for a in registro:
    if a["casa"] == "Grifondoro" and a["punti"] < 0:
        nome = a["studente"]
        persi[nome] = persi.get(nome, 0) - a["punti"]

print(persi)
print("Il peggiore:", max(persi, key=persi.get))
```

</PyRun>

::risposta::

**Hermione**, con 55 punti tolti, davanti a Harry (52) e Neville (50). La differenza la fanno i cinque punti del troll.

---

# Il massimo di un dizionario

<Callout tipo="warning" titolo="Tre modi di chiederlo, uno solo giusto">

- <Esito :ok="false" /> `max(persi)` → `"Neville Longbottom"`: confronta le chiavi, è l'ultimo nome in ordine alfabetico.
- <Esito :ok="false" /> `max(persi.values())` → `55`: il valore più alto, ma non dice di chi è.
- <Esito /> `max(persi, key=persi.get)` → il nome con più punti persi.

</Callout>

---
layout: enunciato
---

Il file JSON **non risponde a nessuna domanda**: la capacità di rispondere sta tutta nel codice.

I due programmi hanno in comune solo la lettura del file; ciclo, condizione e struttura che accumula cambiano a ogni domanda. Se McGonagall chiede quale professore ha tolto più punti, la risposta arriverà quando qualcuno avrà scritto un terzo programma.

---

# Prova a essere quel qualcuno

Copia il programma precedente e fallo rispondere a: **quale professore ha tolto più punti a Grifondoro?**

<v-clicks>

- Basta cambiare una parola: `a["professore"]` al posto di `a["studente"]`.
- E l'etichetta dell'ultimo `print`, perché dica il vero.
- Risultato: **McGonagall**, 155 punti tolti contro i 22 di Piton.
- Eppure è un programma nuovo: qualcuno ha dovuto scriverlo, eseguirlo e controllarlo.

</v-clicks>

---
layout: sezione
---

# Una domanda che attraversa due file

Il registro dice di chi sono i punti, ma non in che anno è lo studente.

---
layout: due-colonne
rapporto: 2/3
---

# Due file, legati solo dal nome

::sinistra::

```json
[
  {"nome": "Harry Potter",
   "casa": "Grifondoro",
   "anno": 1},
  {"nome": "Hermione Granger",
   "casa": "Grifondoro",
   "anno": 1},
  ...
]
```

::destra::

Silente vuole i punti portati dagli studenti **di ciascun anno**.

- i punti sono in `punti.json`
- gli anni sono in `studenti.json`
- l'unico legame è il **nome** dello studente, scritto uguale in entrambi

---

# Un dizionario costruito apposta

`anno_di` porta dal nome all'anno: non sta in nessun file, esiste solo per l'incrocio.

<PyRun uscita="destra">

```python
import json
from archivio_hogwarts import leggi_file
registro = json.loads(leggi_file("punti.json"))
studenti = json.loads(leggi_file("studenti.json"))
anno_di = {}
for s in studenti:
    anno_di[s["nome"]] = s["anno"]
per_anno = {}
for a in registro:
    anno = anno_di[a["studente"]]
    per_anno[anno] = per_anno.get(anno, 0) + a["punti"]
print(per_anno)
```

</PyRun>

---
layout: figura
---

# Il ponte fra i due file

::figura::

<Figura id="anno-di-ponte" />

---

# Il legame esiste solo nel codice

```python
registro.append({"studente": "Neville Logbottom", "casa": "Grifondoro",
                 "punti": 5, "professore": "Sprout"})
```

- `KeyError`: il nome è scritto male. È il **caso fortunato**.
- Saltando i nomi sconosciuti, cinque punti sparirebbero **senza dire niente**.
- Copiare l'anno in ogni assegnazione scrive la stessa informazione **due volte**: è la prossima lezione.

---
layout: sezione
---

# Quando il registro cresce

18 assegnazioni oggi, migliaia in un anno di tutta la scuola.

---
layout: domanda
affiancata: true
invito: Quante assegnazioni legge il programma la seconda volta?
---

# Cerchiamo Neville in due registri

<PyRun seguito>

```python
import json
from archivio_hogwarts import leggi_file
def punti_di(nome, testo):
    registro = json.loads(testo)
    letti, trovati = 0, []
    for a in registro:
        letti += 1
        if a["studente"] == nome:
            trovati.append(a["punti"])
    print(f"{letti} lette: {trovati}")

nome = "Neville Longbottom"
punti_di(nome, leggi_file("punti.json"))
punti_di(nome, leggi_file("punti_tutta_la_scuola.json"))
```

</PyRun>

::risposta::

Tutte e **20.018**, per due numeri: non sa dove sono le righe di Neville.

---
layout: figura
---

# Il lavoro cresce con il file, non con la risposta

::figura::

<Figura id="legge-tutto" />

---
layout: due-colonne
sinistra: Cercare in fretta
destra: Aggiungere una riga
---

# Le vie d'uscita fatte a mano costano

::sinistra::

Un dizionario dal nome alle assegnazioni trova Neville subito: è un **indice**. Ma lo scrivi tu, uno per campo, e va rifatto a ogni modifica.

::destra::

Un file JSON è una lista chiusa da `]`: non si aggiunge in fondo.

Si **rilegge** e si **riscrive tutto**: 20.000 assegnazioni per aggiungerne una. E se due professori lo fanno insieme?

---

# Aprire in scrittura svuota il file

<Callout tipo="danger" titolo="La versione di prima è persa">

`open("punti.json", "w")` cancella il file **nel momento in cui lo apre**, prima che `json.dump` scriva qualcosa. Se il programma si interrompe a metà, per un valore che JSON non sa scrivere o per un computer che si spegne, il registro resta vuoto o troncato.

</Callout>

Per questo il file si legge tutto **prima** di aprirlo in scrittura.

---
layout: sezione
---

# Che cosa vorremmo, invece

I problemi della lezione, messi in fila, diventano una lista di richieste.

---

# Le richieste a un nuovo strumento

<v-clicks>

- Fare una domanda nuova senza scrivere un programma nuovo: dire **che cosa** vuoi sapere e lasciare ad altri il **come**.
- Collegare i dati di due archivi senza riscrivere ogni volta l'incrocio.
- Trovare due righe fra 20.000 senza leggere le altre, e aggiungerne una senza riscriverle tutte.

</v-clicks>

Il software che fa tutto questo si chiama **DBMS** (_Database Management System_), ed è l'argomento di questo volume.

<Callout tipo="history" titolo="Un database per andare sulla Luna">
IMS, uno dei primi DBMS, nasce nel 1966 per il programma Apollo: teneva la distinta dei componenti del Saturn V. IBM lo sviluppa ancora oggi.
</Callout>

---
layout: sintesi
---

# In sintesi

<Callout tipo="nutshell" titolo="In a nutshell">

- Un file JSON conserva i dati, ma non risponde: **le risposte stanno nel codice**.
- Ogni domanda nuova è un programma nuovo, spesso con una struttura diversa.
- Per incrociare due file serve un dizionario costruito apposta; il legame esiste solo nel codice.
- Per rispondere si legge l'intero file: il lavoro cresce con il file, non con la risposta.
- Un indice fatto a mano va scritto per ogni campo e rifatto a ogni modifica.
- Aggiungere un record significa rileggere e riscrivere tutto.

</Callout>

---
layout: quiz
numero: 1 di 3
---

# McGonagall vuole sapere quale professore ha tolto più punti a Grifondoro. Che cosa serve?

<Opzione perche="Il totale andrebbe calcolato e ricalcolato comunque da un programma.">Aggiungere a `punti.json` il totale di ogni professore.</Opzione>
<Opzione corretta perche="Esatto: ogni domanda non prevista diventa codice da scrivere, provare e correggere.">Un altro programma che accumula i punti tolti da ciascun professore.</Opzione>
<Opzione perche="`json.load` restituisce la lista com'è scritta: raggruppare è compito tuo.">Niente: `json.load` restituisce già i dati raggruppati.</Opzione>
<Opzione perche="Ordinato si legge meglio a occhio, ma i punti vanno comunque sommati.">Riordinare il file per professore.</Opzione>

---
layout: quiz
numero: 2 di 3
---

# Il registro della scuola ha 20.018 assegnazioni, Neville ne ha due. Quante ne legge `punti_di` per trovarle?

<Opzione perche="Il programma non sa dove stanno: per saperlo deve guardarle.">Due, quelle di Neville.</Opzione>
<Opzione perche="Non sa quante sono, quindi non sa quando ha finito.">Si ferma alla prima che trova.</Opzione>
<Opzione corretta perche="Esatto, e prima deve caricare in memoria l'intero file.">Tutte e 20.018.</Opzione>
<Opzione perche="Metà in media la legge una ricerca che si ferma al primo risultato.">Circa metà, in media.</Opzione>

---
layout: quiz
numero: 3 di 3
---

# Aggiungi al registro un'assegnazione di `"Neville Logbottom"`, scritto male. Che cosa succede nel conto per anno?

<Opzione corretta perche="Esatto: `anno_di` non ha quella chiave, e nessun file controlla i nomi.">Il programma si ferma con un `KeyError`.</Opzione>
<Opzione perche="Per il programma sono due stringhe diverse.">I punti finiscono nel primo anno, quello di Neville.</Opzione>
<Opzione perche="È JSON valido: JSON controlla la sintassi, non il significato.">`json.loads` rifiuta il registro.</Opzione>
<Opzione perche="Succederebbe solo saltando i nomi sconosciuti con un `if`.">L'assegnazione viene ignorata in silenzio.</Opzione>

---
layout: fine
---

# La prossima lezione

La casa di ogni studente è scritta due volte: in `punti.json`, a ogni assegnazione, e in `studenti.json`. Che cosa succede quando le due copie **smettono di dire la stessa cosa**?
