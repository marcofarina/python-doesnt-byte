"""Helper per la verifica degli esercizi (<Challenge> attorno a un PyRunner).

Dentro un <Challenge>, il blocco `### POST` del runner non viene accodato al
codice dello studente: è la VERIFICA, eseguita a parte da brython_runner.run
solo se il codice dello studente è arrivato in fondo senza errori.

Regole per chi scrive la verifica:

- La verifica fallisce con `assert condizione, "messaggio"`. Il messaggio è
  quello che lo studente legge sotto il runner: scrivilo come un suggerimento
  mirato («Stai contando tutte le righe, non solo quelle di Grifondoro»), non
  come un errore tecnico. Un `assert` senza messaggio mostra un testo generico.
- La verifica vede le variabili dello studente (in una copia del suo
  namespace: non può modificarle). Se lo studente rinomina una variabile, un
  `assert` su quel nome solleva NameError: lo studente vede «non ancora» con
  il testo generico, mai il traceback. Dove i nomi sono liberi, controlla
  l'output con `output()`.
- I `print` della verifica non arrivano allo studente; un errore diverso da
  AssertionError finisce nella console del browser, per l'autore.
- Questi nomi sono già disponibili nella verifica, senza import, e coprono
  eventuali variabili omonime dello studente.

Helper:

    output()                -> str   tutto lo stdout dello studente, così com'è
    righe()                 -> list  le righe non vuote dello stdout, senza
                                     spazi in testa e in coda
    normalizza(testo)       -> str   minuscole, spazi consecutivi ridotti a
                                     uno, niente spazi in testa e in coda
    uguale(a, b)            -> bool  a e b coincidono dopo normalizza()
    contiene(frammento, testo=None)
                            -> bool  frammento compare in testo (default:
                                     output()), entrambi normalizzati

Esempio:

    ### POST
    assert contiene("Corvonero"), "La casa stampata non è quella giusta."
    assert len(righe()) == 1, "Stampa una riga sola, con il nome."
"""

import re

_stdout = ''


def _imposta_output(testo):
    global _stdout
    _stdout = testo


def output():
    return _stdout


def righe():
    return [r.strip() for r in _stdout.split('\n') if r.strip()]


def normalizza(testo):
    return re.sub(r'\s+', ' ', str(testo)).strip().lower()


def uguale(a, b):
    return normalizza(a) == normalizza(b)


def contiene(frammento, testo=None):
    if testo is None:
        testo = _stdout
    return normalizza(frammento) in normalizza(testo)


HELPERS = {
    'output': output,
    'righe': righe,
    'normalizza': normalizza,
    'uguale': uguale,
    'contiene': contiene,
}
