import Fluid from './fluid';
import IElement, { IPhysicalElement, PressureSolution } from './element';
import Transport from './transport';
import { defaultFluidConstructor } from './fluid';
import {
  Pressure,
  PressureUnits,
  Temperature,
  TemperatureUnits,
  Flowrate,
} from 'physical-quantities';

export default class Inlet extends Transport {
  temperature: Temperature = new Temperature(10, TemperatureUnits.Kelvin);

  constructor(name: string, physical: IPhysicalElement) {
    super(name, physical, 'Inlet');
  }

  async applyInletProperties(
    pressure: Pressure,
    temperature: Temperature,
    flowrate: Flowrate,
    skipProcess = false,
  ) {
    const newFluid = await defaultFluidConstructor(
      pressure,
      temperature,
      flowrate,
    );

    this.fluid = newFluid;
    this.temperature = this.fluid.temperature;

    if (skipProcess) return;
    return this.process(this.fluid);
  }

  async searchInletPressure() {
    const lowLimit = new Pressure(1, PressureUnits.Bara);
    const highLimit = new Pressure(140, PressureUnits.Bara);

    let low = lowLimit.pascal;
    let high = highLimit.pascal;
    let mid = 0;

    let guesses = 0;
    const maxGuesses = 25;

    let pressureSolution = PressureSolution.Low;

    if (!this.fluid) {
      throw new Error(`Inlet has no fluid`);
    }

    while (pressureSolution !== PressureSolution.Ok) {
      if (guesses++ > maxGuesses - 1) {
        break;
      }

      mid = (low + high) / 2;

      pressureSolution = (
        await this.applyInletProperties(
          new Pressure(mid, PressureUnits.Pascal),
          this.temperature,
          this.fluid.flowrate,
        )
      )?.pressureSolution as PressureSolution;

      if (pressureSolution === PressureSolution.Low) {
        low = mid;
      } else if (pressureSolution === PressureSolution.High) {
        high = mid;
      }
    }

    return {
      pressure: new Pressure(mid, PressureUnits.Pascal),
      pressureSolution,
    };
  }

  setDestination(dest: IElement) {
    this.destination = dest;
    dest.source = this;
  }

  async process(fluid: Fluid): Promise<{
    pressureSolution: PressureSolution;
    pressure: Pressure;
    target: null | Pressure;
  }> {
    if (!this.destination)
      return {
        pressureSolution: PressureSolution.Ok,
        pressure: fluid.pressure,
        target: null,
      };

    return await this.destination.process(fluid);
  }
}
