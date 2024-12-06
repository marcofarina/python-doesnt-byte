import React, {useState, useEffect} from 'react';

function ThemeImage({lightSrc, darkSrc, className, alt}) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const themeObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          setTheme(mutation.target.getAttribute('data-theme'));
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
