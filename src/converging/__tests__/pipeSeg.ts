import PipeSeg from '../pipeSeg';
import Fluid from '../fluid';

describe('effectiveArea', () =>
  it('should calculate the effectiveArea', () => {
    const pipeseg = new PipeSeg({
      length: 1,
      diameters: [16, 14, 12],
      elevation: 1,
      name: 'pipe',
    });

    expect(pipeseg.effectiveArea).toBeCloseTo(468.097305385);
  }));

describe('removeLine', () => {
  it('should change the returned value of effectiveArea', () => {
    const pipeseg = new PipeSeg({
      length: 1,
      diameters: [16, 14, 12],
      elevation: 1,
      name: 'pipe',
    });

    pipeseg.removeLine(14);
    const newArea = pipeseg.effectiveArea;

    expect(newArea).toBeCloseTo(314.159265359);
  });

  it('should throw an error if the pipe does not have a line of the specified size', () => {
    const pipeseg = new PipeSeg({
      length: 1,
      diameters: [16, 14, 12],
      elevation: 1,
      name: 'pipe',
    });

    expect(() => pipeseg.removeLine(1)).toThrow(
      /Pipe does not have a line of size/,
    );
  });

  it('should throw an error if the pipe only has one line remaining', () => {
    const pipeseg = new PipeSeg({
      length: 1,
      diameters: [12],
      elevation: 1,
      name: 'pipe',
    });

    expect(() => pipeseg.removeLine(12)).toThrow(
      /Pipe only has one line remaining/,
    );
  });
});

describe('addLine', () => {
  it('should change the returned value of effectiveArea', () => {
    const pipeseg = new PipeSeg({
      length: 1,
      diameters: [1, 1, 1],
      elevation: 1,
      name: 'pipe',
    });

    pipeseg.addLine(2);

    expect(pipeseg.effectiveArea).toBe(5.497787143782138);
  });
});

describe('destinations', () => {
  const pipeseg1 = new PipeSeg({
    length: 200,
    diameters: [0.9144],
    elevation: 1,
    name: 'pipe1',
  });
  const pipeseg2 = new PipeSeg({
    length: 1,
    diameters: [0.9144],
    elevation: 1,
    name: 'pipe2',
  });
  pipeseg1.setDestination(pipeseg2);

  it('should add a destination pipe', () => {
    expect(pipeseg1.destination).toBe(pipeseg2);
  });

  it('should set the source of the destination pipe', () => {
    expect(pipeseg2.source).toBe(pipeseg1);
  });

  it('should update in pressure of destination (1/3)', () => {
    const fluid = new Fluid(100000, 300, 150);

    pipeseg1.process(fluid);

    expect((pipeseg2.fluid as Fluid).pressure).toBe(61111.81128965647);
  });

  it('should update in pressure of destination (2/3)', () => {
    const fluid = new Fluid(300000, 350, 100);

    pipeseg1.process(fluid);

    expect((pipeseg2.fluid as Fluid).pressure).toBe(294535.73943407804);
  });

  it('should update flowrate of destination', () => {
    const fluid = new Fluid(300000, 350, 100);

    pipeseg1.process(fluid);

    expect((pipeseg2.fluid as Fluid).flowrate).toBe(100);
  });
});

describe('height', () => {
  it('should throw an error if no destination', () => {
    const pipeseg1 = new PipeSeg({
      length: 1,
      diameters: [1],
      elevation: 1,
      name: 'pipe',
    });

    expect(() => pipeseg1.height).toThrow(/No destination/);
  });

  it('should return the y differences to destination (1)', () => {
    const fluid = new Fluid(1, 1, 1);
    const pipeseg1 = new PipeSeg({
      length: 1,
      diameters: [1],
      elevation: 1,
      name: 'pipe',
    });
    const pipeseg2 = new PipeSeg({
      length: 1,
      diameters: [1],
      elevation: 10,
      name: 'pipe',
    });
    pipeseg1.setDestination(pipeseg2);

    expect(pipeseg1.height).toEqual(9);
  });
});

describe('endPressure', () => {
  it('should throw an error when the PipeSeg has no fluid', () => {
    const pipeseg = new PipeSeg({
      length: 200,
      diameters: [0.9144],
      elevation: 1,
      name: 'pipe',
    });

    expect(() => pipeseg.endPressure()).toThrow(/no fluid/);
  });
  it('should return zero when the flowrate is too high', () => {
    const fluid = new Fluid(100000, 300, 200);
    const pipeseg = new PipeSeg({
      length: 200,
      diameters: [0.9144],
      elevation: 1,
      name: 'pipe',
    });
    pipeseg.process(fluid);

    expect(pipeseg.endPressure()).toBe(0);
  });
});
