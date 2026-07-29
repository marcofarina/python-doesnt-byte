/**
 * Galleria PyQuest (spec step 19) — `/pyquest`.
 *
 * Elenca i mondi validati a build time dal plugin `pyquest` e, per ciascuno, i
 * livelli con lucchetti (sblocco calcolato da `useProgress`, spec D10), stelle
 * guadagnate (spec D11) e link alla pagina di gioco full-height `/pyquest/gioca`.
 *
 * Nessun `BrowserOnly`: `useProgress` parte da EMPTY sia sul server sia al primo
 * render client (allinea lo storage in un effect), quindi l'hydration combacia e
 * i lucchetti «si aprono» subito dopo. Le card e gli sprite sono SSR-safe.
 */

import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar,
  faLock,
  faPlay,
  faFlagCheckered,
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarOutline } from '@fortawesome/free-regular-svg-icons';
import clsx from 'clsx';
import { useWorldData } from '@site/src/components/PyQuest/useWorldData';
import {
  useProgress,
  starsFor,
} from '@site/src/components/PyQuest/useProgress';
import { characterDef } from '@site/src/components/PyQuest/characters';
import type { LevelDef, WorldDef } from '@site/src/components/PyQuest/types';
import styles from './styles.module.css';

/** Riga di 3 stelle, piene fino a `n` (spec D11); `n = 0` = tutte vuote. */
function Stars({ n }: { n: number }) {
  return (
    <span
      className={styles.stars}
      aria-label={n === 0 ? 'nessuna stella' : `${n} stelle su 3`}
    >
      {[1, 2, 3].map((i) => (
        <FontAwesomeIcon
          key={i}
          icon={i <= n ? faStar : faStarOutline}
          className={clsx(styles.star, i <= n && styles.starOn)}
        />
      ))}
    </span>
  );
}

function LevelRow({
  world,
  level,
  index,
}: {
  world: WorldDef;
  level: LevelDef;
  index: number;
}) {
  const { getLevel, isUnlocked } = useProgress();
  const saved = getLevel(world.id, level.id);
  const unlocked = isUnlocked(world, level.id);
  const stars = saved?.done ? starsFor(saved.bestSteps, level.par) : 0;

  const meta = (
    <>
      <span className={styles.levelNum} aria-hidden="true">
        {index + 1}
      </span>
      <span className={styles.levelBody}>
        <span className={styles.levelTitle}>{level.title}</span>
        <span className={styles.levelSub}>
          {saved?.done
            ? `Completato · record ${saved.bestSteps} · par ${level.par}`
            : unlocked
              ? `Da giocare · par ${level.par}`
              : 'Completa il livello precedente per sbloccarlo'}
        </span>
      </span>
    </>
  );

  if (!unlocked) {
    return (
      <div
        className={clsx(styles.level, styles.levelLocked)}
        aria-disabled="true"
      >
        {meta}
        <FontAwesomeIcon icon={faLock} className={styles.levelIcon} />
      </div>
    );
  }

  return (
    <Link
      className={clsx(styles.level, saved?.done && styles.levelDone)}
      to={`/pyquest/gioca?world=${encodeURIComponent(
        world.id,
      )}&level=${encodeURIComponent(level.id)}`}
    >
      {meta}
      {saved?.done ? (
        <Stars n={stars} />
      ) : (
        <FontAwesomeIcon icon={faPlay} className={styles.levelIcon} />
      )}
    </Link>
  );
}

function WorldCard({ world }: { world: WorldDef }) {
  const { getLevel } = useProgress();
  const char = characterDef(world.character);
  const done = world.levels.filter(
    (l) => getLevel(world.id, l.id)?.done,
  ).length;
  const total = world.levels.length;

  return (
    <section className={styles.card}>
      <header className={styles.cardHead}>
        <div className={styles.avatar} aria-hidden="true">
          {char.sprite}
        </div>
        <div className={styles.cardHeadText}>
          <Heading as="h2" className={styles.cardTitle}>
            {world.title}
          </Heading>
          <p className={styles.cardDesc}>{world.description}</p>
          <div className={styles.progress}>
            <FontAwesomeIcon icon={faFlagCheckered} aria-hidden="true" />
            <span>
              {done} / {total} completati
            </span>
            <span className={styles.progressChar}>· con {char.name}</span>
          </div>
        </div>
      </header>

      <ol className={styles.levels}>
        {world.levels.map((level, i) => (
          <li key={level.id}>
            <LevelRow world={world} level={level} index={i} />
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function PyQuestGallery(): JSX.Element {
  const worlds = useWorldData();
  const list = Object.values(worlds);

  return (
    <Layout
      title="PyQuest"
      description="Impara Python facendo muovere Byte il droide su una griglia: mini-missioni con codice vero, eseguito nel browser."
    >
      <main className={styles.page}>
        <div className={styles.header}>
          <Heading as="h1" className={styles.h1}>
            PyQuest
          </Heading>
          <p className={styles.lead}>
            Scrivi Python vero e guarda Byte il droide eseguirlo — esattamente
            come lo hai scritto. Ogni missione ti insegna un pezzo del
            linguaggio: muoverti, ripetere, decidere e cavartela quando le cose
            si mettono male. Completa un livello per sbloccare il prossimo.
          </p>
        </div>

        {list.length === 0 ? (
          <p className={styles.empty}>
            Nessun mondo disponibile: controlla che <code>static/pyquest/</code>{' '}
            contenga almeno un <code>world.json</code>.
          </p>
        ) : (
          <div className={styles.grid}>
            {list.map((world) => (
              <WorldCard key={world.id} world={world} />
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}
