import { Pressure, Temperature, TemperatureUnits } from 'physical-quantities';
import Fluid from './fluid';
import IElement, { IPhysicalElement, PressureSolution } from './element';
import Transport from './transport';
import binaryTargetSearch from '../utils/binaryTargetSearch';
import { defaultFluidConstructor } from './fluid';

export default class Compressor extends Transport {
  outputPressure: Pressure;
  isentropicEfficiency = 0.7;
  idealWork = 0;
  actualWork = 0;
  outletEnthalpy = 0;

  constructor(
    name: string,
    physical: IPhysicalElement,
    outputPressure: Pressure,
  ) {
    super(name, physical, 'PressureChanger');
    this.outputPressure = outputPressure;
  }

  setDestination(dest: IElement): void {
    this.destination = dest;
    dest.source = this;
  }

  async getNewFluid() {
    if (!this.fluid) {
      throw new Error(`No incoming fluid`);
    }

    const entropyTarget = this.fluid.entropy;

    const minT = -50;
    const maxT = 200;

    let fluid: Fluid;

    const testTempIdeal = async (temp: number) => {
      fluid = await defaultFluidConstructor(
        this.outputPressure,
        new Temperature(temp, TemperatureUnits.Celsius),
        this.fluid!.flowrate,
      );
      return fluid.entropy;
    };

    await binaryTargetSearch(
      { min: minT, max: maxT },
      entropyTarget,
      2,
      testTempIdeal,
    );

    this.idealWork = fluid!.enthalpy - this.fluid.enthalpy;
    this.actualWork = this.idealWork / this.isentropicEfficiency;
    this.outletEnthalpy = this.fluid.enthalpy + this.actualWork;

    const testTempActual = async (temp: number) => {
      fluid = await defaultFluidConstructor(
        this.outputPressure,
        new Temperature(temp, TemperatureUnits.Celsius),
        this.fluid!.flowrate,
      );
      return fluid.enthalpy;
    };

    await binaryTargetSearch(
      { min: minT, max: maxT },
      this.outletEnthalpy,
      2,
      testTempActual,
    );

    if (fluid!.temperature.celsius > 120) {
      throw new Error(
        `Fluid temperature is greater than 120°C: ${
          fluid!.temperature.celsius
        }°C`,
      );
    }

    return fluid!;
  }

  async process(fluid: Fluid): Promise<{
    pressureSolution: PressureSolution;
    pressure: Pressure;
    target: null | Pressure;
  }> {
    this.fluid = fluid;

    if (!this.destination)
      return {
        pressureSolution: PressureSolution.Ok,
        pressure: this.fluid.pressure,
        target: null,
      };

    const newFluid = await this.getNewFluid();

    return await this.destination.process(newFluid);
  }
}
