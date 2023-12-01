# Le variabili
In questa sezione vedremo con quali strutture i programmi riescono a memorizzare i dati su cui stanno lavorando e di che tipo questi possono essere.

## Memoria di lavoro
Nel processo di elaborazione dei dati all'interno di un programma, il computer ha bisogno di un'area di lavoro dove memorizzare temporaneamente i dati. Per capire meglio questo meccanismo puoi immaginare il programma come se fosse uno studente che deve risolvere un esercizio di matematica in classe. Egli userà la lavagna come un'area di lavoro dove annotare, man mano che procede nella risoluzione dell'esercizio, tutti i passaggi e i valori intermedi nell'elaborazione della soluzione.

Analogamente, il programma affronta problemi computazionali e ha bisogno di un luogo per "memorizzare" temporaneamente i dati. Puoi immaginare queste aree di memoria virtuali come delle "scatole" all'interno delle quali si possono inserire dei valori, consentendo al programma di salvare i risultati intermedi, le informazioni di input e i dati di elaborazione. Come uno studente annota i passaggi intermedi durante la risoluzione del problema alla lavagna, così il programma usa le "scatole" come dei segnaposti che consentono di lavorare con i dati in modo dinamico. 

<note>
    <p>In informatica queste aree di memoria vengono chiamate <emphasis>variabili</emphasis> a indicare il fatto che i valori contenuti in esse possono cambiare nel tempo.</p>
</note>

### Dare un nome alle variabili
Così come nelle nostre cantine di casa gli scatoloni vengono etichettati con dei nomi significativi per distinguerli l'uno dall'altro, indicando magari qual è il contenuto dello scatolone, così anche le variabili hanno bisogno di un identificatore che consenta ai programmatori di far loro riferimento per poter assegnare, modificare e recuperare dati durante l'esecuzione del programma.

Nella mia cantina, ad esempio, ho uno scatolone con scritto in pennarello `Decorazioni Natale`. È intuitivo capire cosa c'è dentro e come distinguere la scatola delle palle dell'albero di Natale dalla scatola che contiene i miei vecchi quaderni di scuola. Se invece di scrivere sulle scatole `Decorazioni Natale`, `Quaderni scuola`, `Vestiti dismessi` avessi scritto semplicemente `X`, `Y` e `Z`, dopo qualche tempo non sarei più in grado di ricordare cosa c'è in ogni scatola.

Allo stesso modo devi avere particolare cura nel _naming_ delle variabili. I nomi devono essere sufficientemente descrittivi da non richiedere l'uso di commenti per capire lo scopo per cui la variabile è stata creata.

Prendi in considerazione i due seguenti script. È lo stesso identico programma, ma il secondo codice è molto più facile da capire del primo, anche senza l'uso di commenti.

<compare type="top-bottom" first-title="Pessimo naming" second-title="Ottimo naming">
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
</compare>