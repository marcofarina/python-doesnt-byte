module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@docusaurus/recommended',
        'plugin:prettier/recommended', // Make sure this is always the last element in the array.
    ],
    settings: {
        react: {
            version: 'detect',
        },
    },
    env: {
        browser: true,
        node: true,
        es6: true,
    },
    rules: {
        // Add your custom rules here
        'react/react-in-jsx-scope': 'off', // Not needed with React 17+
        'react/prop-types': 'off', // We use TypeScript for prop validation
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        // Heading nudi (<h1>–<h6>) vanno sostituiti con <Heading> di @theme/Heading:
        // in @docusaurus/recommended è solo 'warn' e quindi non blocca. Lo alziamo a
        // 'error' per impedire che se ne riaccumulino di nuovi (override nostro: vince
        // sul default del plugin anche dopo un upgrade di Docusaurus).
        '@docusaurus/prefer-docusaurus-heading': 'error',
    },
};
