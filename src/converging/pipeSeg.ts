import IElement, { IPhysicalElement, PressureSolution } from './element';
import Fluid from './fluid';
import Transport from './transport';

interface IPipeDefinition extends IPhysicalElement {
  length: number;
  diameters: number[];
  elevation: number;
  name: string;
}

export default class PipeSeg extends Transport {
  fluid?: Fluid;
  physical: IPipeDefinition;
  source: IElement | null;
  destination: IElement | null;

  constructor(pipeDef: IPipeDefinition) {
    super(pipeDef.name, pipeDef, 'PipeSeg');

    this.physical = pipeDef;
    this.source = null;
    this.destination = null;
  }

  get effectiveArea() {
    return this.physical.diameters
      .map((d) => (Math.PI / 4) * d ** 2)
      .reduce((acc, a) => acc + a, 0);
  }

  removeLine(size: number) {
    if (!this.physical.diameters.includes(size)) {
      throw new Error(`Pipe does not have a line of size ${size}`);
    }
    if (this.physical.diameters.length === 1) {
      throw new Error(`Pipe only has one line remaining`);
    }
    this.physical.diameters.splice(this.physical.diameters.indexOf(size), 1);
  }

  addLine(size: number) {
    this.physical.diameters.push(size);
  }

  setDestination(dest: IElement) {
    this.destination = dest;
    dest.source = this as IElement;
  }

  get height() {
    if (!this.destination) throw new Error(`No destination`);
    return this.destination.physical.elevation - this.physical.elevation;
  }

  endPressure(): number {
    if (!this.fluid) {
      throw new Error(
        `Pipe segment has no fluid - unable to calculate end pressure`,
      );
    }

    const w = this.fluid.flowrate;
    const D = Math.sqrt(this.effectiveArea / Math.PI) * 2;
    const A = this.effectiveArea;
    const ρ = this.fluid.density();
    const v = 1 / ρ;
    const L = this.physical.length;
    const P1 = this.fluid.pressure;

    // Friction factor
    const u = w / (A * ρ);
    const μ = this.fluid.viscosity();
    const Re = (ρ * u * D) / μ;
    const f = Re < 2000 ? 64 / Re : 0.094 / (D * 1000) ** (1 / 3);

    const domainLimitingTerm = Math.sqrt((A ** 2 * D * P1) / (f * L * v));
    if (domainLimitingTerm <= w) {
      return 0;
    }

    return (
      (A * Math.sqrt(D)) ** -1 *
      Math.sqrt(P1) *
      Math.sqrt(A ** 2 * D * P1 - f * L * v * w ** 2)
    );
  }
  process(fluid: Fluid): PressureSolution {
    this.fluid = fluid;

    // TODO: remove this after adding reservoirs to tests
    if (!this.destination) return PressureSolution.Ok;

    const p = this.endPressure();
    const endFluid = new Fluid(p, fluid.temperature, fluid.flowrate);

    return this.destination.process(endFluid);
  }
}
