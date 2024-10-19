# Funzioni avanzate

Oltre a inserire e rimuovere i dati, ci sono molte operazioni possibili sulle liste. Vediamone alcune.

## Inizializzare una lista
Ci sono alcune situazione in cui è utile inizializzare una lista con uno specifico elemento. In Python esiste una comoda sintassi per farlo.

<tabs>
    <tab title="Codice">
        <code-block lang="python">
            zeri = [0] * 20
            print(zeri)
        </code-block>
    </tab>
    <tab title="Output">
        <code-block>
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        </code-block>
    </tab>
</tabs>

## Slicing
Lo slicing è un concetto fondamentale in Python che consente di ottenere porzioni specifiche di una <tooltip term="sequenza">sequenza</tooltip>. Attraverso lo slicing, è possibile selezionare elementi in base agli indici all'interno della sequenza, definendo un intervallo di inizio e fine.

La sintassi generale è `lista[inizio:fine]`, dove l'elemento `inizio` è incluso e l'elemento `fine` è escluso.

Se non viene specificato l'indice di inizio, il slicing parte dall'inizio della sequenza, mentre se non viene specificato l'indice di fine, il slicing continua fino alla fine della sequenza.

<tabs>
    <tab title="Codice">
        <code-block lang="python">
            star_wars = [
                "Episodio I: La minaccia fantasma",
                "Episodio II: L'attacco dei cloni",
                "Episodio III: La vendetta dei Sith",
                "Episodio IV: Una nuova speranza",
                "Episodio V: L'Impero colpisce ancora",
                "Episodio VI: Il ritorno dello Jedi",
                "Episodio VII: Il risveglio della Forza",
                "Episodio VIII: Gli ultimi Jedi",
                "Episodio IX: L'ascesa di Skywalker",
            ]
            for i in range(len(star_wars)):
                star_wars[i] = star_wars[i][9:]
            trilogia_prequel = star_wars[:3]
            trilogia_originale = star_wars[3:6]
            trilogia_sequel = star_wars[6:]
            print("Trilogia Prequel:", trilogia_prequel)
            print("Trilogia Originale:", trilogia_originale)
            print("Trilogia Sequel:", trilogia_sequel)
        </code-block>
    </tab>
    <tab title="Output">
        <code-block>
            Trilogia Prequel: ['I: La minaccia fantasma', "II: L'attacco dei cloni", 'III: La vendetta dei Sith']
            Trilogia Originale: ['IV: Una nuova speranza', "V: L'Impero colpisce ancora", 'VI: Il ritorno dello Jedi']
            Trilogia Sequel: ['VII: Il risveglio della Forza', 'VIII: Gli ultimi Jedi', "IX: L'ascesa di Skywalker"]
        </code-block>
    </tab>
</tabs>

## Cercare un elemento
Puoi verificare se un elemento è presente in una lista in diversi modi. Definiamo una lista vi villain dei fumetti Marvel:
```Python
villain_marvel = ["Thanos", "Loki", "Magneto", "Ultron", "Venom", "Hela"]
```

### Operatore `in`
Verifica se un elemento è presente nella lista usando l'operatore `in`.
```Python
villain_da_verificare = "Thanos"
if villain_da_verificare in villain_marvel:
	print(f"{villain_da_verificare} è presente nella lista.")
else:
	print(f"{villain_da_verificare} non è presente nella lista.")
```
### Funzione `index()`
La funzione `index(elemento)` restituisce l'indice della prima occorrenza dell'elemento passato per parametro, se questo esiste. Attenzione al fatto che se l'elemento non esiste, la funzione genera un errore. Può essere utile usa la funzione `index()` dentro un blocco `if` che controlla prima se l'elemento esiste.

```Python
villain_cercato = "Loki"
if villain_cercato in villain_marvel:
	indice = villain_marvel.index(villain_cercato)
	print(f"{villain_cercato} è presente nella lista all'indice {indice}.")
else:
	print(f"{villain_cercato} non è presente nella lista.")
```

### Funzione `count()`
La funzione `count(elemento)` conta quante volte un elemento compare nella lista.
```Python
villain_da_contare = "Hela"
conteggio = villain_marvel.count(villain_da_contare)
if conteggio > 0:
	print(f"{villain_da_contare} è presente nella lista {conteggio} volte.")
else:
	print(f"{villain_da_contare} non è presente nella lista.")
```