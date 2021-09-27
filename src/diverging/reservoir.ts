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
  source?: IElement;

  constructor(name: string, physical: IPhysicalElement, pressure: Pressure) {
    this.name = name;
    this.physical = physical;
    this.pressure = pressure;
  }

  async process(fluid: Fluid): Promise<{
    pressureSolution: PressureSolution;
    pressure: Pressure;
    target: null | Pressure;
  }> {
    if (!fluid) {
      throw new Error(`No fluid received`);
    }
    this.fluid = fluid;

    const upper = this.pressure.pascal * 1.01;
    const lower = this.pressure.pascal * 0.99;

    return await (() => {
      if (fluid.pressure.pascal < lower) {
        return {
          pressureSolution: PressureSolution.Low,
          pressure: this.fluid.pressure,
          target: this.pressure,
        };
      }
      if (fluid.pressure.pascal > upper) {
        return {
          pressureSolution: PressureSolution.High,
          pressure: this.fluid.pressure,
          target: this.pressure,
        };
      }
      return {
        pressureSolution: PressureSolution.Ok,
        pressure: this.fluid.pressure,
        target: this.pressure,
      };
    })();
  }
}
