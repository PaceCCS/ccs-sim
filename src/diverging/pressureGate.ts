import Fluid from './fluid';
import IElement, { IPhysicalElement, PressureSolution } from './element';
import Transport from './transport';
import { defaultFluidConstructor } from './fluid';
import { Pressure, PressureUnits } from 'physical-quantities';

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

      pressureSolution = await this.destination.process(
        await defaultFluidConstructor(
          new Pressure(mid, PressureUnits.Pascal),
          this.fluid.temperature,
          this.fluid.flowrate,
        ),
      );

      if (pressureSolution === PressureSolution.Low) {
        low = mid;
      } else if (pressureSolution === PressureSolution.High) {
        high = mid;
      }
    }

    return pressureSolution;
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
      return await this.searchPressure();
    })();
  }
}
