# Code Combat: compito 1

> Prerequisiti:
> - uso del modulo `random`
> - uso del ciclo `while`
>
{style="note"}

## Descrizione del problema
In questo primo compito simuleremo il ciclo di vita di un personaggio di un gioco a turni, che subisce dei danni determinati dal lancio di un dado da 6 facce. L'esecuzione termina quando il personaggio è stato sconfitto.

Il programma deve svolgere i seguenti compiti:
- definire due variabili che contengano i punti vita del personaggio (in inglese abbreviati con _hp_, _health point_) e il numero di turni trascorsi;
- impostare un ciclo `while` che termini quando la vita del personaggio diventa minore o uguale a zero;
- nel ciclo principale (in inglese _main loop_), simulare il lancio di un dado da 6 facce (in gergo 1d6) e sottrarre il danno ai punti vita del personaggio;
- incrementare la variabile contatore che memorizza il numero di turni trascorsi;
- visualizzare in output quello che è successo nel turno;
- al termine del _main loop_ visualizzare in output un messaggio che indichi che il gioco è terminato e il numero di turni trascorsi.

## Esempio di output

```Bash
Initial health points: 30

Damage taken: 3.
Remaining health is 27
Damage taken: 6.
Remaining health is 21
Damage taken: 3.
Remaining health is 18
Damage taken: 3.
Remaining health is 15
Damage taken: 4.
Remaining health is 11
Damage taken: 1.
Remaining health is 10
Damage taken: 4.
Remaining health is 6
Damage taken: 6.
Remaining health is 0

The character has been defeated.
8 turns were played.
```

## Cose da imparare
In questo esercizio è importante imparare due cose:
- a usare il ciclo `while` impostando la sua condizione. Ricorda che tutti i costrutti iterativi ciclano quando la condizione è **vera**;
- a usare una variabile "contatore" per tenere traccia di quanti turni sono trascorsi prima del termine del gioco.