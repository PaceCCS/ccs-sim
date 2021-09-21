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
  ): Promise<{ pressureSolution: PressureSolution; pressure: Pressure }> {
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

  async searchBranchFlowrateWithTarget(branchNum: number, fluid: Fluid) {
    const getTerminalElem = (
      elem: Transport | Reservoir,
    ): Transport | Reservoir => {
      if (elem instanceof Splitter) {
        return getTerminalElem(elem.destinations[elem.destinations.length - 1]);
      }
      if (elem instanceof Reservoir || !elem.destination) {
        return elem;
      }
      return getTerminalElem(elem);
    };

    const branch = this.destinations[branchNum];

    const getReservoir = (): Reservoir | undefined => {
      const reservoir = getTerminalElem(branch) as Transport | Reservoir;
      if (!(reservoir instanceof Reservoir)) return;
      return reservoir;
    };

    const getTarget = (): Pressure => {
      const reservoir = getReservoir();
      if (!reservoir) {
        throw new Error(`No reservoir at the end of branch ${branchNum}`);
      }
      return reservoir.pressure;
    };

    const target = getTarget().bara;
    let low = 0;
    let high = fluid.flowrate.kgps;
    let mid = 0;
    let pressureSolution = PressureSolution.Low;

    let guesses = 0;
    const maxGuesses = 25;

    const prevGuess = {
      high: 0,
      low: high,
    };

    while (pressureSolution !== PressureSolution.Ok) {
      if (guesses++ > maxGuesses - 1) {
        break;
      }
      if (mid >= fluid.flowrate.kgps * 0.9) {
        return { flowrate: mid, pressureSolution };
      }
      if (mid <= new Flowrate(0.001, FlowrateUnits.Kgps).kgps) {
        return { flowrate: mid, pressureSolution: PressureSolution.Low };
      }

      const { pressureSolution: pSol, pressure: p } = await this.applyFlowrate(
        branchNum,
        new Flowrate(mid, FlowrateUnits.Kgps),
      );

      prevGuess.high = Math.max(prevGuess.high, p.bara);
      prevGuess.low = Math.min(prevGuess.low, p.bara);

      mid =
        low +
        Math.floor(
          ((high - low) / (prevGuess.high - prevGuess.low)) *
            (target - prevGuess.low),
        );

      pressureSolution = pSol;

      if (pressureSolution === PressureSolution.Low) {
        high = mid;
      } else if (pressureSolution === PressureSolution.High) {
        low = mid;
      }
    }

    return { flowrate: mid, pressureSolution };
  }

  async process(
    fluid: Fluid,
  ): Promise<{ pressureSolution: PressureSolution; pressure: Pressure }> {
    this.fluid = fluid;

    const lowPressureLimit = new Pressure(1000, PressureUnits.Pascal).pascal;
    if (this.fluid.pressure.pascal < lowPressureLimit)
      return {
        pressureSolution: PressureSolution.Low,
        pressure: this.fluid.pressure,
      };

    const newFluid = await defaultFluidConstructor(
      this.fluid.pressure,
      this.fluid.temperature,
      this.fluid.flowrate,
    );

    for (let i = 0; i < this.destinations.length - 1; i++) {
      const { flowrate, pressureSolution } =
        await this.searchBranchFlowrateWithTarget(i, newFluid);

      if (pressureSolution !== PressureSolution.Ok) {
        return { pressureSolution, pressure: this.fluid.pressure };
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
