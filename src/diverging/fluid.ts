import { Pressure, Temperature, Flowrate } from 'physical-quantities';
import { FluidDataFileReader } from './fluidDataFileReader';
import FluidProperties from './fluidProperties';
import { PhaseEnvelopeFileReader } from './phaseEnvelopeFileReader';

export default class Fluid {
  pressure: Pressure;
  temperature: Temperature;
  flowrate: Flowrate;
  viscosity: number;
  density: number;
  enthalpy: number;
  entropy: number;

  constructor(
    pressure: Pressure,
    temperature: Temperature,
    flowrate: Flowrate,
    density: number,
    viscosity: number,
    enthalpy: number,
    entropy: number,
  ) {
    this.pressure = pressure;
    this.temperature = temperature;
    this.flowrate = flowrate;
    this.density = density;
    this.viscosity = viscosity;
    this.enthalpy = enthalpy;
    this.entropy = entropy;
  }
}

export const createNewFluidConstructorFromLocalFiles = (
  phaseFilePath: string = `${__dirname}/phaseEnvelope.csv`,
  fluidFilePath: string = `${__dirname}/co2lookup.csv`,
) => {
  const phaseData = new PhaseEnvelopeFileReader(phaseFilePath);
  const fluidData = new FluidDataFileReader(fluidFilePath);

  const properties = new FluidProperties(phaseData, fluidData);

  return async (
    pressure: Pressure,
    temperature: Temperature,
    flowrate: Flowrate,
  ) => {
    const [density, viscosity, enthalpy, entropy] = [
      await properties.density(pressure, temperature),
      await properties.viscosity(pressure, temperature),
      await properties.enthalpy(pressure, temperature),
      await properties.entropy(pressure, temperature),
    ];

    return new Fluid(
      pressure,
      temperature,
      flowrate,
      density,
      viscosity,
      enthalpy,
      entropy,
    );
  };
};

export const defaultFluidConstructor =
  createNewFluidConstructorFromLocalFiles();
