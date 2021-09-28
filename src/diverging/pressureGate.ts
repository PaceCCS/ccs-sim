import Fluid from './fluid';
import IElement, { IPhysicalElement, PressureSolution } from './element';
import Transport from './transport';
import { defaultFluidConstructor } from './fluid';
import { Pressure, PressureUnits } from 'physical-quantities';

export default class PressureGate extends Transport {
  inputPressure: Pressure;

  constructor(
    name: string,
    physical: IPhysicalElement,
    inputPressure: Pressure,
  ) {
    super(name, physical, 'PressureGate');
    this.inputPressure = inputPressure;
  }

  setDestination(dest: IElement): void {
    this.destination = dest;
    dest.source = this;
  }

  async searchPressure() {
    if (!this.fluid) {
      throw new Error(`No fluid`);
    }
    if (!this.destination) {
      throw new Error(`No destination`);
    }
    const lowLimit = new Pressure(1, PressureUnits.Bara);
    const highLimit = this.fluid.pressure;

    let low = lowLimit.pascal;
    let high = highLimit.pascal;
    let mid = 0;

    let guesses = 0;
    const maxGuesses = 25;

    let pressureSolution = PressureSolution.Low;

    while (pressureSolution !== PressureSolution.Ok) {
      if (guesses++ > maxGuesses - 1) {
        break;
      }

      mid = (low + high) / 2;

      pressureSolution = (
        await this.destination.process(
          await defaultFluidConstructor(
            new Pressure(mid, PressureUnits.Pascal),
            this.fluid.temperature,
            this.fluid.flowrate,
          ),
        )
      ).pressureSolution;

      if (pressureSolution === PressureSolution.Low) {
        low = mid;
      } else if (pressureSolution === PressureSolution.High) {
        high = mid;
      }
    }

    return pressureSolution;
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

    if (!this.destination)
      return {
        pressureSolution: PressureSolution.Ok,
        pressure: this.fluid.pressure,
        target: null,
      };

    const lower = this.inputPressure.pascal * 0.99;

    if (fluid.pressure.pascal < lower) {
      return {
        pressureSolution: PressureSolution.Low,
        pressure: fluid.pressure,
        target: null,
      };
    }

    const searchPResult = await this.searchPressure();
    return {
      pressureSolution: searchPResult,
      pressure: fluid.pressure,
      target: null,
    };
  }
}
