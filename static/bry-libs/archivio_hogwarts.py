# File finti per la lezione «I dati che non stanno più nel programma»
# (volumes/archivista/dati-fuori-dal-programma.mdx).
#
# In pagina Brython non ha un disco: leggi_file(nome) restituisce il testo che
# il file avrebbe su disco. Il contenuto di punti.json e studenti.json deve
# restare identico ai blocchi ```json mostrati nella lezione.

import json
import random

_PUNTI = """[
  {"studente": "Hermione Granger", "casa": "Grifondoro",
   "punti": -5, "professore": "McGranitt"},
  {"studente": "Harry Potter", "casa": "Grifondoro",
   "punti": 5, "professore": "McGranitt"},
  {"studente": "Ron Weasley", "casa": "Grifondoro",
   "punti": 5, "professore": "McGranitt"},
  {"studente": "Harry Potter", "casa": "Grifondoro",
   "punti": -1, "professore": "Piton"},
  {"studente": "Harry Potter", "casa": "Grifondoro",
   "punti": -1, "professore": "Piton"},
  {"studente": "Draco Malfoy", "casa": "Serpeverde",
   "punti": 10, "professore": "Piton"},
  {"studente": "Fred Weasley", "casa": "Grifondoro",
   "punti": -10, "professore": "Piton"},
  {"studente": "George Weasley", "casa": "Grifondoro",
   "punti": -10, "professore": "Piton"},
  {"studente": "Cedric Diggory", "casa": "Tassorosso",
   "punti": 10, "professore": "Sprite"},
  {"studente": "Terry Steeval", "casa": "Corvonero",
   "punti": 10, "professore": "Vitious"},
  {"studente": "Harry Potter", "casa": "Grifondoro",
   "punti": -50, "professore": "McGranitt"},
  {"studente": "Hermione Granger", "casa": "Grifondoro",
   "punti": -50, "professore": "McGranitt"},
  {"studente": "Neville Paciock", "casa": "Grifondoro",
   "punti": -50, "professore": "McGranitt"},
  {"studente": "Draco Malfoy", "casa": "Serpeverde",
   "punti": -20, "professore": "McGranitt"},
  {"studente": "Ron Weasley", "casa": "Grifondoro",
   "punti": 50, "professore": "Silente"},
  {"studente": "Hermione Granger", "casa": "Grifondoro",
   "punti": 50, "professore": "Silente"},
  {"studente": "Harry Potter", "casa": "Grifondoro",
   "punti": 60, "professore": "Silente"},
  {"studente": "Neville Paciock", "casa": "Grifondoro",
   "punti": 10, "professore": "Silente"}
]"""

_STUDENTI = """[
  {"nome": "Harry Potter", "casa": "Grifondoro", "anno": 1},
  {"nome": "Hermione Granger", "casa": "Grifondoro", "anno": 1},
  {"nome": "Ron Weasley", "casa": "Grifondoro", "anno": 1},
  {"nome": "Neville Paciock", "casa": "Grifondoro", "anno": 1},
  {"nome": "Draco Malfoy", "casa": "Serpeverde", "anno": 1},
  {"nome": "Terry Steeval", "casa": "Corvonero", "anno": 1},
  {"nome": "Fred Weasley", "casa": "Grifondoro", "anno": 3},
  {"nome": "George Weasley", "casa": "Grifondoro", "anno": 3},
  {"nome": "Cedric Diggory", "casa": "Tassorosso", "anno": 3}
]"""

_ALTRI_STUDENTI = [
    ("Hannah Abbott", "Tassorosso"),
    ("Susan Bones", "Tassorosso"),
    ("Ernie Macmillan", "Tassorosso"),
    ("Justin Finch-Fletchley", "Tassorosso"),
    ("Padma Patil", "Corvonero"),
    ("Michael Corner", "Corvonero"),
    ("Parvati Patil", "Grifondoro"),
    ("Lavanda Brown", "Grifondoro"),
    ("Seamus Finnigan", "Grifondoro"),
    ("Dean Thomas", "Grifondoro"),
    ("Katie Bell", "Grifondoro"),
    ("Angelina Johnson", "Grifondoro"),
    ("Lee Jordan", "Grifondoro"),
    ("Oliver Baston", "Grifondoro"),
    ("Marcus Flitt", "Serpeverde"),
    ("Vincent Tiger", "Serpeverde"),
    ("Gregory Goyle", "Serpeverde"),
    ("Pansy Parkinson", "Serpeverde"),
    ("Millicent Bulstrode", "Serpeverde"),
]

_PROFESSORI = ["McGranitt", "Piton", "Sprite", "Vitious", "Raptor"]


def _punti_di_tutta_la_scuola():
    # Le 18 assegnazioni di punti.json più 20 000 di altri studenti, mescolate.
    # Il seme fisso rende il file identico a ogni esecuzione.
    random.seed(1991)
    registro = json.loads(_PUNTI)
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
    if nome == "punti.json":
        return _PUNTI
    if nome == "studenti.json":
        return _STUDENTI
    if nome == "punti_tutta_la_scuola.json":
        return _punti_di_tutta_la_scuola()
    raise FileNotFoundError(f"Nessun file chiamato '{nome}'")
