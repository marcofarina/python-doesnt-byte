/**
 * Le 2048 parole dei codici dello zaino (piano pm/piano-2026-11-quaderno.md,
 * «Codice dello zaino»): quattro parole sono 44 bit.
 *
 * Base: l’elenco italiano di BIP39 (https://github.com/bitcoin/bips,
 * bip-0039/italian.txt, licenza MIT), con 435 parole difficili, rare o poco
 * adatte a ragazzi sostituite da parole concrete e comuni (Marco, 2026-11-19).
 *
 * Regole, controllate da scripts/zaino-codice.test.mjs: 2048 parole diverse,
 * solo lettere minuscole senza accenti, da 4 a 9 lettere, e prime quattro
 * lettere diverse per ogni parola, così bastano quelle per riconoscerla.
 *
 * L’elenco non si cambia più: le chiavi nascono dalle parole intere, e chi
 * scrive solo le prime quattro lettere di una parola tolta o cambiata non
 * ritroverebbe il suo zaino.
 */
export const PAROLE: readonly string[] = `
abaco abbaglio abbinato abete abisso abito abolire abrasivo accadere accenno
acciuga accusato acetone acido acqua acrilico acrobata acuto adagio addebito
addome adeguato aderire adesivo adottare aereo aeroplano affabile affetto
affranto afoso africano agave agente agevole aggancio agire agitare aglio
agnello agosto agricolo aguzzo airone alabarda alato albatro alberato
albicocca alce alettone alfa alga algebra aliante alibi alimento allagato
allegro allievo allodola alluce almeno alpaca alpino altalena alterno alto
altrove alunno alzare amaca amarena ambito ambra ambulanza america ametista
amico ammasso ammirare amore ampio ampliare amuleto anagrafe analista ananas
anatra anca ancora andare anello anfora angelo angolare angusto anice anima
annidato anno annuncio anonimo antenna anticipo anzi apatico apertura
apostrofo apparire appetito appoggio approdo appunto aprile aquila arabica
arachide aragosta arancio aratura arbitro arbusto archivio arco ardesia
ardito arena argento argine arguto aria armadio armonia arnese arpa arredato
arrivo arrosto ascensore asciutto ascolto asfalto asino asparago aspirato
aspro assaggio asse assoluto assurdo asta asteroide astice astratto astuccio
atlante atleta atomico atrio attesa attivare attorno attrito attuale austria
autista autonomo autunno avanzato avena avere avocado avvenire avviso
avvolgere azione azoto azzurro baccano bacino baco badile baffi bagaglio
bagnato baita balcone balena ballata balsamo bambino banana banco bandire
baraonda barbaro barca baritono barocco basilico basket basso bastone
batosta battuto batuffolo baule bava bazar becco beffa belgio bello belva
benda benzina bere berlina bersaglio beta betulla bevanda bianco biberon
bibita bicchiere bici bidello bidone biglietto bilancia biliardo bimbo
binario binocolo biologo biondo bipede bipolare birbante birillo biro birra
biscotto bisnonno bisonte bisturi bivacco bizzarro blatta bocca bollito
bonifico bordo borgo borraccia borsa bosco botanico bottino bozzolo braccio
bradipo brama bravura bretella brevetto brezza briglia brillante brindare
brioche broccolo brodo bruco bruno buca budino buffone bugia buio bulbo
buono burattino burlone burrasca bussola busta cabina cacao caciotta cactus
cadetto cagnolino calamaro calcolo caldo calibro calla calmo caloria calzino
camerata camicia cammino camomilla campana canapa cancello candela cane
canguro canino cannella canotto cantina canzone capace capello capitolo
capogiro cappero capra capsula caramella carbone carcassa cardo carisma
carovana carpa carretto cartolina casaccio cascata caserma caso cassone
castello casuale catasta catena catrame cauto cavallo cavetto cavolo cedrata
celebre cellulare cemento cena cenone centesimo ceramica cercare cernia
cerotto certo cervello cesoia cespo cesto cetriolo chef chiaro chicca
chiedere chimera chiodo chirurgo chitarra ciambella ciao cicala ciclismo
cicogna cielo cifrare cigno cilindro cinema cinghiale cinque cintura
ciottolo cipolla cipresso circa cittadino ciuffo civetta civile clacson
classico clinica cloro cobra cocco cocomero coda codice coerente cognome
collare colmato colore coltivato colza cometa comodo computer comune conciso
condurre conferma congelare coniuge connesso conoscere consumo continuo
convegno coperto copione coppia copricapo corazza cordata coricato cormorano
cornice corona corpo corredo corsia cortese corvo cosmico costante cotone
cottura cozza cratere cravatta creato credere cremoso crescita creta criceto
crisi critico croce cronaca crostata cruciale crusca cubetto cucchiaio
cucire cuculo cuffie cugino cullato cuoco cuoio cuore cupola curatore
curioso cursore curvo cuscino custode dado daino dalia dalmata dannoso
danzare datato dattero davanti davvero debutto decennio deciso declino
decollo decreto dedicato definito deforme degno delegare delfino delirio
delta dentro deposito derivare descritto deserto desiderio detersivo devoto
diametro diario dicembre dieci difeso diffuso digerire digitale diluvio
dinamico dinosauro dipinto diploma dire dirotto dirupo disagio discreto
disegno disfare disgelo disposto distanza disumano dito divano dividere
divorato doccia docente dodici doganale dogma dolce domato domenica dominare
dondolo dono dorato dormire dote dottore dovuto dozzina drago druido dubbio
dubitare duello duna duomo duplice duraturo duro ebano eccesso ecco eclissi
economia edera edicola edificio edile editoria educare egoismo elaborato
elastico elefante elegante elencato eletto elevare elfico elfo elica elmetto
elmo emblema emesso emotivo emozione empirico enduro energia enfasi enigma
enorme enoteca entrare epilogo episodio eppure equatore erba erboso erede
eremita erigere ermetico eroe errante esagono esame esaudire esca esempio
esercito esibito esigente esistere esito espanso espresso essenza estate
esteso estroso esultare etichetta etnico etrusco etto europa evaso evidenza
evitato evoluto evviva fabbrica faccenda faggio fagiolo fagotto falco falena
famiglia famoso fanale fango fantasma faraone fare farfalla farina farmaco
faro fascia fastoso fasullo fata faticare fato fattoria favoloso febbre fede
fegato felce felice felpa feltro fenomeno fermento ferro fertile fessura
festivo fetta fiaba ficus fiducia fieno fifa figurato filo finanza finestra
finire fiocco fionda fiore fiscale fisico fiume flacone flamenco flauto
fluente fluoro focaccia focoso foglio folata folclore folletto fondente
fontana forbici forchetta foresta formica fornaio foro fortezza forzare
fosfato fosso fracasso fragola frana frassino fratello freccetta freddo
frenata fresco frigo frisbee frittata frizzante frollino frugale frullato
frutta fucsia fulmine fumante fumetto fumoso fune fungo funzione fuoco furbo
furetto furgone furore fuso futile gabbiano gaffe galateo gallina galoppo
gambero gamma garanzia garbo garofano garzone gasdotto gasolio gatto gazebo
gazzella geco gelatina gelso gemello gemma gene genitore gennaio gentile
genziana geografia geranio gergo germoglio gesso ghepardo ghiaccio ghirlanda
ghisa giacca giaguaro giallo giardino gigante giglio gilet ginepro giocare
gioiello giorno giostra giove girato girone giudizio giugno giullare giurato
giusto glassa glicine globo glutine gnocchi gnomo gobba golf gomito gommone
gondola gonfio gonna gorilla governo gracile grado grafico grammo grande
grattare gravoso grazia greca gregge grembiule grifone grigio grillo
grissino grotta gruppo guadagno guaio guanto guardare gufo guidare guscio
hotel icona identico idolo idrico idrogeno igiene ignaro ignorato iguana
ilare illeso illogico illudere imballo imbuto immane immerso impasto impeto
impiego importo impronta inalare inattivo incanto incendio inchino incisivo
incluso incontro incrocio incubo indagine india indole inedito infatti
infilare ingegno inglese ingordo ingrosso inodore inondato insalata insetto
insieme insonnia intasato intero intonaco intuito inumidire invece invito
ipnotico ipotesi iride iris irlanda ironico irrigato isolato istituto
istrice italia jeans judo karate kayak kebab kiwi koala labbro labirinto
lacca lacrima lacuna lago lama lampo lancetta lanterna lasagna lastra latino
lattuga lavagna lavoro leccio legale leggero legno lentezza lenza leone
leopardo lepre lessato lesto letterale leva levigato lezione libero libro
lido lievito lilla lima limetta limitare limone limpido lince lineare lingua
liquido lira lirica lisca lite litigio litorale locanda lode logica lombrico
londra longevo lontra loquace lotteria lucchetto luce lucidato luglio lumaca
luminoso luna lunedi lungo lupetto lupo luppolo lusso macchina macedonia
macinato maestro maggio magico maglia magnete mago magro maiale maionese
mais malafede malgrado malinteso malto malumore mancia mandorla mangiare
manifesto manovra mansarda mantello manubrio mappa maratona marcire mare
marinaio marmo marrone marsupio martello marzo maschera materasso matita
matricola mattone maturo mazzo meccanico medaglia medesimo meditare medusa
mega mela melodia meno mensola mentina mercurio merenda merlo mese messaggio
mestolo metallo meteora metodo metro mettere miagolare mica microbo miele
migliore milano mille mimosa minatore minerale mini minore mirino mirtillo
miscela misto misurare mittente mobile mocassino modello modifica modulo
mogano moka mole molla monastero moneta monotono monsone montato mora
morbido mordere mosca mostro motivato motosega motto mouse movimento mozzo
mucca muffa mughetto mugnaio mulinello mulo multiplo mummia muovere murale
murena muscolo museo musica mutevole muto nacchere nafta narciso narice
narrato nascere naso naturale nautica nave nebbia nebulosa negativo negozio
nemmeno neon nero nervo nespola nessuno nettuno neutrale neve nicchia nido
ninfa nipote nitido nobile nocciola noce nocivo nodo nome nonno nordico
normale norvegese nostrano notare notizia notturno novella nucleo nulla
numero nuoto nuovo nutrire nuvola oasi obbedire obbligo obelisco oblio
obsoleto occasione occhio occidente occorrere occultare oceano ocra odierno
odorare offerta officina offrire oggetto oggi ognuno olandese olfatto olio
oliva ologramma oltre omaggio ombelico ombra omega omino onda ondoso onere
onnivoro onorevole operato opinione opposto oracolo orafo orca orchidea
ordine orecchino orefice orfano organico origine orizzonte orma ormeggio
orologio orrendo orribile orsetto orso ortaggio ortensia ortica orto orzo
osare oscurare ospedale ospite ossa ostacolo oste ostrica otre ottagono
ottimo ottobre ovale ovest ovunque ozio pacchetto pace pacifico padella
padrone paese paga pagina paglia pagnotta palazzina palco palestra pallido
palma palo palude pancia pandoro pane panino pannello pantera papavero pappa
paprica parabola parco parere pari parlato parola partire parziale passivo
pasticca patata patologia pattini pavone peccato pecora pedalare pedonale
peggio pellicano peloso peluche penare penisola pennello penombra pensare
pentola pepe pepita pera perbene percorso perdonato perforare pergamena
periodo permesso perno perplesso persuaso pesante pesce peso petalo pettine
pezzo piacere piadina pialla pianta piattino piazza piccino picnic picozza
piede piega pietra piffero pigiama pigna pigro pila pillola pilota pimpante
pineta pinguino pinna pinolo pinza pioggia piombo pioppo piovra piramide
piscina piselli pitone pittura piuma pixel pizzico plancton plasma platano
poderoso poesia poggiare polenta poligono pollice polpetta polso poltrona
polvere pomata pomice pomodoro pompiere poncho ponte pony popcorn popoloso
porcino poroso porpora portata posa positivo possesso postino potassio
potere pozzo pralina pranzo pratica predica prefisso pregiato prelievo
premere prenotare preparato presenza pretesto prima principe prisma privato
problema produrre profumo progetto prolunga promessa pronome proposta prova
prudente prugna prurito pubblico pugilato pugno pulce pulito pulmino
pulsante puma puntare pupazzo pupilla puro puzzle quadro qualcosa quarzo
quasi quattro quercia quota raccolto raddoppio radicale radunato rafano
raffica ragazzo ragione ragno ramarro ramino ramo rana randagio ranocchio
rapa rapina rasatura rassegna rastrello rata ravanello ravioli razzo reale
recinto recluta recupero reddito regalato registro regola relazione remare
remoto renna replica resa residente responso restauro rete retina retorica
riassunto ribadire ribelle ricarica ricco ricevere riciclato ricordo
ridicolo ridurre riflesso riforma rifugio rigare righello rilassato rilevato
rimanere rimbalzo rimedio rimorchio rinascita rincaro rinforzo rinnovo
rinomato rinuncia riparato ripetuto ripieno riportare ripresa ripulire
risata rischio riserva riso rispetto ristoro risultato risvolto ritardo
ritegno ritmico ritrovo riunione riva rivincita rivolto roba robotico
robusto roccia rodere roditore romantico rompere rondine ronzio rosa
rosolare rospo rosso rotante rotondo rovescio rubinetto rubrica rucola ruga
rugby rullino rumoroso ruolo ruota rupe ruscello ruspa russare rustico
sabato sabbia sagoma salame saldatura salivare salmone salone salsiccia
saltare saluto salvo sambuco sandalo sapere saporito sarcasmo sardina sarto
sassoso satellite satira saturno savana savio savoiardo saziato sbadiglio
sbarra sbattere sbirciare sbloccato sbocciato sbrinare sbruffone sbuffare
scabroso scacchi scadenza scaffale scala scambiare scandalo scapola scarso
scatenare scavato scelto scenico scettro scheda schiena sciarpa scienza
scimmia sciroppo scivolo scodella scoglio scolpito scomparto sconforto
scoprire scorta scossone scozzese scriba scrollare scuderia scultore scuola
scuro scusare seccatura secondo sedano sedia sega seggiola segnalato segreto
seguito selettivo sella selvaggio semaforo sembrare seme seminato sempre
senape senso sentire seppia sequenza serata sereno serio serpente servire
setola settimana sfamato sfarzoso sfaticato sfera sfida sfilato sfinge
sfocato sfoderare sfogo sforzato sfruttato sfuggito sfumare sgabello
sgarbato sgombro sgonfiare sgorbio sgrassato sguardo siccome sigla signore
silenzio sillaba silos simbolo simpatico simulato sinfonia singolo sinistro
sintesi sipario sirena sisma situato slitta smarrito smemorato smentito
smeraldo smontare snellire snodo sobbalzo sobrio soccorso sociale soffitto
sogno soldato solenne solido solo solubile somma sonda sonetto sopra sorella
sorgere sorpasso sorriso sorso sorteggio sorvolato sospiro sosta sottile
spada spaghetti spalla spargere spatola spavento spazzola specie spedire
spegnere speranza spessore spettrale spezzato spia spiedino spigoloso
spillato spinoso spirale splendido sportivo sposo sprecare spruzzo spugna
spuntino squalo squillo sradicare stabile stacco stadio staffa stagnare
stalla stampato stantio starnuto stasera statuto stazione stelo steppa
sterzo stiletto stima stivale stoffa stonato storico strappo stregato
strutto stuccare stufo stupendo succoso sudore suggerito sughero sugo
sultano suonare superbo supporto surf surgelato suricato susina sussurro
svedese sveglio svelare svenuto svezia sviluppo svista svizzera svolta
svuotare tabacco tablet tacchino taciturno tale talismano talpa tamburo
tampone tappeto tardivo targato tariffa tartaruga tasso tasto tattico
taverna tavolata taxi tazza teatro teca tecnico telefono temerario tempo
temuto tendone tenero tennis tensione tentacolo teorema terme terrazzo
terzetto tesi tesoro testato tetro tettoia tifare tifoso tigella tigre
timbro timone tipico tiro tisana titanio titolo titubante toccare tollerare
tolto tombola tomo tonfo tonno topazio topo toppa torba torcia tornare
torrone tortora toscano tossire totano tovaglia tragedia tramonto transito
trapano trasloco trattato trave treccia tremolio treno tributo tricheco
trifoglio trillo trio tristezza trivella trofeo tromba trono troppo trottola
trovare truccato tubatura tuffato tulipano tumulto tunisia tuono turbare
turchino tuta tutela tutina uccello udire uditivo uffa ufficio uguale ulivo
ultimato umano umile umorismo uncinetto undici ungere ungherese unicorno
unificato unitario universo uovo upupa uragano urgenza urlo usanza usato
uscito usignolo utensile utilizzo utopia vacante vaccinato vagabondo vagone
valanga valico valle valoroso valutare valvola vampata vangare vanitoso vano
vantaggio vapore varcato variante vasca vasetto vassoio vecchio vedetta
veduto vegetale veicolo vela velcro velina velluto veloce vendemmia venerdi
vento verace verbale verde vergogna verifica vero verticale vespa veterano
vetrina viandante vibrante vicenda vichingo vicinanza vigilia vigneto vigore
villano vimini vincitore viola vipera virgola virologo viscoso visione vispo
vissuto vita vitello vivido viziare vocabolo voce volatile volere volpe
voragine voto vulcano xilofono yogurt zaino zampogna zanna zanzara zappato
zattera zavorra zebra zecca zelante zelo zenzero zerbino zinco zitto zoccolo
zolla zucchero zufolo zuppa
`
  .trim()
  .split(/\s+/);
