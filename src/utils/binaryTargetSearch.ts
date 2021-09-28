type acceptableFunction =
  | ((n: number) => number)
  | ((n: number) => Promise<number>);

export default async function binaryTargetSearch(
  domain: { min: number; max: number },
  target: number,
  precision = 2,
  fn: acceptableFunction = (n: number) => n,
) {
  if (domain.min === undefined || !domain.max) {
    throw new Error(`Invalid search domain`);
  }

  target = Number(target);

  const range = {
    min: fn(domain.min),
    max: fn(domain.max),
  };

  if (target < range.min) {
    throw new Error(
      `Invalid target (${target}): outside function range (${range.min} - ${range.max})`,
    );
  }

  let low = domain.min;
  let high = domain.max;
  let mid = 0;

  const maxIterations = 25;
  let iterations = 0;

  const comparison = (value: number) =>
    Number(value).toFixed(precision) === target.toFixed(precision);

  while (iterations++ < maxIterations) {
    mid = (low + high) / 2;

    const guess = await fn(mid);

    if (comparison(guess)) {
      break;
    }
    if (guess < target) {
      low = mid;
    } else if (guess > target) {
      high = mid;
    }
  }
  return Number(mid.toFixed(precision));
}
