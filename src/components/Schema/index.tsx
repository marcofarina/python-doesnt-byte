import { Fragment, type ReactNode } from 'react';
import styles from './styles.module.css';

interface SchemaProps {
  /**
   * Schema di una relazione: `nome(attr, attr, ...)`.
   * `[x]` = parte della chiave primaria (sottolineato),
   * `{x}` = chiave esterna (corsivo), `[{x}]` = entrambe.
   */
  def: string;
}

const ATTR = /^(\[)?(\{)?([^\]}]+)(\})?(\])?$/;

function attributo(testo: string): ReactNode {
  const m = testo.trim().match(ATTR);
  if (!m) throw new Error(`[Schema] attributo non valido: «${testo}»`);
  const [, pk, fkA, nome, fkC, pkC] = m;
  if (!!pk !== !!pkC || !!fkA !== !!fkC) {
    throw new Error(`[Schema] parentesi non chiuse: «${testo}»`);
  }
  const cls = [pk ? styles.pk : '', fkA ? styles.fk : '']
    .filter(Boolean)
    .join(' ');
  return <span className={cls || undefined}>{nome}</span>;
}

/**
 * Schema logico di una relazione, nel tratto di Excalifont dei diagrammi E/R.
 * Gli attributi vanno a capo uno alla volta (nome e parentesi restano uniti al
 * primo, la parentesi finale all'ultimo) e le righe successive rientrano.
 */
export default function Schema({ def }: SchemaProps) {
  const m = def.trim().match(/^([a-z_0-9]+)\((.*)\)$/s);
  if (!m) throw new Error(`[Schema] formato non valido: «${def}»`);
  const attributi = m[2].split(',').map(attributo);
  const ultimo = attributi.length - 1;
  return (
    <p className={styles.schema} aria-label={def.replace(/[[\]{}]/g, '')}>
      {attributi.map((a, i) => (
        <Fragment key={i}>
          <span className={styles.attr}>
            {i === 0 && (
              <>
                <span className={styles.nome}>{m[1]}</span>
                <span className={styles.par}>(</span>
              </>
            )}
            {a}
            <span className={styles.par}>{i === ultimo ? ')' : ','}</span>
          </span>
          {i < ultimo && ' '}
        </Fragment>
      ))}
    </p>
  );
}
