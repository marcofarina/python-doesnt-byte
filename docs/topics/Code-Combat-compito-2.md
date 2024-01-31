# Code Combat: compito 2

> Prerequisiti:
> - tutti i prerequisiti dei compiti precedenti
> - uso dell'`or`
>
{style="note"}

## Background
In questo esercizio introduciamo un secondo personaggio e qualche statistica in più per ognuno di loro.

### Statistiche del personaggio
Ogni personaggio, infatti, oltre ai punti vita avrà anche un particolare set di dadi di attacco e uno scudo, con cui si riducono i danni subiti. In particolare, il danno viene calcolato come `(valore di attacco) - (scudo)`. Punti vita e scudo vengono determinati casualmente in un certo intervallo, mentre i dadi di attacco sono predeterminati.

### Notazione dei dadi
La notazione "xdy" è una convenzione utilizzata nei giochi di ruolo per rappresentare il lancio di dadi. Nella notazione, "x" rappresenta il numero di dadi da lanciare, mentre "y" indica il tipo di dado utilizzato, cioè il numero di facce su ciascun dado. Ad esempio, "2d6" significa lanciare due dadi a sei facce ciascuno. Il risultato di ciascun dado viene sommato per ottenere il valore totale del lancio. Questo sistema offre una modalità flessibile e intuitiva per generare numeri casuali in base alla probabilità associata a ciascun dado. Nel contesto dei giochi di ruolo, questa notazione è ampiamente adottata per determinare il successo di azioni, i danni inflitti o altre situazioni in cui è necessaria una componente di casualità.

## Descrizione del problema
Il programma è diviso in tre parti principali.
1. **Fase di setup**: in questa fase vengono create tutte le variabili necessarie a contenere le statistiche dei due personaggi. Ricordate di usare nomi significativi.
   - Impostare i punti vita con un valore intero casuale tra 80 e 100;
   - impostare lo scudo con un valore intero casuale tra 5 e 10;
   - l giocatore 1 attacca con 4d6, mentre il giocatore 2 attacca con 2d12.
2. **Game loop**: in questa fase si volge l'attività principale del gioco in cui i due player si attaccano a vicenda:
   - Impostare il ciclo `while` in cui si controlla contemporaneamente che i punti vita di entrambi i player siano maggiori di zero;
   
   Poi, per ogni player:
   - calcolare il valore di attacco sommando i valori di tutti i dadi lanciati;
   - calcolare il danno da infliggere sottraendo il valore dello scudo;
   
   > Attenzione a controllare i valori ottenuti. Cosa succede ai punti vita dell'avversario se lo scudo è maggiore del danno?
   >
   {style="warning"}
    
   - sottrarre ai punti vita dell'avversario il danno calcolato;
   - ripetere questi passaggi per il secondo giocatore.

3. **Fase di output**: al termine del _game loop_ è necessario determinare quale dei due player ha vinto la sfida, stabilendo chi dei due ha i punti vita maggiori di zero. È da tenere in conto anche la possibilità che entrambi i player perdano nello stesso turno. In questo caso si tratta di un pareggio.

    - visualizzare in output quale dei due player ha vinto (o se c'è stato un pareggio) e quanti turni sono passati.
    > Dal punto di vista logico, ricorda che il player 1 vince se il player 2 è sconfitto, non se la sua vita è maggiore di zero. Rifletti su come scrivere correttamente le condizioni degli `if`.

## Esempio di output

```Bash
Player1 starting health: 95
Player1 shield: 6
Player2 starting health: 86
Player2 shield: 6

***Turn 1***
[Player1] Damage: 17 (23-6)
[Player2] Health: 69
	---
[Player2] Damage: 10 (16-6)
[Player1] Health: 85

***Turn 2***
[Player1] Damage: 10 (16-6)
[Player2] Health: 59
	---
[Player2] Damage: 10 (16-6)
[Player1] Health: 75

...

***Turn 10***
[Player1] Damage: 6 (12-6)
[Player2] Health: -1
	---
[Player2] Damage: 9 (15-6)
[Player1] Health: -7

Game ended. Turns played: 11
Draw. Both players are defeated.
```
> Per brevità la parte intermedia dell'output è stata tagliata.

## Cose da imparare
In questo secondo esercizio è necessario imparare:
- a usare un connettivo logico nel `while` per controllare più condizioni contemporaneamente;
- a usare la struttura `if-else` annidata per determinare le condizioni di vittoria;
- a usare una variabile "accumulatore" per sommare i risultati dei dadi.

## Sfide aggiuntive
1. Per far sì che il danno non sia negativo quando l'attacco è minore della difesa, al posto dell'`if` è possibile usare la funzione `max(a, b)`. Sei in grado di capire come?
2. Per sommare i valori dei dadi è possibile usare la sintassi delle _list comprehension_ e la funzione `sum()` per rendere il codice molto più compatto. Sei in grado di implementarla?
3. Sei in grado di modificare il codice affinché la battaglia venga simulata 1000 volte per stabilire qual è il giocatore che statisticamente vince di più e qual è il numero medio di turni?
   > Quando effettui questa modifica ricordati di commentare l'output delle singole partite, altrimenti l'esecuzione sarà molto lenta! Visualizza in output solo le statistiche finali.
   >
   Rispondi inoltre alle seguenti domande:
   - cosa cambia nelle statistiche se i dadi lanciati sono uguali per entrambi i player?
   - in generale, conviene lanciare xdy o (x/2)d(2*y)? Perché?
   - produci un grafico con un foglio di calcolo che mostri graficamente la differenza nel lancio dei dadi. 