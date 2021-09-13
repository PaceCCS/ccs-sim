import PipeSeg from './pipeSeg';
import Fluid, { defaultFluidConstructor } from './fluid';
import IElement, { IPhysicalElement, PressureSolution } from './element';
import Transport from './transport';
import {
  Pressure,
  PressureUnits,
  Flowrate,
  FlowrateUnits,
} from 'physical-quantities';
export default class Splitter extends Transport {
  source: PipeSeg;
  destinations: IElement[] = [];

  constructor(name: string, physical: IPhysicalElement, source: PipeSeg) {
    super(name, physical, 'Splitter');
    this.source = source;

    this.source.setDestination(this);
  }

  addDestination(dest: IElement) {
    if (dest.physical.elevation !== this.physical.elevation)
      throw new Error(
        'Destination elevation does not match splitter elevation',
      );
    this.destinations.push(dest);
    dest.source = this;
  }

  setDestinations(destinations: IElement[]) {
    destinations.forEach((d) => this.addDestination(d));
  }

  async applyFlowrate(
    branch: number,
    flowrate: Flowrate,
  ): Promise<PressureSolution> {
    if (!this.fluid) {
      throw new Error(
        'Splitter has no fluid - unable to calculate end pressure',
      );
    }

    const newFluid = await defaultFluidConstructor(
      this.fluid.pressure,
      this.fluid.temperature,
      flowrate,
    );

    return this.destinations[branch].process(newFluid);
  }

  async searchBranchFlowrate(branch: number, fluid: Fluid) {
    if (!fluid) {
      throw new Error(
        'Splitter has no fluid - unable to calculate end pressure',
      );
    }
    let low = 0;
    let high = fluid.flowrate.kgps;
    let mid = 0;

    let guesses = 0;
    const maxGuesses = 25;

    let pressureSolution = PressureSolution.Low;

    while (pressureSolution !== PressureSolution.Ok) {
      if (guesses++ > maxGuesses - 1) {
        break;
      }

      mid = (low + high) / 2;

      if (mid >= fluid.flowrate.kgps * 0.9) {
        return { flowrate: mid, pressureSolution };
      }

      if (mid <= new Flowrate(0.001, FlowrateUnits.Kgps).kgps) {
        return { flowrate: mid, pressureSolution: PressureSolution.Low };
      }

      pressureSolution = await this.applyFlowrate(
        branch,
        new Flowrate(mid, FlowrateUnits.Kgps),
      );
      if (pressureSolution === PressureSolution.Low) {
        high = mid;
      } else if (pressureSolution === PressureSolution.High) {
        low = mid;
      }
    }

    return { flowrate: mid, pressureSolution };
  }

  async process(fluid: Fluid): Promise<PressureSolution> {
    this.fluid = fluid;

    const lowPressureLimit = new Pressure(1000, PressureUnits.Pascal).pascal;
    if (this.fluid.pressure.pascal < lowPressureLimit)
      return PressureSolution.Low;

    const newFluid = await defaultFluidConstructor(
      this.fluid.pressure,
      this.fluid.temperature,
      this.fluid.flowrate,
    );

    for (let i = 0; i < this.destinations.length - 1; i++) {
      const { flowrate, pressureSolution } = await this.searchBranchFlowrate(
        i,
        newFluid,
      );

      if (pressureSolution !== PressureSolution.Ok) {
        return pressureSolution;
      }
      newFluid.flowrate = new Flowrate(
        newFluid.flowrate.kgps - flowrate,
        FlowrateUnits.Kgps,
      );
    }

    const lastSearchResult = await this.applyFlowrate(
      this.destinations.length - 1,
      newFluid.flowrate,
    );
    return lastSearchResult;
  }
}
