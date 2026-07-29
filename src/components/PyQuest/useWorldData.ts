/**
 * Hook sui global data del plugin `pyquest` (spec step 12): i mondi validati a
 * build time da plugins/pyquest/index.js.
 */

import { usePluginData } from '@docusaurus/useGlobalData';
import type { WorldDef } from './types';

interface PyQuestGlobalData {
  worlds: Record<string, WorldDef>;
}

export function useWorldData(): Record<string, WorldDef> {
  const data = usePluginData('pyquest') as PyQuestGlobalData | undefined;
  return data?.worlds ?? {};
}
