import IElement, { IPhysicalElement, PressureSolution } from './element';
import Fluid from './fluid';
import Perforation from './perforation';
import { Pressure } from 'physical-quantities';

export enum RealReservoir {
  Hamilton,
  HamiltonNorth,
  Lennox,
}

export default class Reservoir implements IElement {
  type: string = 'Reservoir';
  name: string;
  physical: IPhysicalElement;
  pressure: Pressure;
  fluid?: Fluid;
  source?: Perforation;

  constructor(name: string, physical: IPhysicalElement, pressure: Pressure) {
    this.name = name;
    this.physical = physical;
    this.pressure = pressure;
  }

  async process(fluid: Fluid): Promise<PressureSolution> {
    if (!fluid) {
      throw new Error(`No fluid received`);
    }
    this.fluid = fluid;

    // stream.write(
    // 	`${this.name}: ${this.fluid.pressure.bara} Bara | ${this.fluid.flowrate.kgps} kg/s\n`
    // );

    const upper = this.pressure.pascal * 1.01;
    const lower = this.pressure.pascal * 0.99;

    return await (() => {
      if (fluid.pressure.pascal < lower) {
        return PressureSolution.Low;
      }
      if (fluid.pressure.pascal > upper) {
        return PressureSolution.High;
      }
      return PressureSolution.Ok;
    })();
  }
}
