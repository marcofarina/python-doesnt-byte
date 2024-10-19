# Le liste

Nei nostri ultimi esercizi abbiamo sempre simulato il lancio di dati per un numero prefissato di volte e, a ogni simulazione (ovvero in ogni iterazione del ciclo `for`), abbiamo sempre lanciato uno o due dadi al massimo, come nell'esempio di seguito.

```Python
import math
sides = int(input("How many sides? ")
dado1 = math.randind(1, sides)
dado2 = math.randint(1, sides)
```

Fin qui tutto bene, ma cosa succede se, come avviene in molti giochi di ruolo, si deve lanciare una combinazione di _n_ dadi da _m_ facce? Quante variabili di memorizzazione dei risultati dobbiamo creare? Non possiamo saperlo a priori!

Se le variabili fossero le uniche strutture dati a nostra disposizione, l'unica soluzione sarebbe quella di scegliere il numero massimo di dadi da poter lanciare contemporaneamente e creare una variabile per ognuno di questi casi... Che modo terribile di gestire il codice!

## Scatole multivalore
In tutti i linguaggi di programmazione è possibile definire delle "variabili multivalore", ovvero che possono contenere più valori. In Python questa struttura dati prende il nome di **lista**.

Una lista è una struttura dati che consente di organizzare e memorizzare una sequenza <tooltip term="ordinato">ordinata</tooltip> di elementi. Gli elementi all'interno di una lista possono essere di qualsiasi tipo, inclusi numeri, stringhe, o un mix di tipi diversi.

<note>
    <p>
        Le liste possono essere definite elencando gli elementi tra parentesi quadre <code>[]</code>, separandoli con delle virgole.
    </p>
</note>

```Python
numeri_primi = [2, 3, 5, 7, 11]
fisici_famosi = ["Albert Einstein", "Isaac Newton", "Sheldon Cooper"]
```

## Accedere agli elementi: gli indici
Una volta definita, come facciamo a distinguere un elemento dall'altro all'interno della lista? L'idea è molto semplice. Immagina la lista come il corridoio di un albergo. Come distinguiamo una stanza dall'altra? Semplice, con il numero sulla porta!

Nelle liste troviamo lo stesso meccanismo: ogni elemento è identificato da un numero, detto **indice**. In Python, come in quasi tutti i linguaggi di programmazione, gli indici delle liste partono da 0.

Per accedere a un singolo elemento di una lista si usa la stessa identica sintassi che abbiamo usato per accedere ai caratteri che compongono le stringhe: `lista[indice]`.

<tabs>
    <tab title="Codice">
        <code-block lang="python">
            fisici_famosi = ["Albert Einstein", "Isaac Newton", "Sheldon Cooper"]
            print(f"Il fisico più famoso al mondo è sicuramente {fisici_famosi[2]}.")
        </code-block>
    </tab>
    <tab title="Output">
        <code-block>
            Il fisico più famoso al mondo è sicuramente Sheldon Cooper.
        </code-block>
    </tab>
</tabs>

<warning>
    <p>
        Attenzione! Ti capiterà qualche volta di sbagliare gli indici perché noi umani, quando contiamo, di solito partiamo da 1. Nell'informatica, invece, il primo elemento è (quasi sempre) lo 0. Questo implica che, se abbiamo <i>n</i> elementi, l'ultimo avrà indice <i>n-1</i>.
    </p>
    <p>
        Se tenti di accedere a un elemento con un indice che non appartiene alla lista, Python segnalerà l'errore <code>IndexError: list index out of range</code>
    </p>
    <tabs>
    <tab title="Codice">
        <code-block lang="python">
            numeri_primi = [2, 3, 5, 7, 11]
            print(f"Il quinto numero primo è {numeri_primi[5]}.")
        </code-block>
    </tab>
    <tab title="Output">
        <code-block>
            print(f"Il quinto numero primo è {numeri_primi[5]}.")
                                      ~~~~~~~~~~~~^^^
            IndexError: list index out of range
        </code-block>
    </tab>
</tabs>
</warning>

## Scorrere una lista

L'accesso in sequenza agli elementi di una lista è reso molto semplice dalla sintassi autoesplicativa del ciclo `for`.

<tabs>
    <tab title="Codice">
        <code-block lang="python">
            fisici_famosi = ["Albert Einstein", "Isaac Newton", "Sheldon Cooper"]
            print("Elenco dei fisici famosi:")
            for fisico in fisici_famosi:
                print(f"\t- {fisico}")
        </code-block>
    </tab>
    <tab title="Output">
        <code-block>
            Elenco dei fisici famosi:
                - Albert Einstein
                - Isaac Newton
                - Sheldon Cooper
        </code-block>
    </tab>
</tabs>

Se per qualche motivo fosse necessario avere contezza dell'indice del ciclo, allora è necessario procedere diversamente.

<tabs>
    <tab title="Codice">
        <code-block lang="python">
            numeri_primi = [2, 3, 5, 7, 11]
            print("Stanze nell'albergo dei numeri primi:")
            for indice in range(len(numeri_primi)):
                print(f"\t- Stanza {indice+1}: {numeri_primi[indice]}")
        </code-block>
    </tab>
    <tab title="Output">
        <code-block>
            Stanze nell'albergo dei numeri primi:
                - Stanza 1: 2
                - Stanza 2: 3
                - Stanza 3: 5
                - Stanza 4: 7
                - Stanza 5: 11
        </code-block>
    </tab>
</tabs>

<tip>
    <p>In questo esempio abbiamo usato la funzione <code>len()</code>. Questa funzione restituisce la lunghezza della lista che gli viene passata per parametro, ovvero quanti elementi contiene.</p>
    <tabs>
        <tab title="Codice">
            <code-block lang="python">
                numeri_primi = [2, 3, 5, 7, 11]
                print(f"La lista contiene {len(numeri_primi)} elementi.")
            </code-block>
        </tab>
        <tab title="Output">
            <code-block>
                La lista contiene 5 elementi.
            </code-block>
        </tab>
    </tabs>
</tip>
