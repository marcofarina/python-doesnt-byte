# Le variabili
In questa sezione vedremo con quali strutture i programmi riescono a memorizzare i dati su cui stanno lavorando e di che tipo questi possono essere.

## Memoria di lavoro
Nel processo di elaborazione dei dati all'interno di un programma, il computer ha bisogno di un'area di lavoro dove memorizzare temporaneamente i dati. Per capire meglio questo meccanismo puoi immaginare il programma come se fosse uno studente che deve risolvere un esercizio di matematica in classe. Egli userà la lavagna come un'area di lavoro dove annotare, man mano che procede nella risoluzione dell'esercizio, tutti i passaggi e i valori intermedi nell'elaborazione della soluzione.

Analogamente, il programma affronta problemi computazionali e ha bisogno di un luogo per "memorizzare" temporaneamente i dati. Puoi immaginare queste aree di memoria virtuali come delle "scatole" all'interno delle quali si possono inserire dei valori, consentendo al programma di salvare i risultati intermedi, le informazioni di input e i dati di elaborazione. Come uno studente annota i passaggi intermedi durante la risoluzione del problema alla lavagna, così il programma usa le "scatole" come dei segnaposti che consentono di lavorare con i dati in modo dinamico. <tooltip term="IDE">IDE</tooltip>

<note>
    <p>In informatica queste aree di memoria vengono chiamate <b>variabili</b> a indicare il fatto che i valori contenuti in esse possono cambiare nel tempo.</p>
</note>

### Dare un nome alle variabili
Così come nelle nostre cantine di casa gli scatoloni vengono etichettati con dei nomi significativi per distinguerli l'uno dall'altro, indicando magari qual è il contenuto dello scatolone, così anche le variabili hanno bisogno di un identificatore che consenta ai programmatori di far loro riferimento per poter assegnare, modificare e recuperare dati durante l'esecuzione del programma.

Nella mia cantina, ad esempio, ho uno scatolone con scritto in pennarello `Decorazioni Natale`. È intuitivo capire cosa c'è dentro e come distinguere la scatola delle palle dell'albero di Natale dalla scatola che contiene i miei vecchi quaderni di scuola. Se invece di scrivere sulle scatole `Decorazioni Natale`, `Quaderni scuola`, `Vestiti dismessi` avessi scritto semplicemente `X`, `Y` e `Z`, dopo qualche tempo non sarei più in grado di ricordare cosa c'è in ogni scatola.

Allo stesso modo devi avere particolare cura nel _naming_ delle variabili. I nomi devono essere sufficientemente descrittivi da non richiedere l'uso di commenti per capire lo scopo per cui la variabile è stata creata.

Prendi in considerazione i due seguenti script. È lo stesso identico programma, ma il secondo codice è molto più facile da capire del primo, anche senza l'uso di commenti.

<tabs>
    <tab title="Pessimo">
        <code-block lang="python">
        x = 5
        y = 3
        z = 8
        w = 4
        r = 2
        a = x * y
        b = a * z
        c = 0.5 * w * z
        d = 2 * 3.14 * r
        print(f"Risultato A: {a}")
        print(f"Risultato B: {b}")
        print(f"Risultato C: {c}")
        print(f"Risultato D: {d}")
        </code-block>
    </tab>
    <tab title="Ottimo">
        <code-block lang="python">
            lunghezza_rettangolo = 5
            larghezza_rettangolo = 3
            altezza_prisma = 8
            base_triangolo = 4
            raggio_cerchio = 2
            area_rettangolo = lunghezza_rettangolo * larghezza_rettangolo
            volume_prisma = area_rettangolo * altezza_prisma
            area_triangolo = 0.5 * base_triangolo * altezza_prisma
            circonferenza_cerchio = 2 * 3.14 * raggio_cerchio
            print(f"L'area del rettangolo è: {area_rettangolo}")
            print(f"Il volume del prisma è: {volume_prisma}")
            print(f"L'area del triangolo è: {area_triangolo}")
            print(f"La circonferenza del cerchio è: {circonferenza_cerchio}")
        </code-block>
    </tab>
</tabs>

### Regole sul naming
Ci sono alcune regole da seguire quando si sceglie un nome per una variabile:

- **Inizio con una lettera o underscore** `_`: il nome di una variabile deve iniziare con una lettera `(a-z, A-Z)` o un underscore `(_)`. Non è consigliato iniziare con un numero.
- **Composto da lettere, numeri e underscore**: dopo la prima lettera è possibile utilizzare lettere, numeri e underscore nel nome della variabile. Evita l'uso di caratteri speciali come `!`, `@`, `#`, `$`, `%`, ecc.
- **Evita parole riservate**: non utilizzate parole riservate del linguaggio. Ad esempio, non chiamate una variabile `print` o `if`, poiché queste sono parole chiave del linguaggio.
- **Case-sensitive**: Python è _case-sensitive_, il che significa che le variabili chiamate `mioNome` e `mionome` sono considerate diverse.

## Tipi di dato
Quando devi riporre degli oggetti, per non sprecare inutilmente spazio sceglierai scatole della dimensione adatta. Ad esempio, quando disfi l'albero di Natale, impiegherai scatole di dimensioni diverse per riporre le palline e l'albero stesso. 

Anche i linguaggi di programmazione, quando devono riservare dello spazio di memoria per le variabili, devono conoscere la quantità di spazio che verrà utilizzata. La dimensione di memoria occupata dipende dal tipo del dato in questione. Ad esempio, la memoria occupata da un carattere in una stringa sarà diversa rispetto a quella occupata da una cifra in un numero intero.

Ogni variabile è dunque _tipizzata_, ovvero ha un suo **tipo** di dato. I tipi più comuni nella programmazione sono:
- i numeri interi, chiamati per l'appunto **interi** e abbreviati con la parola chiave `int`;
- i numeri **decimali**, chiamati `float`;
- il testo, chiamato **stringa** e abbreviato `str`;
- i valori di verità, chiamato "booleani" e abbreviato con `bool`.

```Python
numero_intero = 10  # tipo int
numero_decimale = 3.14  # tipo float
testo = "hello"  # tipo str
condizione = True  # tipo bool
```

Se vuoi conoscere il tipo di una variabile, puoi usare la funzione <code>type()</code>:
<tabs>
    <tab title="Codice">
        <code-block lang="python">
            esempio1 = 10
            esempio2 = "10"
            print(type(esempio1))
            print(type(esempio2))
        </code-block>
    </tab>
    <tab title="Output">
        <code-block lang="bash">
            &lt;class 'int'&gt;
            &lt;class 'str'&gt;
        </code-block>
    </tab>
</tabs>

Conoscere il tipo di una variabile è importante perché determina le operazioni che possono essere eseguite su quella variabile. Osserva il seguente esempio:
<tabs>
    <tab title="Codice">
        <code-block lang="python">
esempio1 = 10
esempio2 = "10"
print(esempio1 * 10)
print(esempio2 * 10)
        </code-block>
    </tab>
    <tab title="Output">
        <code-block lang="bash">
100
10101010101010101010
        </code-block>
    </tab>
</tabs>

Questo esempio mostra come l'operazione di moltiplicazione abbia comportamenti diversi per un intero e una stringa. 

`print(esempio1 * 10)` moltiplica il valore di `esempio1` (che è 10) per 10. Quindi, stampa il risultato di 10 * 10, che è 100. 

`print(esempio2 * 10)`, invece, moltiplica la stringa `esempio2` (che è "10") per dieci. In Python, moltiplicare una stringa per un numero _n_ significa ripetere quella stringa _n_ volte. Quindi, stampa la stringa "10" ripetuta 10 volte.

### Tipizzazione dinamica

Python è un linguaggio a tipizzazione dinamica, il che significa principalmente due cose:
- il tipo di una variabile è determinato durante l'esecuzione del programma, basandosi sul valore assegnato a quella variabile; quando assegni un valore a una variabile, Python "guarda" il tipo di quel valore e assegna dinamicamente il tipo alla variabile;
- il tipo di una variabile può cambiare durante l'esecuzione del programma. A differenza di linguaggi a tipizzazione statica, dove il tipo di una variabile deve essere dichiarato esplicitamente e non può cambiare, Python consente ai tipi delle variabili di essere determinati dinamicamente in base al valore assegnato.