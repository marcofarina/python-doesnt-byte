from browser import document, window # type: ignore
import re
import sys
import time
from config import Config # type: ignore
from py_back_trace import notify, EventOutput, print_exc # type: ignore

has_turtle_import = False
log_line_number_shift = 0

TURTLE_IMPORTS = re.compile(r'(^from turtle import)|(^import turtle)|(^from turtle3d import)|(^import turtle3d)', re.M)
TURTLE_TEMPLATE = '''from browser import document
import turtle
turtle.restart()
turtle.set_defaults(
  turtle_canvas_wrapper = document['{node_id}_graphics'],
  turtle_canvas_id = '{node_id}_svg'
) # 7 lines of code when turtle is imported - set 'log_line_number_shift' accordingly
{py_script}
turtle.done()
'''


class CapturedOutput(EventOutput):
    """Come EventOutput, ma tiene una copia di tutto ciò che passa: serve a
    `output()` nella verifica dell'esercizio."""

    def __init__(self, node_id, out_type):
        super().__init__(node_id, out_type)
        self.captured = []

    def write(self, data):
        self.captured.append(str(data))
        super().write(data)


class Silent:
    """stdout/stderr della verifica: lo studente non deve vederne i print."""
    encoding = 'utf-8'

    def write(self, data):
        pass

    def flush(self):
        pass


def verify(check, ns, student_stdout):
    """Esegue la verifica e restituisce (esito, messaggio).

    esito: 'risolto' | 'non-risolto'. messaggio: il testo dell'assert fallito,
    oppure None (il componente mostra un testo generico)."""
    import verifica # type: ignore
    verifica._imposta_output(student_stdout)
    # Una copia: la verifica legge le variabili dello studente, non le tocca.
    check_ns = dict(ns)
    check_ns.update(verifica.HELPERS)
    saved = sys.stdout, sys.stderr
    sys.stdout = sys.stderr = Silent()
    try:
        exec(check, check_ns)
    except AssertionError as exc:
        message = str(exc).strip()
        return 'non-risolto', message or None
    except Exception:
        # Lo studente non può correggere un codice che non vede: per lui è
        # «non ancora»; il traceback va in console, per l'autore.
        trace = print_exc(file=Silent())
        window.console.warn('[esercizio] la verifica è fallita con un errore:\n' + trace)
        return 'non-risolto', None
    finally:
        sys.stdout, sys.stderr = saved
    return 'risolto', None


def run(code, node_id, line_shift, check=None):
    """Esegue `code` (PRE + codice dello studente) e, se `check` non è None,
    la verifica dell'esercizio in una seconda fase.

    Con la verifica, prima di 'done' emette un bry_notify di tipo 'verifica':
    {'esito': 'risolto' | 'non-risolto' | 'errore', 'messaggio': str | None}.
    'errore' vuol dire che il codice dello studente ha sollevato un'eccezione:
    il traceback è già su stderr e la verifica non parte."""
    global has_turtle_import, log_line_number_shift
    has_turtle_import = not not TURTLE_IMPORTS.search(code)
    log_line_number_shift = (7 if has_turtle_import else 0) + line_shift
    py_script = TURTLE_TEMPLATE.format(node_id=node_id, py_script=code) if has_turtle_import else code
    student_stdout = CapturedOutput(node_id, 'stdout')
    sys.stdout = student_stdout
    sys.stderr = EventOutput(node_id, 'stderr')
    notify(node_id, {'type': 'start', 'time': time.time()})
    Config.set_id(node_id)
    ns = {'RESULT_DIV': document[Config.OUTPUT_DIV]}
    student_ok = False
    try:
        exec(py_script, ns)
        student_ok = True
    except Exception as exc:
        print_exc(file=sys.stderr, line_shift=log_line_number_shift)
    finally:
        sys.stdout.flush()
        sys.stderr.flush()
        if check is not None:
            if student_ok:
                esito, messaggio = verify(check, ns, ''.join(student_stdout.captured))
            else:
                esito, messaggio = 'errore', None
            # '' e non None: il None di Python arriva in JS come oggetto, non null.
            notify(node_id, {'type': 'verifica', 'esito': esito, 'messaggio': messaggio or ''})
        notify(node_id, {'type': 'done', 'time': time.time()})
