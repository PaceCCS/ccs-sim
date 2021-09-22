import { Pressure, Temperature, TemperatureUnits } from 'physical-quantities';
import Fluid from './fluid';
import { IPhysicalElement, PressureSolution } from './element';
import Transport from './transport';
import binaryTargetSearch from '../utils/binaryTargetSearch';
import { defaultFluidConstructor } from './fluid';

export default class PressureChanger extends Transport {
  outputPressure: Pressure;

  constructor(
    name: string,
    physical: IPhysicalElement,
    outputPressure: Pressure,
  ) {
    super(name, physical, 'PressureChanger');
    this.outputPressure = outputPressure;
  }

  async getNewFluid() {
    if (!this.fluid) {
      throw new Error(`No incoming fluid`);
    }

    const enthalpyTarget = this.fluid!.enthalpy;

    const minT = -50;
    const maxT = 200;

    let fluid: Fluid;

    const testTemp = async (temp: number) => {
      fluid = await defaultFluidConstructor(
        this.outputPressure,
        new Temperature(temp, TemperatureUnits.Celsius),
        this.fluid!.flowrate,
      );
      return fluid.enthalpy;
    };

    await binaryTargetSearch(
      { min: minT, max: maxT },
      enthalpyTarget,
      2,
      testTemp,
    );

    return fluid!;
  }

  async process(fluid: Fluid): Promise<PressureSolution> {
    return PressureSolution.Ok;
  }
}
