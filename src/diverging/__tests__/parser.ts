import Parser from '../parser';
import Inlet from '../inlet';
import PipeSeg from '../pipeSeg';
import Splitter from '../splitter';
import Well from '../well';
import Perforation from '../perforation';
import Reservoir from '../reservoir';

describe('readFile', () => {
  it('should read a .yml input file', () => {
    const parser = new Parser();
    const data = parser.readFile(`${__dirname}/inputFiles/inletAndPipeSeg.yml`);

    const expected = {
      instructions: [
        { inlet: { name: 'start', physical: { elevation: 0 } } },
        {
          pipeseg: {
            name: 'pipe1',
            diameters: [1, 2, 3, 4],
            elevation: 0,
            length: 200,
          },
        },
      ],
    };

    expect(data).toEqual(expected);
  });
});

describe('build from .yml', () => {
  it('should create a simple network', async () => {
    const parser = new Parser();
    parser.readFile(`${__dirname}/inputFiles/inletAndPipeSeg.yml`);
    const root = await parser.build();

    expect(root).toBeInstanceOf(Inlet);
    expect((root as Inlet).destination).toBeInstanceOf(PipeSeg);
  });

  it('should create a more complex network (twosplit)', async () => {
    const parser = new Parser();
    parser.readFile(`${__dirname}/inputFiles/twosplit.yml`);
    const root = await parser.build();

    expect(root).toBeInstanceOf(Inlet);
    expect((root as Inlet).destination).toBeInstanceOf(PipeSeg);
    expect(((root as Inlet).destination as PipeSeg).destination).toBeInstanceOf(
      Splitter,
    );
    expect(
      (((root as Inlet).destination as PipeSeg).destination as Splitter)
        .destinations[0],
    ).toBeInstanceOf(PipeSeg);
    expect(
      (
        (((root as Inlet).destination as PipeSeg).destination as Splitter)
          .destinations[0] as PipeSeg
      ).destination,
    ).toBeInstanceOf(Splitter);
  });

  it('should create a more complex network (series)', async () => {
    const parser = new Parser();
    parser.readFile(`${__dirname}/inputFiles/twosplit.yml`);
    const root = await parser.build();

    expect(root).toBeInstanceOf(Inlet);
    expect((root as Inlet).destination).toBeInstanceOf(PipeSeg);
    expect(((root as Inlet).destination as PipeSeg).destination).toBeInstanceOf(
      Splitter,
    );
    expect(
      (((root as Inlet).destination as PipeSeg).destination as Splitter)
        .destinations[0],
    ).toBeInstanceOf(PipeSeg);
    expect(
      (
        (((root as Inlet).destination as PipeSeg).destination as Splitter)
          .destinations[0] as PipeSeg
      ).destination,
    ).toBeInstanceOf(Splitter);
  });
});

// describe('build from .genkey', () => {
//   let parser: Parser,
//     root: Inlet,
//     pipe1: PipeSeg,
//     pipe2: PipeSeg,
//     pipe3: PipeSeg,
//     pipe4: PipeSeg,
//     pipe5: PipeSeg,
//     pipe6: PipeSeg,
//     pipe7: PipeSeg;

//   beforeAll(async (done) => {
//     parser = new Parser();
//     parser.readFile(`${__dirname}/inputFiles/pipeTooLong.genkey`);
//     root = (await parser.build()) as Inlet;

//     pipe1 = (root as Inlet).destination as PipeSeg;
//     pipe2 = (pipe1 as PipeSeg).destination as PipeSeg;
//     pipe3 = (pipe2 as PipeSeg).destination as PipeSeg;
//     pipe4 = (pipe3 as PipeSeg).destination as PipeSeg;
//     pipe5 = (pipe4 as PipeSeg).destination as PipeSeg;
//     pipe6 = (pipe5 as PipeSeg).destination as PipeSeg;
//     pipe7 = (pipe6 as PipeSeg).destination as PipeSeg;
//     done(); // https://github.com/facebook/jest/issues/1256
//   });

//   it('should create a pipeseries when the length would be too long for one pipeseg', () => {
//     expect(pipe1.physical.length).toBe(200);
//     expect(pipe2.physical.length).toBe(200);
//     expect(pipe3.physical.length).toBeCloseTo(70.2239);
//     expect(pipe4.physical.length).toBe(200);
//   });

//   it('should elevate the pipe segments appropriately', () => {
//     expect(pipe1.physical.elevation).toBe(14.51);
//     expect(pipe2.physical.elevation).toBe(19.0759);
//     expect(pipe3.physical.elevation).toBe(23.6417);
//     expect(pipe4.physical.elevation).toBe(25.25);
//     expect(pipe5.physical.elevation).toBe(22.4129);
//     expect(pipe6.physical.elevation).toBe(19.5758);
//     expect(pipe7.physical.elevation).toBe(16.7387);
//   });
// });

describe('build whole network', () => {
  it('should return a list of connected key points', async () => {
    const parser = new Parser();
    parser.readFile(`${__dirname}/inputFiles/whole.yml`);
    await parser.build();
    const keyPoints = parser.keyPoints;

    const expectedKeyPoints = [
      { cls: Inlet, name: 'POA-DG' },
      { cls: Splitter, name: 'Douglas Manifold' },
      { cls: Well, name: 'HM1' },
      { cls: Perforation, name: 'HM1' },
      { cls: Reservoir, name: 'Hamilton' },
      { cls: Well, name: 'HN1' },
      { cls: Perforation, name: 'HN1' },
      { cls: Reservoir, name: 'Hamilton North' },
      { cls: Well, name: 'LX1' },
      { cls: Perforation, name: 'LX1' },
      { cls: Reservoir, name: 'Lennox' },
    ];

    const matches = expectedKeyPoints.map(
      (ekp, i) =>
        keyPoints[i] instanceof ekp.cls && keyPoints[i].name === ekp.name,
    );
    const allMatch = matches.every((match) => match);

    expect(keyPoints.length).toBe(expectedKeyPoints.length);
    expect(allMatch).toBe(true);
    expect((keyPoints[1] as Splitter).destinations.length).toBe(3);
  });
});
