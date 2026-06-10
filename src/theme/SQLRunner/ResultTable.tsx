import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faScissors } from '@fortawesome/free-solid-svg-icons';
import styles from './styles.module.css';
import type { SqlResultSet } from './types';

/**
 * Tabella dei risultati di una SELECT. Le celle sono renderizzate come text
 * node React (escape automatico): qualunque cosa ci sia nel DB non può
 * diventare markup. NULL è reso in corsivo tenue.
 */
export function ResultTable({ result }: { result: SqlResultSet }) {
  return (
    <div className={styles.resultBlock}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {result.columns.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci}>
                    {cell === null ? (
                      <span className={styles.nullCell}>NULL</span>
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.tableMeta}>
        {result.truncated ? (
          <span className={styles.truncatedNote}>
            <FontAwesomeIcon icon={faScissors} />
            Risultato troncato: mostrate {result.rows.length} righe su{' '}
            {result.totalRows}.
          </span>
        ) : (
          <span>
            {result.totalRows === 1 ? '1 riga' : `${result.totalRows} righe`}
          </span>
        )}
      </div>
    </div>
  );
}
