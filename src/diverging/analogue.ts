import Fluid from './fluid';
import Transport from './transport';
import { defaultFluidConstructor } from './fluid';
import IElement, { IPhysicalElement, PressureSolution } from './element';
import { Pressure, PressureUnits } from 'physical-quantities';

export type ModelFunction = {
  split: number;
  intercept: number;
  powers: number[][];
  coefficients: number[];
};

export default class Analogue extends Transport {
  source?: IElement;
  modelFunction: ModelFunction;

  constructor(
    name: string,
    physical: IPhysicalElement,
    type = 'Analogue',
    modelFunction: ModelFunction,
  ) {
    super(name, physical, type);
    this.source = undefined;
    this.modelFunction = modelFunction;
  }

  get x() {
    if (!this.fluid) {
      throw new Error(`${this.type} has no fluid`);
    }

    return this.fluid.flowrate.kgps;
  }

  get y() {
    if (!this.fluid) {
      throw new Error(`${this.type} has no fluid`);
    }
    // Analogue functions use bara
    return this.fluid.pressure.bara;
  }

  endPressure(): Pressure {
    if (!this.fluid) {
      throw new Error(
        `${this.type} has no fluid - unable to calculate end pressure`,
      );
    }

    const [x, y] = [this.x, this.y];

    const subIntoPowers = this.modelFunction.powers.map(
      (powers) => x ** powers[0] * y ** powers[1],
    );
    const multipliedByCoefs = subIntoPowers.map(
      (xy, i) => xy * this.modelFunction.coefficients[i],
    );
    const endP =
      this.modelFunction.intercept +
      multipliedByCoefs.reduce((acc, a) => (acc += a), 0);

    const limit = new Pressure(13500000, PressureUnits.Pascal);
    const capped = Math.min(
      Math.max(new Pressure(endP, PressureUnits.Bara).pascal, 0),
      limit.pascal,
    );

    return new Pressure(capped, PressureUnits.Pascal);
  }

  setDestination(dest: IElement) {
    this.destination = dest;
    dest.source = this;
  }

  async process(
    fluid: Fluid,
  ): Promise<{ pressureSolution: PressureSolution; pressure: Pressure }> {
    if (!this.destination)
      return {
        pressureSolution: PressureSolution.Ok,
        pressure: fluid.pressure,
      };

    this.fluid = fluid;

    const p = this.endPressure();
    const lowPressureLimit = new Pressure(1000, PressureUnits.Pascal).pascal;
    if (p.pascal < lowPressureLimit)
      return { pressureSolution: PressureSolution.Low, pressure: p };

    const endFluid = await defaultFluidConstructor(
      p,
      fluid.temperature,
      fluid.flowrate,
    );

    return await this.destination.process(endFluid);
  }
}
