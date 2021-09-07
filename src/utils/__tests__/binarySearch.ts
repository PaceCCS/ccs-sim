import binarySearch from '../binarySearch';

describe('Search', () => {
  const testCases = [
    { list: [1, 2, 3, 4, 5], item: 1, expected: 0 },
    { list: [1, 2, 3, 4, 5], item: 3, expected: 2 },
    { list: [1, 2, 3, 4, 5], item: 1.5, expected: 1 },
    { list: [1, 2, 3, 4, 5], item: 3.5, expected: 3 },
    { list: [1, 2, 3, 4, 5], item: 1.4, expected: 0 },
    { list: [1, 2, 3, 4, 5], item: 2.5, expected: 2 },
    {
      list: [
        1000, 47976.5101, 94953.0201, 141929.53, 188906.04, 235882.55,
        282859.06, 329835.57, 376812.081,
      ],
      item: 47976.5101,
      expected: 1,
    },
    {
      list: [
        1000, 47976.5101, 94953.0201, 141929.53, 188906.04, 235882.55,
        282859.06, 329835.57, 376812.081,
      ],
      item: 50000,
      expected: 1,
    },
    {
      list: [1, 47, 94, 141, 188, 235, 282, 329, 376],
      item: 47,
      expected: 1,
    },
    {
      list: [1, 47, 94, 141, 188, 235, 282, 329, 376],
      item: 5,
      expected: 0,
    },
    {
      list: [1, 47, 94, 141, 188, 235, 282, 329, 376],
      item: 1,
      expected: 0,
    },
    {
      list: [1, 47, 94, 141, 188, 235, 282, 329, 376],
      item: 35,
      expected: 1,
    },
    {
      list: [1, 47, 94, 141, 188, 235, 282, 329, 376],
      item: 48,
      expected: 1,
    },
  ];

  test.each(testCases)('return expected', ({ list, item, expected }) => {
    expect(binarySearch(list, item)).toEqual(expected);
  });
});

describe('Outside range', () => {
  it('should throw an error when the value is too high', () => {
    const list = [1, 2, 3, 4, 5];
    const item = 6;

    expect(() => binarySearch(list, item)).toThrow('too high');
  });

  it('should throw an error when the value is too low', () => {
    const list = [1, 2, 3, 4, 5];
    const item = 0;

    expect(() => binarySearch(list, item)).toThrow('too low');
  });
});
