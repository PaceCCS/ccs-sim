import { Pressure, Temperature, TemperatureUnits } from 'physical-quantities';
import Fluid from './fluid';
import IElement, { IPhysicalElement, PressureSolution } from './element';
import Transport from './transport';
import binaryTargetSearch from '../utils/binaryTargetSearch';
import { defaultFluidConstructor } from './fluid';

export default class PressureGate extends Transport {
  inputPressure: Pressure;
  destination: IElement | null;

  constructor(
    name: string,
    physical: IPhysicalElement,
    inputPressure: Pressure,
  ) {
    super(name, physical, 'PressureGate');
    this.inputPressure = inputPressure;
    this.destination = null;
  }

  setDestination(dest: IElement): void {
    this.destination = dest;
    dest.source = this;
  }

  async process(fluid: Fluid): Promise<PressureSolution> {
    if (!fluid) {
      throw new Error(`No fluid received`);
    }
    this.fluid = fluid;

    if (!this.destination) return PressureSolution.Ok;

    const upper = this.inputPressure.pascal * 1.01;
    const lower = this.inputPressure.pascal * 0.99;

    return await (async () => {
      if (fluid.pressure.pascal < lower) {
        return PressureSolution.Low;
      }
      if (fluid.pressure.pascal > upper) {
        return PressureSolution.High;
      }
      if (!this.destination) return PressureSolution.Ok;
      return await this.destination.process(fluid);
    })();
  }
}
