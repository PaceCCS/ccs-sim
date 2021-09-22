import PressureChanger from '../pressureChanger';
import { defaultFluidConstructor } from '../fluid';
import {
  Pressure,
  PressureUnits,
  Temperature,
  TemperatureUnits,
  Flowrate,
  FlowrateUnits,
} from 'physical-quantities';
import PipeSeg from '../pipeSeg';

describe('new fluid creation', () => {
  it('should have the same enthalpy as the received fluid', async () => {
    const incomingFluid = await defaultFluidConstructor(
      new Pressure(3500000, PressureUnits.Pascal),
      new Temperature(300, TemperatureUnits.Kelvin),
      new Flowrate(120, FlowrateUnits.Kgps),
    );

    const pChanger = new PressureChanger(
      'pChanger',
      { elevation: 0 },
      new Pressure(3000000, PressureUnits.Pascal),
    );

    const destination = new PipeSeg({
      length: 200,
      diameters: [0.9144],
      elevation: 0,
      name: 'attached-to-valve',
    });

    pChanger.setDestination(destination);

    await pChanger.process(incomingFluid);

    expect(destination.fluid!.enthalpy).toBeCloseTo(incomingFluid.enthalpy, 1);
  });
});
