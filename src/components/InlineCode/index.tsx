import type { ReactNode } from 'react';
import styles from './styles.module.css';

type Kind = 'default' | 'keyword' | 'string' | 'function';

interface InlineCodeProps {
  children: ReactNode;
  kind?: Kind;
}

export default function InlineCode({
  children,
  kind = 'default',
}: InlineCodeProps) {
  return <code className={`${styles.code} ${styles[kind]}`}>{children}</code>;
}
