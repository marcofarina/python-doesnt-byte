import React, { useState, useEffect } from 'react';

interface ThemeImageProps {
    lightSrc: string;
    darkSrc: string;
    className?: string;
    alt: string;
}

function ThemeImage({ lightSrc, darkSrc, className, alt }: ThemeImageProps) {
    const [theme, setTheme] = useState<string>('light');

    useEffect(() => {
        const themeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                    mutation.type === 'attributes' &&
                    mutation.attributeName === 'data-theme'
                ) {
                    const newTheme = (mutation.target as HTMLElement).getAttribute(
                        'data-theme',
                    );
                    if (newTheme) {
                        setTheme(newTheme);
                    }
                }
            });
        });

        const htmlElement = document.documentElement;
        themeObserver.observe(htmlElement, {
            attributes: true,
        });

        return () => themeObserver.disconnect();
    }, []);

    return (
        <img
            src={theme === 'dark' ? darkSrc : lightSrc}
            alt={alt}
            className={className}
        />
    );
}

export default ThemeImage;
