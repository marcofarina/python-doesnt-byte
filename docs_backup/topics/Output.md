# Output

<tldr>
    <p>
        La funzione per visualizzare l'output è <code>print("messaggio di testo")</code>
    </p>
</tldr>

La visualizzazione dell'output in Python è comunemente gestita attraverso l'uso della funzione `print()`. Questa funzione consente di stampare su schermo sia stringhe di testo che il valore di variabili, facilitando la comunicazione dei risultati del programma agli utenti.

La sua sintassi di base consiste nel passare gli elementi che si desidera stampare come argomenti tra parentesi tonde, separati da virgole. Questo capitolo esplorerà diverse tecniche per formattare e presentare l'output utilizzando `print()`.

```Python
# Il nostro primo output
print("Hello world!")
```
> Avrai notato la prima riga di commento nel codice qui sopra. In Python, come in tutti i linguaggi di programmazione, è possibile usare una combinazione di caratteri speciali per creare dei commenti, ovvero porzioni di codice che non verranno interpretate, ma che servo come annotazione da parte dei programmatori. In Python puoi creare dei commenti usando il simbolo `#`.

## Le stringhe
Nei linguaggi di programmazione, per poter definire un testo è necessario usare una particolare sintassi, definendo quella che viene chiamata una **stringa** di testo. Una stringa in programmazione è una sequenza di caratteri, come lettere, numeri, o simboli, racchiusa tra apici singoli (') o doppi ("). Le stringhe sono uno dei tipi di dati fondamentali in molti linguaggi di programmazione, incluso Python. Esse consentono di manipolare e rappresentare dati testuali all'interno di un programma. In questo testo, a meno che non sia necessario diversamente, useremo sempre la notazione con doppio apice.

Ecco un esempio di sintassi di una stringa in Python:

```Python
messaggio = "Un messaggio di benvenuto a tutto il mondo!"
```
Ci occuperemo a breve di capire meglio cosa significa la parte `messaggio =` di questa istruzione.

## Unire più stringhe: la concatenazione
La **concatenazione** di stringhe è una pratica comune in programmazione e consiste nell'unire due o più stringhe per formarne una più lunga. Questa operazione è utile quando si desidera costruire un messaggio o una frase combinando parti di testo. Python offre diverse modalità per eseguire la concatenazione, una delle quali è l'utilizzo dell'operatore `+`. Ecco un esempio:

<tabs>
    <tab title="Codice">
        <code-block lang="python">
            # Concatenazione di stringhe
            saluto = "Ciao"
            nome = "Mario"
            messaggio = saluto + ", " + nome + "!"
            print(messaggio)
        </code-block>
    </tab>
    <tab title="output">
        <code-block lang="bash">
            Ciao Mario!
        </code-block>
    </tab>
</tabs>

## Formatted String (f-string)

Nonostante sia ampiamente utilizzata in tutti i linguaggi di programmazione, la concatenazione di stringhe può essere scomoda da usare, soprattutto quando si devono unire tante parti.

Nella versione 3.6 di Python è stato introdotto un nuovo tipo di stringa, chiamato **f-string**, che consente di incorporare valori di variabili ed espressioni all'interno di stringhe in modo più conciso e leggibile. Le f-string sono definite anteponendo la lettera `f` prima delle virgolette di apertura della stringa.

### Sintassi

La sintassi di base di una f-string è la seguente:
```Python
f"Testo normale {espressione} altro testo"
```
Dove `{espressione}` può essere sostituito con qualsiasi espressione Python valida, comprese variabili, operazioni, chiamate di funzioni, ecc.

### Esempi
<procedure title="Inserimento di variabili nelle stringhe">
    <code-block lang="python">
        nome = "Alice"
        età = 30
        # Utilizzo di f-string per inserire variabili nelle stringhe
        messaggio = f"Ciao, mi chiamo {nome} e ho {età} anni."
        print(messaggio)
    </code-block>
</procedure>
<procedure title="Espressioni">
    <code-block lang="python">
        a = 5
        b = 3
        # Utilizzo di f-string con espressioni complesse
        risultato = f"Il risultato di {a} + {b} è {a + b}."
        print(risultato)
    </code-block>
</procedure>
<procedure title="Chiamate di funzioni">
    <code-block lang="python">
        def saluto(nome):
            return f"Ciao, {nome}!"
        persona = "Bob"
        # Utilizzo di f-string con chiamate di funzioni
        saluto_persona = f"{saluto(persona)} Come stai?"
        print(saluto_persona)
    </code-block>
    <tip>Ci occuperemo più avanti di capire cosa sono le "chiamate di funzioni".</tip>
</procedure>