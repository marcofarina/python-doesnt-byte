# Code Combat: compito 3

> Prerequisiti:
> - tutti i prerequisiti dei compiti precedenti
> - funzionamento delle liste e delle principali funzioni
>
{style="note"}

## Background
In questo esercizio introduciamo i nomi dei personaggi e un meccanismo più complesso nel calcolo dell'attacco per il quale è necessario usare le liste.

### Nomi dei personaggi
_Player1_ e _Player2_ non sono dei nomi molto significativi per i nostri personaggi. In ogni gioco di ruolo che si rispetti i personaggi devono avere dei roboanti nomi fantasy! Per rendere sempre diversi i nomi implementeremo un meccanismo di generazione casuale a partire da un insieme di nomi e di cognomi prestabiliti.

### Notazione dei dadi: risultato selettivo
La notazione "xdy" ha diverse estensioni per specificare come modificare il lancio dei dadi. In questo compito useremo il _risultato selettivo_, ovvero la selezione di un insieme di dadi da tenere e un insieme da scartare. Nel nostro caso scarteremo i dadi con il valore più alto e più basso tra quelli usciti.

Nella notazione si aggiunge la lettera _k_ per indicare i dadi che vanno tenuti (dall'inglese _keep_) e _d_ per i dadi che vanno scartati (dall'inglese _drop_). Questa lettera va in combinazione con _h_ per indicare il risultato più alto (_high_) e _l_ (_low_) per quello più basso.

Ad esempio, la notazione `4d6dh1dl1` significa "lancia 4 dadi da 6 facce e scarta il dado più alto e il dado più basso".

## Descrizione del problema
Crea un _fork_ del compito 2 e modificalo seguendo queste indicazioni.
1. **Fase di setup**
      - Genera casualmente un nome per entrambi i personaggi selezionando casualmente un valore dalla lista dei nomi e uno dalla lista dei cognomi, per entrambi i player. Puoi copiare i valori dallo snippet qui sotto;
     ```Python
      names = ["Drakar", "Lirael", "Thalas", "Eldorin", "Lyndra", "Kaelith", "Sylas", "Faelan", "Mirabelle", "Zephyr", "Isolde", "Thorn", "Elysia", "Varian", "Aeris", "Nerys", "Gwynn", "Eldira", "Soren", "Lirion"]
      surnames = ["Stoneforge", "Moonshadow", "Starwhisper", "Thunderbeard", "Fireheart", "Ravenwing", "Icebane", "Stormrider", "Swiftfoot", "Dragonflame", "Shadowcloak", "Ironhammer", "Frostbeard", "Silverleaf", "Goldenshield", "Windrider", "Hawkseye", "Deepstone", "Steelheart", "Oakenshield"]
     ```
     - memorizza in variabili separate il nome, il cognome e nome e congnome concatenati.
2. **Game loop**: in questa fase va modificata la gestione del lancio dei dadi:
   - il giocatore 1 lancia `6d6dl1dh1`, il giocatore 2 lancia `4d12dl1dh1`;
   - invece di sommare direttamente i valori estratti dei lanci di dado, aggiungili a una lista;
   - ordina la lista e rimuovi il primo e l'ultimo elemento;
   - visualizza in output una descrizione completa dei risultati ottenuti, come nell'esempio sottostante. Se il danno è aggiungi l'informazione che l'attacco è stato evitato.
   
Il resto del programma si svolge esattamente come prima. 

## Esempio di output

```Bash
Kaelith Frostbeard starting health: 98
Kaelith Frostbeard shield: 6
Gwynn Swiftfoot starting health: 82
Gwynn Swiftfoot shield: 9


[Kaelith Frostbeard] dice: [2, 2, 3, 4, 5, 6]
The lower dice (2) and the higher one (6) has been removed.
[Kaelith] Damage: 5 (14-9)
[Gwynn] Health: 77

[Gwynn Swiftfoot] dice: [2, 3, 6, 10]
The lower dice (2) and the higher one (10) has been removed.
[Gwynn] Damage: 3 (9-6)
[Kaelith] Health: 95

...

[Kaelith Frostbeard] dice: [1, 1, 2, 2, 4, 6]
The lower dice (1) and the higher one (6) has been removed.
[Kaelith] Damage: 0 (9-9). The attack has been avoided.
[Gwynn] Health: 20

[Gwynn Swiftfoot] dice: [2, 3, 10, 10]
The lower dice (2) and the higher one (10) has been removed.
[Gwynn] Damage: 7 (13-6)
[Kaelith] Health: 4

[Kaelith Frostbeard] dice: [1, 2, 2, 5, 6, 6]
The lower dice (1) and the higher one (6) has been removed.
[Kaelith] Damage: 6 (15-9)
[Gwynn] Health: 14

[Gwynn Swiftfoot] dice: [1, 5, 6, 9]
The lower dice (1) and the higher one (9) has been removed.
[Gwynn] Damage: 5 (11-6)
[Kaelith] Health: -1

Turns played: 16
Gwynn Swiftfoot wins.
```
> Per brevità la parte intermedia dell'output è stata tagliata.

## Cose da imparare
In questo secondo esercizio è necessario imparare:
- come creare una lista vuota e aggiungere elementi con la funzione `append()`;
- come ordinare una lista con la funzione `sort()`;
- come rimuovere elementi da una lista con la funzione `pop()`;
- come estrarre elementi casuali da una lista con la funzione `random.choice()`.

## Sfide aggiuntive
1. Cosa succede alla distribuzione di probabilità dei risultati quando avviene un lancio selettivo come in questo caso? Prova a fare un confronto visivo producendo un grafico comparativo con un foglio di calcolo.
2. In questo programma due grosse porzioni di codice fanno fondamentalmente la stessa cosa: gestire il lancio di dadi prima di un giocatore e poi dell'altro. Fintanto che giocatori sono due il codice è ancora gestibile, ma se i giocatori fossero _n_, come potremmo ristrutturare il codice affinché non si ripetano intere porzioni di codice, rendendolo quindi efficiente?  