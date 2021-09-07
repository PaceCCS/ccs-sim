import binarySearch from './binarySearch';

export default function boundarySearch(list: number[], item: number) {
  const idx = {
    high: NaN,
    closest: binarySearch(list, item),
    low: NaN,
  };

  const result = {
    high: NaN,
    closest: list[idx.closest],
    low: NaN,
  };

  const weights = {
    high: NaN,
    low: NaN,
  };

  const itemIsGreaterThanClosest = item > result.closest;
  const itemIsLessThanClosest = item < result.closest;

  let neighbour = idx.closest;

  if (itemIsGreaterThanClosest) neighbour++;
  else if (itemIsLessThanClosest) neighbour--;

  idx.low = Math.min(idx.closest, neighbour);
  idx.high = Math.max(idx.closest, neighbour);

  result.high = list[idx.high];
  result.low = list[idx.low];

  const interval = result.high - result.low;
  weights.high = (item - result.low) / interval;
  weights.low = 1 - weights.high;

  return { result, weights, idx };
}
