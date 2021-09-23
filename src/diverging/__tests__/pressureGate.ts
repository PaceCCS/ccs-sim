import PressureGate from '../pressureGate';
import { defaultFluidConstructor } from '../fluid';
import {
  Pressure,
  PressureUnits,
  Temperature,
  TemperatureUnits,
  Flowrate,
  FlowrateUnits,
} from 'physical-quantities';
import { PressureSolution } from '../element';
import PipeSeg from '../pipeSeg';

describe('gate', () => {
  const testCases = [
    {
      fluidPressure: new Pressure(69, PressureUnits.Bara),
      expectedResult: PressureSolution.Low,
    },
    {
      fluidPressure: new Pressure(70, PressureUnits.Bara),
      expectedResult: PressureSolution.Ok,
    },
    {
      fluidPressure: new Pressure(71, PressureUnits.Bara),
      expectedResult: PressureSolution.High,
    },
  ];

  const pGate = new PressureGate(
    'pGate',
    { elevation: 0 },
    new Pressure(70, PressureUnits.Bara),
  );
  const pipeseg = new PipeSeg({
    length: 200,
    diameters: [0.9144],
    elevation: 0,
    name: 'attached-to-pGate',
  });

  pGate.setDestination(pipeseg);

  test.each(testCases)(
    'should reject fluid outside its pressure window',
    async ({ fluidPressure, expectedResult }) => {
      const fluid = await defaultFluidConstructor(
        fluidPressure,
        new Temperature(300, TemperatureUnits.Kelvin),
        new Flowrate(120, FlowrateUnits.Kgps),
      );

      const result = await pGate.process(fluid);

      expect(result).toEqual(expectedResult);
    },
  );
});
