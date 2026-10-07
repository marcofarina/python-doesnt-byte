# File dell'archivio di Hogwarts per le lezioni del Volume 3 (la prima è
# volumes/archivista/dati-fuori-dal-programma.mdx).
#
# In pagina Brython non ha un disco: leggi_file(nome) restituisce il testo del
# file con lo stesso nome in static/archivio/hogwarts/, scaricato con una
# richiesta sincrona. È la fonte unica: la stessa cartella la legge il plugin
# plugins/archivio/ per mostrare i file nelle lezioni (<FileArchivio>).
#
# L'indirizzo della cartella si ricava da __file__, che Brython imposta all'URL
# di questo modulo (…/bry-libs/archivio_hogwarts.py): così il baseUrl del sito
# non è scritto qui.
#
# punti_tutta_la_scuola.json non è su disco: lo genera questo modulo partendo
# da punti.json.

import json
import random

from browser import window

_CARTELLA = __file__.rsplit("/", 2)[0] + "/archivio/hogwarts/"


def _scarica(nome):
    richiesta = window.XMLHttpRequest.new()
    richiesta.open("GET", _CARTELLA + nome, False)
    richiesta.send()
    # Il dev server risponde 200 con la pagina HTML del sito anche ai file che
    # non esistono: conta solo una risposta JSON.
    tipo = richiesta.getResponseHeader("Content-Type") or ""
    if richiesta.status != 200 or not tipo.startswith("application/json"):
        raise FileNotFoundError(f"Nessun file chiamato '{nome}'")
    return richiesta.responseText


_ALTRI_STUDENTI = [
    ("Hannah Abbott", "Tassofrasso"),
    ("Susan Bones", "Tassofrasso"),
    ("Ernie Macmillan", "Tassofrasso"),
    ("Justin Finch-Fletchley", "Tassofrasso"),
    ("Cho Chang", "Corvonero"),
    ("Michael Corner", "Corvonero"),
    ("Parvati Patil", "Grifondoro"),
    ("Seamus Finnigan", "Grifondoro"),
    ("Dean Thomas", "Grifondoro"),
    ("Katie Bell", "Grifondoro"),
    ("Angelina Johnson", "Grifondoro"),
    ("Lee Jordan", "Grifondoro"),
    ("Oliver Wood", "Grifondoro"),
    ("Marcus Flint", "Serpeverde"),
    ("Gregory Goyle", "Serpeverde"),
    ("Pansy Parkinson", "Serpeverde"),
    ("Millicent Bulstrode", "Serpeverde"),
]

_PROFESSORI = ["McGonagall", "Piton", "Sprout", "Flitwick"]


def _punti_di_tutta_la_scuola():
    # Le 18 assegnazioni di punti.json più 20 000 di altri studenti, mescolate.
    # Il seme fisso rende il file identico a ogni esecuzione.
    random.seed(1991)
    registro = json.loads(_scarica("punti.json"))
    for _ in range(20000):
        studente, casa = random.choice(_ALTRI_STUDENTI)
        registro.append({
            "studente": studente,
            "casa": casa,
            "punti": random.choice([-10, -5, -1, 1, 5, 10]),
            "professore": random.choice(_PROFESSORI),
        })
    random.shuffle(registro)
    return json.dumps(registro)


def leggi_file(nome):
    if nome == "punti_tutta_la_scuola.json":
        return _punti_di_tutta_la_scuola()
    return _scarica(nome)
