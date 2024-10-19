# Principali funzioni delle liste

In questa sezione vediamo quali sono le principali funzioni che le liste mettono a disposizione e come si usano.

## Inserire nuovi elementi
È possibile inserire un nuovo elemento in coda alla lista con la funzione `append(elemento)`.

```Python
supereroi = []
supereroi.append("Batman")
supereroi.append("Iron Man")
```
<tip><p>La sintassi <code>lista = []</code> crea una lista vuota.</p></tip>

### Inserimento in una posizione specifica
Se invece di inserire un elemento al fondo della lista volessimo inserirlo in una posizione qualsiasi, si può usare la funzione `insert(indice, elemento)`.
<tabs>
    <tab title="Codice">
        <code-block lang="python">
            supereroi = ["Batman", "Ratman", "Spiderman"]
            supereroi.insert(1, "Wonder Woman")
            print(supereroi)
        </code-block>
    </tab>
    <tab title="Output">
        <code-block>
            ['Batman', 'Wonder Woman', 'Ratman', 'Spiderman']
        </code-block>
    </tab>
</tabs>

<tip><p>È possibile stampare sulla console l'intera lista semplicemente passandola come argomento alla funzione <code>print()</code></p></tip>

## Modificare un elemento

È possibile modificare un elemento di una lista usando la sintassi per accedere a un singolo elemento.

```Python
supereroi = ["Spiderman"]
supereroi[0] = "Ratman"
```

## Rimuovere un elemento
Esistono principalmente tre modi per rimuovere elementi da una lista.

### Rimuovere l'ultimo elemento
L'ultimo elemento di una lista può essere rimosso con la funzione `pop()`.
<tabs>
    <tab title="Codice">
        <code-block lang="python">
            supereroi = ["Batman", "Ratman", "Spiderman"]
            supereroi.pop()
            print(supereroi)
        </code-block>
    </tab>
    <tab title="Output">
        <code-block>
            ['Batman', 'Ratman']
        </code-block>
    </tab>
</tabs>

### Rimuovere un elemento in una posizione specifica
La funzione `pop()` può ricevere come parametro l'indice dell'elemento che si vuole rimuovere.
<tabs>
    <tab title="Codice">
        <code-block lang="python">
            supereroi = ["Batman", "Ratman", "Spiderman"]
            supereroi.pop(1)
            print(supereroi)
        </code-block>
    </tab>
    <tab title="Output">
        <code-block>
            ['Batman', 'Spiderman']
        </code-block>
    </tab>
</tabs>

<note>
    <p>
        Va ricordato che la funzione <code>pop()</code>, oltre a eliminare l'elemento, lo restituisce. Può essere utile in alcuni casi.
    </p>
    <tabs>
        <tab title="Codice">
            <code-block lang="python">
                import random
                supereroi = ["Batman", "Ratman", "Spiderman", "Iron Man"]
                indice_casuale = random.randint(0, len(supereroi) - 1)
                supereroe_scelto = supereroi.pop(indice_casuale)
                print("Supereroe estratto:", supereroe_scelto)
                print("Lista aggiornata di supereroi:", supereroi)
            </code-block>
        </tab>
        <tab title="Output">
            <code-block>
                Supereroe estratto: Ratman
                Lista aggiornata di supereroi: ['Batman', 'Spiderman', 'Iron Man']
            </code-block>
        </tab>
    </tabs>
</note>

### Rimuovere un elemento in particolare
Infine, è possibile rimuovere un elemento specifico usando la funzione `remove(elemento)`.
<tabs>
    <tab title="Codice">
        <code-block lang="python">
            supereroi = ["Batman", "Ratman", "Spiderman"]
            supereroi.remove("Batman")
            print(supereroi)
        </code-block>
    </tab>
    <tab title="Output">
        <code-block>
            ['Ratman', 'Spiderman']
        </code-block>
    </tab>
</tabs>