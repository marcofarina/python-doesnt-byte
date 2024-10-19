# La successione di Fibonacci

## Background
Le [successioni](https://it.wikipedia.org/wiki/Successione_(matematica)) sono sequenze di numeri che seguono un certo schema. La successione di Fibonacci è una delle più famose e si basa su una semplice regola: ogni termine della successione è la somma dei due precedenti, partendo da 0 e 1. La successione inizia con 0, 1 e poi continua con 1, 2, 3, 5, 8, 13, 21, 34 e così via.

Per esempio, per calcolare il quinto termine della successione di Fibonacci, si devono sommare i due termini precedenti: 1 + 1 = 2. Il sesto termine è la somma del quarto e del quinto termine: 3 + 2 = 5. Il settimo termine è la somma del quinto e del sesto termine: 2 + 5 = 7. E così via, continuando a sommare i due termini precedenti per ottenere il successivo nella successione di Fibonacci.

L'_n_-esimo termine della [successione di Fibonacci](https://it.wikipedia.org/wiki/Successione_di_Fibonacci) è esprimibile con la seguente formula:
```tex
\begin{equation}
f_n = f_{n-1} + f_{n-2}
\end{equation}
```
_f<sub>n</sub>_ rappresenta l'ennesimo termine della successione.

### I conigli e la Mole Antonelliana
La successione di Fibonacci deve il suo nome a [Leonardo Fibonacci](https://it.wikipedia.org/wiki/Leonardo_Fibonacci), un matematico italiano del XIII secolo. Inizialmente, la successione non aveva una particolare importanza, ma diventò famosa quando Fibonacci la utilizzò per risolvere un problema legato alla riproduzione dei conigli. Il problema proposto era il seguente:

> _Se un paio di conigli si riproduce ogni mese e ogni coppia di conigli appena nati diventa fertile dopo un mese, quanti conigli ci saranno al termine di un anno?_

Fibonacci risolse brillantemente il problema utilizzando il concetto di successione matematica. Egli considerò che ogni coppia di conigli appena nati sarebbe diventata fertile il mese successivo, e quindi si sarebbe riprodotta. In questo modo, ogni mese il numero di coppie di conigli sarebbe stato la somma delle coppie di conigli presenti due mesi prima (le coppie di conigli adulte), e questo comportamento seguiva proprio la successione di Fibonacci.

![La sequenza di Fibonacci illuminata sulla Mole Antonelliana](Mole-Antonelliana-sequenza-Fibonacci.jpg)

Oggi la successione di Fibonacci è utilizzata in molti campi diversi, dalla biologia all'arte, e si può trovare anche nella decorazione della Mole Antonelliana a Torino, in cui è presente la successione di Fibonacci sotto forma di un'installazione luminosa artistica chiamata "Il volo dei numeri", a opera dell'artista Mario Merz. Questo dimostra come questa successione sia ancora oggi molto presente nella nostra cultura e nella nostra vita quotidiana.

## Descrizione del problema
Per risolvere l'esercizio è necessario utilizzare un ciclo `for` che eseguirà il calcolo della successione per un determinato numero di volte, ovvero il numero di termini che si vogliono ottenere.

- Chiedere all'utente di inserire il numero di termini della successione di Fibonacci che si vuole ottenere.
- Inizializzare due variabili, una per il primo termine _f_<sub>0</sub> = 0 e una per il secondo termine _f_<sub>1</sub> = 1.
- Utilizzare il ciclo `for` per calcolare i successivi termini della successione fino al termine desiderato.
- All'interno del ciclo `for`, assegnare alla variabile temporanea il valore della somma tra _f_<sub>0</sub> e _f_<sub>1</sub>.
- Stampare il valore della variabile temporanea.
- Assegnare alla variabile _f_<sub>0</sub> il valore di _f_<sub>1</sub> e alla variabile _f_<sub>1</sub> il valore della variabile temporanea.
- Il ciclo `for` termina quando si sono calcolati tutti i termini.