import Transport from './transport';
import Fluid, { defaultFluidConstructor } from './fluid';
import IElement, { IPhysicalElement, PressureSolution } from './element';
import { Pressure, PressureUnits } from 'physical-quantities';

export interface IPipeDefinition extends IPhysicalElement {
  length: number;
  diameters: number[];
  elevation: number;
  name: string;
}

export default class PipeSeg extends Transport {
  physical: IPipeDefinition;

  constructor(pipeDef: IPipeDefinition) {
    super(pipeDef.name, pipeDef, 'PipeSeg');

    this.physical = pipeDef;
  }

  get effectiveArea() {
    return this.physical.diameters
      .map((d) => (Math.PI / 4) * d ** 2)
      .reduce((acc, a) => (acc += a), 0);
  }

  removeLine(size: number): void {
    if (!this.physical.diameters.includes(size)) {
      throw new Error(`Pipe does not have a line of size ${size}`);
    }
    if (this.physical.diameters.length === 1) {
      throw new Error(`Pipe only has one line`);
    }
    this.physical.diameters.splice(this.physical.diameters.indexOf(size), 1);
  }

  addLine(size: number): void {
    this.physical.diameters.push(size);
  }

  setDestination(dest: IElement): void {
    this.destination = dest;
    dest.source = this;
  }

  get height() {
    if (!this.destination) throw new Error('No destination');
    return this.destination.physical.elevation - this.physical.elevation;
  }

  endPressure(): Pressure {
    if (!this.fluid)
      throw new Error(
        'Pipe segment has no fluid - unable to calculate end pressure',
      );
    const w = this.fluid.flowrate;
    const D = Math.sqrt(this.effectiveArea / Math.PI) * 2;
    const A = this.effectiveArea;
    const ρ = this.fluid.density;
    const v = 1 / ρ;
    const L = this.physical.length;
    const P1 = this.fluid.pressure;

    // Friction factor
    const u = w.kgps / (A * ρ);
    const μ = this.fluid.viscosity;
    const Re = (ρ * u * D) / μ;
    const ε = 4.5e-5;
    const f =
      0.25 / Math.log10((ε * 1000) / (3.7 * D * 1000) + 5.74 / Re ** 0.9) ** 2;

    const g = 9.807;
    const elevationLoss = g * this.height * ρ;

    let endP =
      (A * Math.sqrt(D)) ** -1 *
        Math.sqrt(P1.pascal) *
        Math.sqrt(A ** 2 * D * P1.pascal - f * L * v * w.kgps ** 2) -
      elevationLoss;

    endP = isNaN(endP) ? 0 : endP;

    const limit = new Pressure(13500000, PressureUnits.Pascal);
    const capped = Math.max(Math.min(endP, limit.pascal), 0);

    return new Pressure(capped, PressureUnits.Pascal);
  }

  async process(
    fluid: Fluid,
  ): Promise<{ pressureSolution: PressureSolution; pressure: Pressure }> {
    this.fluid = fluid;

    // TODO: remove this after adding reservoirs to tests
    if (!this.destination)
      return {
        pressureSolution: PressureSolution.Ok,
        pressure: this.fluid.pressure,
      };

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
