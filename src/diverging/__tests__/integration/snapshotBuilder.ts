import SnapshotBuilder from '../../snapshotBuilder';
import Inlet from '../../inlet';
import PipeSeg from '../../pipeSeg';
import Well from '../../well';
import Perforation from '../../perforation';
import Reservoir from '../../reservoir';
import Splitter from '../../splitter';
import IElement from '../../element';
import Valve from '../../valve';

describe('add', () => {
  it('should create an inlet', async () => {
    const builder = new SnapshotBuilder();

    builder.addInlet('start', { elevation: 0 });

    expect(builder.elements[0]).toBeInstanceOf(Inlet);
  });

  it('should create a pipeseg', async () => {
    const builder = new SnapshotBuilder();

    builder.addInlet('start', { elevation: 0 }).addPipeSeg({
      name: 'p',
      elevation: 0,
      length: 200,
      diameters: [1, 2, 3, 4],
    });

    expect(builder.elements[1]).toBeInstanceOf(PipeSeg);
  });

  it('should create a series of pipesegs', async () => {
    const builder = new SnapshotBuilder()
      .addInlet('start', { elevation: 0 })
      .addPipeSeries(3, {
        name: 'p',
        elevation: 0,
        length: 200,
        diameters: [1, 2, 3, 4],
      });

    expect(builder.elements[1]).toBeInstanceOf(PipeSeg);
    expect(builder.elements[2]).toBeInstanceOf(PipeSeg);
    expect(builder.elements[3]).toBeInstanceOf(PipeSeg);
    expect(builder.elements.length).toBe(4);
  });

  it('should create a series of pipesegs with different elevations', async () => {
    const builder = new SnapshotBuilder()
      .addInlet('start', { elevation: 0 })
      .addPipeSeries(
        10,
        {
          name: 'p',
          elevation: 1,
          length: 200,
          diameters: [1, 2, 3, 4],
        },
        [2, 3],
      );

    expect(builder.elements[7].physical.elevation).toBe(2);
    expect(builder.elements.length).toBe(11);
  });

  it('should create a series of pipesegs with different lengths', async () => {
    const builder = new SnapshotBuilder()
      .addInlet('start', { elevation: 0 })
      .addPipeSeries(
        10,
        {
          name: 'p',
          elevation: 1,
          length: 200,
          diameters: [1, 2, 3, 4],
        },
        [0],
        [2, 3],
      );

    expect((builder.elements[7] as PipeSeg).physical.length).toBe(2);
    expect(builder.elements.length).toBe(11);
  });

  it('should create a well', async () => {
    const builder = new SnapshotBuilder()
      .addInlet('start', { elevation: 0 })
      .addPipeSeg({
        name: 'p',
        elevation: 0,
        length: 200,
        diameters: [1, 2, 3, 4],
      })
      .addWell('HM-All', { elevation: 0 }, 'Hamilton');

    expect(builder.elements[2]).toBeInstanceOf(Well);
    expect(builder.previousElem).toBeInstanceOf(Perforation);
    expect(builder.elements.length).toBe(4);
  });

  it('should create a splitter', async () => {
    const builder = new SnapshotBuilder()
      .addInlet('start', { elevation: 0 })
      .addPipeSeg({
        name: 'p',
        elevation: 0,
        length: 200,
        diameters: [1, 2, 3, 4],
      })
      .addSplitter('split1', { elevation: 0 });

    expect(builder.elements[2]).toBeInstanceOf(Splitter);
  });

  it('should create a reservoir', async () => {
    const builder = new SnapshotBuilder()
      .addInlet('start', { elevation: 0 })
      .addPipeSeg({
        name: 'p',
        elevation: 0,
        length: 200,
        diameters: [1, 2, 3, 4],
      })
      .addWell('HM-All', { elevation: 0 }, 'Hamilton')
      .addReservoir('Hamilton', { elevation: 0 }, 4);

    expect(builder.previousElem).toBeInstanceOf(Reservoir);
    expect(((builder.previousElem as IElement).source as IElement).name).toBe(
      'HM-All',
    );
  });

  it('should create a valve', async () => {
    const builder = new SnapshotBuilder()
      .addInlet('start', { elevation: 0 })
      .addPipeSeg({
        name: 'p',
        elevation: 0,
        length: 200,
        diameters: [1, 2, 3, 4],
      })
      .addValve('volvo', { elevation: 0 }, 7000000);

    expect(builder.previousElem).toBeInstanceOf(Valve);
  });
});

describe('chain', () => {
  it('should connect a pipe to an inlet', async () => {
    const builder = new SnapshotBuilder()
      .addInlet('start', { elevation: 0 })
      .chainAddPipeSeg({
        name: 'p',
        elevation: 0,
        length: 200,
        diameters: [1, 2, 3, 4],
      });

    expect(builder.elements.length).toBe(2);
    expect(builder.previousElem).toBeInstanceOf(PipeSeg);
    expect((builder.previousElem as IElement).source).toBeInstanceOf(Inlet);
    expect(((builder.previousElem as IElement).source as IElement).name).toBe(
      'start',
    );
  });
});

describe('navigation - selectSplitter', () => {
  const builder = new SnapshotBuilder()
    .addInlet('start', {
      elevation: 0,
    })
    .chainAddPipeSeg({
      name: 'inletpipe',
      elevation: 0,
      length: 200,
      diameters: [1, 2, 3, 4],
    })
    .addSplitter('split1', { elevation: 0 })
    .chainAddPipeSeg({
      name: 's1-s2',
      elevation: 0,
      length: 200,
      diameters: [1, 2, 3, 4],
    })
    .addSplitter('split2', { elevation: 0 });

  test('setup', () => {
    expect(builder.previousElem).toBeInstanceOf(Splitter);
    expect(builder.splitters.length).toBe(2);
    expect(builder.selectSplitter(0)).toBeInstanceOf(SnapshotBuilder);
  });

  test('select by name', () => {
    builder.selectSplitter('split1');
    expect((builder.selectedSplitter as Splitter).name).toBe('split1');
    builder.selectSplitter('split2');
    expect((builder.selectedSplitter as Splitter).name).toBe('split2');
  });

  test('select by position', () => {
    builder.selectSplitter(0);
    expect((builder.selectedSplitter as Splitter).name).toBe('split1');
    builder.selectSplitter(1);
    expect((builder.selectedSplitter as Splitter).name).toBe('split2');
  });

  test('branch', () => {
    builder.selectSplitter(0).branch({
      name: 'froms1',
      elevation: 0,
      length: 200,
      diameters: [1, 2, 3, 4],
    });
    expect(((builder.previousElem as IElement).source as IElement).name).toBe(
      'split1',
    );
    builder.selectSplitter('split2').branch({
      name: 'froms2',
      elevation: 0,
      length: 200,
      diameters: [1, 2, 3, 4],
    });
    expect(((builder.previousElem as IElement).source as IElement).name).toBe(
      'split2',
    );
  });
});
