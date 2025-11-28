import React from 'react';

import styles from './styles.module.css';

interface SectionProps {
    children: React.ReactNode;
}

function Section({ children }: SectionProps) {
    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>{children}</div>
        </div>
    );
}

export default Section;
