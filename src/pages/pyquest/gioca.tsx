/**
 * Pagina di gioco PyQuest (spec step 19) — `/pyquest/gioca?world=…&level=…`.
 *
 * Legge mondo e livello dalla query (via `useLocation`, così reagisce alla
 * navigazione SPA) e li valida contro i global data del plugin: un id ignoto
 * mostra un messaggio e il link alla galleria, mai un livello di ripiego. Alla
 * vittoria (`onWin` di PyQuest, che a quel punto ha già salvato il progresso e
 * quindi sbloccato il seguito) compare la navigazione al livello successivo.
 */

import { useCallback, useState } from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import { useHistory, useLocation } from '@docusaurus/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons';
import PyQuest from '@site/src/components/PyQuest';
import { useWorldData } from '@site/src/components/PyQuest/useWorldData';
import styles from './gioca.module.css';

function GiocaInner() {
  const location = useLocation();
  const history = useHistory();
  const worlds = useWorldData();

  const params = new URLSearchParams(location.search);
  const worldId = params.get('world') ?? '';
  const levelId = params.get('level') ?? '';

  const world = worlds[worldId];
  const idx = world ? world.levels.findIndex((l) => l.id === levelId) : -1;
  const level = idx >= 0 ? world.levels[idx] : undefined;
  const next =
    world && idx >= 0 && idx < world.levels.length - 1
      ? world.levels[idx + 1]
      : undefined;

  const [justWon, setJustWon] = useState(false);
  // Nuovo livello (anche via «successivo»): nascondi la barra di vittoria. Reset
  // in render (pattern «adjust state during render»), non in un effect.
  const levelKey = `${worldId}/${levelId}`;
  const [prevKey, setPrevKey] = useState(levelKey);
  if (prevKey !== levelKey) {
    setPrevKey(levelKey);
    setJustWon(false);
  }

  const handleWin = useCallback(() => setJustWon(true), []);

  const goTo = useCallback(
    (nextLevelId: string) => {
      history.push(
        `/pyquest/gioca?world=${encodeURIComponent(
          worldId,
        )}&level=${encodeURIComponent(nextLevelId)}`,
      );
    },
    [history, worldId],
  );

  if (!world || !level) {
    return (
      <div className={styles.notFound}>
        <Heading as="h1">Livello non trovato</Heading>
        <p>
          {worldId
            ? `Non esiste il livello «${levelId}» nel mondo «${worldId}».`
            : 'Manca il mondo o il livello nell’indirizzo.'}
        </p>
        <Link className={styles.backBtn} to="/pyquest">
          <FontAwesomeIcon icon={faArrowLeft} /> Vai alla galleria
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.game}>
      <div className={styles.topbar}>
        <Link className={styles.crumb} to="/pyquest">
          <FontAwesomeIcon icon={faArrowLeft} /> Tutti i livelli
        </Link>
        <div className={styles.topbarTitle}>
          <span className={styles.worldName}>{world.title}</span>
          <span className={styles.levelName}>
            {idx + 1}/{world.levels.length} · {level.title}
          </span>
        </div>
      </div>

      <div className={styles.stage}>
        {/* key: cambiando livello il componente riparte pulito (editor, trace). */}
        <PyQuest
          key={`${worldId}/${levelId}`}
          world={worldId}
          level={levelId}
          onWin={handleWin}
        />

        {justWon && (
          <div className={styles.winBar} role="status">
            {next ? (
              <>
                <span className={styles.winMsg}>
                  <FontAwesomeIcon icon={faTrophy} /> Livello superato!
                </span>
                <button
                  type="button"
                  className={styles.nextBtn}
                  onClick={() => goTo(next.id)}
                >
                  Livello successivo <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </>
            ) : (
              <>
                <span className={styles.winMsg}>
                  <FontAwesomeIcon icon={faTrophy} /> Mondo completato — Byte ti
                  ringrazia in binario.
                </span>
                <Link className={styles.nextBtn} to="/pyquest">
                  Torna alla galleria
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PyQuestPlay(): JSX.Element {
  return (
    <Layout
      title="PyQuest — gioca"
      description="Gioca un livello di PyQuest: scrivi Python e guarda Byte eseguirlo sulla griglia."
    >
      <main className={styles.page}>
        <GiocaInner />
      </main>
    </Layout>
  );
}
