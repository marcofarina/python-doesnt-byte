---
# Modello di mazzo: copialo in slides/decks/<volume>/<slug>.md e riempilo.
# Le regole sono in slides/README.md («Istruzioni per l'IA»).
theme: ../../theme
title: Titolo della lezione
sottotitolo: Una o due frasi prese dalla description della lezione.
volume: archivista
capitolo: 1
numero: 2
lezione: archivista/slug-della-lezione
---

---
layout: epigrafe
autore: Autore, Opera (anno)
---

Il testo della citazione d'apertura della lezione.

---
layout: obiettivi
---

# Da dove partiamo, dove arriviamo

::prerequisiti::

- Primo prerequisito, accorciato dal :::prereq
- Secondo prerequisito

::imparerai::

- Primo obiettivo, dal :::learn
- Secondo obiettivo

---
layout: sezione
---

# Titolo del primo paragrafo (##)

Una frase che dice di che cosa parla il paragrafo.

---

# Una slide di contenuto: il titolo è una frase

Testo breve, un'idea sola. Al massimo 60 parole.

- Da tre a cinque voci
- Una o due righe ciascuna
- Il **grassetto** per i termini nuovi

<Callout tipo="warning" titolo="Titolo del callout">

Il contenuto del callout, in markdown.

</Callout>

---

# Codice che si esegue in classe

<PyRun>

```python
titoli = ["Blinding Lights", "Bohemian Rhapsody"]
for titolo in titoli:
    print(titolo)
```

</PyRun>

---
layout: domanda
---

# Prima di eseguire, prova a prevedere

<SqlRun dataset="archivista/registro-punti" database uscita="destra">

```sql
SELECT nome, casa FROM studente;
```

</SqlRun>

::risposta::

La risposta, come nello <Spoiler block> della lezione.

---
layout: figura
---

# Il titolo della figura

::figura::

<Figura id="nome-del-file-in-src-figure" />

---
layout: due-colonne
sinistra: Prima scheda
destra: Seconda scheda
---

# Un confronto

::sinistra::

Contenuto di sinistra.

::destra::

Contenuto di destra.

---
layout: definizione
titolo: Termine
---

La definizione, dal :::definition della lezione.

---
layout: enunciato
---

L'idea che la slide deve lasciare, con il **punto chiave** in grassetto.

Una nota più piccola che la spiega.

---
layout: sintesi
---

# In sintesi

<Callout tipo="nutshell" titolo="In a nutshell">

- I punti del :::nutshell della lezione

</Callout>

---
layout: quiz
numero: 1 di 3
---

# La domanda del quiz?

<Opzione perche="Perché è sbagliata, in una frase.">Una risposta sbagliata.</Opzione>
<Opzione corretta perche="Esatto: perché è giusta.">La risposta giusta.</Opzione>
<Opzione perche="Perché è sbagliata.">Un'altra risposta sbagliata.</Opzione>

---
layout: fine
---

# La prossima lezione

Due righe dal :::tip[La prossima lezione].
