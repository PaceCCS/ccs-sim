import PipeSeg from '../pipeSeg';
import Fluid, { defaultFluidConstructor } from '../fluid';
import {
  Pressure,
  PressureUnits,
  Temperature,
  TemperatureUnits,
  Flowrate,
  FlowrateUnits,
} from 'physical-quantities';

describe('effectiveArea', () => {
  it('should calculate the effectiveArea', () => {
    const pipeseg = new PipeSeg({
      length: 1,
      diameters: [16, 14, 12],
      elevation: 1,
      name: 'pipe',
    });

    expect(pipeseg.effectiveArea).toBeCloseTo(468.097305385);
  });
});

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
    diameters: [0.8886],
    elevation: 10,
    name: 'pipe1',
  });
  const pipeseg2 = new PipeSeg({
    length: 1,
    diameters: [0.8886],
    elevation: 0,
    name: 'pipe2',
  });
  const pipeseg3 = new PipeSeg({
    length: 1,
    diameters: [0.8886],
    elevation: 10,
    name: 'pipe3',
  });
  const pipeseg4 = new PipeSeg({
    length: 1,
    diameters: [0.8886],
    elevation: 20,
    name: 'pipe4',
  });

  const pressureTestCases = [
    {
      pipes: [pipeseg1, pipeseg2],
      pressure: 3500000,
      temperature: 300,
      flowrate: 120,
      expectedPressure: 3506671.2,
    },
    {
      pipes: [pipeseg1, pipeseg3],
      pressure: 3500000,
      temperature: 300,
      flowrate: 120,
      expectedPressure: 3499381.3,
    },
  ];

  test.each(pressureTestCases)(
    'should update in pressure of destination',
    async ({ pipes, pressure, temperature, flowrate, expectedPressure }) => {
      const fluid = await defaultFluidConstructor(
        new Pressure(pressure, PressureUnits.Pascal),
        new Temperature(temperature, TemperatureUnits.Kelvin),
        new Flowrate(flowrate, FlowrateUnits.Kgps),
      );
      pipes[0].setDestination(pipes[1]);

      await pipes[0].process(fluid);

      expect((pipes[1].fluid as Fluid).pressure.pascal).toBeCloseTo(
        expectedPressure,
        1,
      );
    },
  );
});

describe('height', () => {
  it('should return the y differences to destination (1)', async () => {
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
