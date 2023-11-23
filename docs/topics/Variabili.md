# Le variabili
In questa sezione vedremo con quali strutture i programmi riescono a memorizzare i dati e di che tipo questi possono essere.

## Memoria di lavoro
Nel processo di elaborazione dei dati all'interno di un programma, il computer ha bisogno di un'area di lavoro dove memorizzare temporaneamente i dati. Per capire meglio questo meccanismo puoi immaginare il programma come se fosse uno studente che deve risolvere un esercizio di matematica in classe. Lo studente userà la lavagna come un'area di lavoro dove annotare, man mano che procede nella risoluzione dell'esercizio, tutti i passaggi e i valori intermedi dell'elaborazione della soluzione.

Analogamente, il programma affronta problemi computazionali e ha bisogno di un luogo per "memorizzare" temporaneamente i dati. Puoi immaginare queste aree di memoria virtuali come delle "scatole" all'interno delle quali si possono inserire dei valori, consentendo al programma di salvare i risultati intermedi, le informazioni di input e i dati di elaborazione. Come uno studente potrebbe annotare passaggi intermedi durante la risoluzione del problema alla lavagna, queste scatole nel programma rappresentano quei segnaposti che consentono di lavorare con i dati in modo dinamico. 

<note>
    <p>In informatica queste aree di memoria vengono chiamate **variabili**, a indicare il fatto che i valori contenuti in esse possono cambiare nel tempo.</p>
</note>

### Dare un nome alle variabili
Così come nelle nostre cantine di casa gli scatoloni vengono etichettati con dei nomi significativi per distinguerli l'uno dall'altro, indicando magari qual è il contenuto dello scatolone, così anche le variabili hanno bisogno di un identificatore che consenta ai programmatori di far loro riferimento per poter assegnare, modificare e recuperare dati durante l'esecuzione del programma.

Nella mia cantina, ad esempio, ho uno scatolone con sopra scritto a pennarello `Decorazioni Natale`. È intuitivo capire cosa c'è dentro e come distinguere la scatola delle palle dell'albero di Natale dalla scatola che contiene i miei vecchi quaderni di scuola. Se invece di scrivere sulle scatole `Decorazioni Natale`, `Quaderni scuola`, `Vestiti dismessi` avessi scritto semplicemente `X`, `Y` e `Z`, dopo qualche tempo non sarei più in grado di ricordare cosa c'è in ogni scatola.

Allo stesso modo devi avere particolare cura nel _naming_ delle variabili. I nomi devono essere sufficientemente descrittivi da non richiedere l'uso di commenti per capire lo scopo per cui la variabile è stata creata. 