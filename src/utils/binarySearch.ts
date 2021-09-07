export default function binarySearch(list: number[], item: number) {
  if (item > list[list.length - 1]) {
    throw new Error(
      `Invalid search value (too high): ${item} > ${list[list.length - 1]}`,
    );
  }

  if (item < list[0]) {
    throw new Error(`Invalid search value (too low): ${item} < ${list[0]}`);
  }

  let low = 0;
  let high = list.length - 1;
  let mid = 0;
  let bestIndex = low;

  while (low <= high) {
    mid = Math.floor((low + high) / 2);

    if (list[mid] < item) {
      low = mid + 1;
    } else if (list[mid] > item) {
      high = mid - 1;
    } else {
      bestIndex = mid;
      break;
    }

    const diffB = Math.abs(list[bestIndex] - item);
    const diffM = Math.abs(list[mid] - item);

    if ((bestIndex < mid && diffM <= diffB) || diffM < diffB) {
      bestIndex = mid;
    }
  }

  return bestIndex;
}
