/**
 * Al posto di `@docusaurus/ExecutionEnvironment` (vedi vite.config.ts): le
 * presentazioni girano solo nel browser, niente SSR.
 */
const ExecutionEnvironment = {
  canUseDOM: true,
  canUseEventListeners: true,
  canUseIntersectionObserver: true,
  canUseViewport: true,
};

export default ExecutionEnvironment;
