import Heading from '@theme/Heading';

import styles from './styles.module.css';

interface SectionTitleProps {
    title: string;
    description: React.ReactNode;
}

function SectionTitle({ title, description }: SectionTitleProps) {
    return (
        <div className={styles.container}>
            <Heading as="h1" className={styles.title}>
                {title}
            </Heading>
            <Heading as="h3" className={styles.description}>
                {description}
            </Heading>
        </div>
    );
}

export default SectionTitle;
