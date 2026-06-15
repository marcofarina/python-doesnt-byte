import type { GeneratorDef } from '../types';
import { bubbleSort } from './bubbleSort';
import { selectionSort } from './selectionSort';
import { insertionSort } from './insertionSort';
import { linearSearch } from './linearSearch';
import { binarySearch } from './binarySearch';
import { quicksort } from './quicksort';

const REGISTRY: Record<string, GeneratorDef> = {
  [bubbleSort.id]: bubbleSort,
  [selectionSort.id]: selectionSort,
  [insertionSort.id]: insertionSort,
  [linearSearch.id]: linearSearch,
  [binarySearch.id]: binarySearch,
  [quicksort.id]: quicksort,
};

export function getGenerator(id: string): GeneratorDef | undefined {
  return REGISTRY[id];
}
