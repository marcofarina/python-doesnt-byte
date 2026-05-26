### PRE
# Codice nascosto: definisce dei valori utili
risultato_atteso = 42
### POST

a = 20
b = 22
totale = a + b
print(f"{a} + {b} = {totale}")
assert totale == risultato_atteso, "Qualcosa non torna!"
