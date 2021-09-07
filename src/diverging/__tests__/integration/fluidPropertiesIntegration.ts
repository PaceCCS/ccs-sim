import FluidProperties, { Phase } from '../../fluidProperties';
import { PhaseEnvelopeFileReader } from '../../phaseEnvelopeFileReader';
import { FluidDataFileReader } from '../../fluidDataFileReader';
import {
	Pressure,
	PressureUnits,
	Temperature,
	TemperatureUnits,
} from 'physical-quantities';

describe('FluidProperties reads and processes a input files', () => {
	const phaseFileReader = new PhaseEnvelopeFileReader(
		`${__dirname}/phaseEnvelope.csv`
	);
	const fluidFileReader = new FluidDataFileReader(`${__dirname}/co2lookup.csv`);
	const fluidProperties = new FluidProperties(phaseFileReader, fluidFileReader);

	it('should read data from an input file and return the phase', async () => {
		return await fluidProperties
			.phase(
				new Pressure(10, PressureUnits.Bara),
				new Temperature(10, TemperatureUnits.Celsius)
			)
			.then((phase) => {
				expect(phase).toBe(Phase.Gas);
			});
	});

	it('should read data from an input file and return the viscosity for the appropriate phase', async () => {
		const interpolatedVisc = 0.000014553935999921351;

		return await fluidProperties
			.viscosity(
				new Pressure(1000, PressureUnits.Pascal),
				new Temperature(10, TemperatureUnits.Celsius)
			)
			.then((visc) => {
				expect(visc).toBe(interpolatedVisc);
			});
	});

	it('should read data from an input file and return the density for the appropriate phase', async () => {
		const interpolatedDensity = 0.018358316960103916;

		return await fluidProperties
			.density(
				new Pressure(1000, PressureUnits.Pascal),
				new Temperature(10, TemperatureUnits.Celsius)
			)
			.then((dens) => {
				expect(dens).toBe(interpolatedDensity);
			});
	});

	it('should read data from an input file and return the enthalpy', async () => {
		const interpolatedEnth = -29102.79580725744;

		return await fluidProperties
			.enthalpy(
				new Pressure(2e6, PressureUnits.Pascal),
				new Temperature(15, TemperatureUnits.Celsius)
			)
			.then((enth) => {
				expect(enth).toBe(interpolatedEnth);
			});
	});
});
