import boundarySearch from '../boundarySearch';

describe('Search', () => {
  const testCases = [
    {
      list: [1, 2, 3, 4, 5],
      item: 1.1,
      expected: {
        result: {
          high: 2,
          closest: 1,
          low: 1,
        },
        weights: {
          low: 0.8999999999999999,
          high: 0.10000000000000009,
        },
        idx: {
          high: 1,
          closest: 0,
          low: 0,
        },
      },
    },
    {
      list: [1, 2, 3, 4, 5],
      item: 1,
      expected: {
        result: {
          high: 1,
          closest: 1,
          low: 1,
        },
        weights: {
          low: NaN,
          high: NaN,
        },
        idx: {
          high: 0,
          closest: 0,
          low: 0,
        },
      },
    },
  ];

  test.each(testCases)('return ', ({ list, item, expected }) => {
    expect(boundarySearch(list, item)).toEqual(expected);
  });
});
