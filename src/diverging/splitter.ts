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
import { Reservoir } from '.';
export default class Splitter extends Transport {
  destinations: IElement[] = [];

  constructor(name: string, physical: IPhysicalElement, source: PipeSeg) {
    super(name, physical, 'Splitter');
    this.source = source;

    (this.source as PipeSeg).setDestination(this);
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
  ): Promise<{
    pressureSolution: PressureSolution;
    pressure: Pressure;
    target: null | Pressure;
  }> {
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

    const calculatedPressureBoundaries = {
      highFlowrate: (await this.applyFlowrate(branch, fluid.flowrate)).pressure
        .bara,
      lowFlowrate: (
        await this.applyFlowrate(branch, new Flowrate(0, FlowrateUnits.Kgps))
      ).pressure.bara,
    };

    const target = await this.getBranchTarget(branch, fluid);
    if (!target) {
      throw new Error(`Unable to find target pressure for branch ${branch}`);
    }

    let guesses = 0;
    const maxGuesses = 25;

    let pressureSolution = PressureSolution.Low;

    while (pressureSolution !== PressureSolution.Ok) {
      if (guesses++ > maxGuesses - 1) {
        break;
      }

      mid =
        low +
        ((high - low) /
          (calculatedPressureBoundaries.highFlowrate -
            calculatedPressureBoundaries.lowFlowrate)) *
          (target.target.bara - calculatedPressureBoundaries.lowFlowrate);

      if (mid >= fluid.flowrate.kgps * 0.9) {
        return { flowrate: mid, pressureSolution };
      }

      if (mid <= new Flowrate(0.001, FlowrateUnits.Kgps).kgps) {
        return { flowrate: mid, pressureSolution: PressureSolution.Low };
      }

      pressureSolution = (
        await this.applyFlowrate(branch, new Flowrate(mid, FlowrateUnits.Kgps))
      ).pressureSolution;

      if (pressureSolution === PressureSolution.Low) {
        high = mid;
      } else if (pressureSolution === PressureSolution.High) {
        low = mid;
      }
    }

    return { flowrate: mid, pressureSolution };
  }

  async getBranchTarget(branchNum: number, fluid: Fluid) {
    let low = 0;
    let high = fluid.flowrate.kgps;
    let mid = 0;
    let pressureSolution = PressureSolution.Low;

    let guesses = 0;
    const maxGuesses = 25;

    while (pressureSolution !== PressureSolution.Ok) {
      if (guesses++ > maxGuesses - 1) {
        break;
      }

      const {
        pressureSolution: pSol,
        pressure,
        target,
      } = await this.applyFlowrate(
        branchNum,
        new Flowrate(mid, FlowrateUnits.Kgps),
      );

      if (target) return { pressureSolution: pSol, pressure, target };

      mid = (low + high) / 2;

      pressureSolution = pSol;

      if (pressureSolution === PressureSolution.Low) {
        high = mid;
      } else if (pressureSolution === PressureSolution.High) {
        low = mid;
      }
    }
  }

  async process(fluid: Fluid): Promise<{
    pressureSolution: PressureSolution;
    pressure: Pressure;
    target: null | Pressure;
  }> {
    this.fluid = fluid;

    const lowPressureLimit = new Pressure(1000, PressureUnits.Pascal).pascal;
    if (this.fluid.pressure.pascal < lowPressureLimit)
      return {
        pressureSolution: PressureSolution.Low,
        pressure: this.fluid.pressure,
        target: null,
      };

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
        return {
          pressureSolution,
          pressure: this.fluid.pressure,
          target: null,
        };
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
