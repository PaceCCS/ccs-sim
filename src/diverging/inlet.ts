import Fluid from './fluid';
import IElement, { IPhysicalElement, PressureSolution } from './element';
import Transport from './transport';
import { defaultFluidConstructor } from './fluid';
import {
	Pressure,
	PressureUnits,
	Temperature,
	TemperatureUnits,
	Flowrate,
	FlowrateUnits,
} from 'physical-quantities';

// const fs = require('fs');

// const stream = fs.createWriteStream(`${__dirname}/inletP.txt`, {
// 	flags: 'a',
// });

export default class Inlet extends Transport {
	fluid: Fluid | null;
	destination: IElement | null;
	temperature: Temperature = new Temperature(10, TemperatureUnits.Kelvin);

	constructor(name: string, physical: IPhysicalElement) {
		super(name, physical, 'Inlet');

		this.fluid = null;
		this.destination = null;
	}

	async applyInletProperties(
		pressure: Pressure,
		temperature: Temperature,
		flowrate: Flowrate,
		skipProcess = false
	) {
		const newFluid = await defaultFluidConstructor(
			pressure,
			temperature,
			flowrate
		);

		this.fluid = newFluid;
		this.temperature = this.fluid.temperature;

		if (skipProcess) return;
		return this.process(this.fluid);
	}

	async searchInletPressure() {
		const lowLimit = new Pressure(1, PressureUnits.Bara);
		const highLimit = new Pressure(140, PressureUnits.Bara);

		let low = lowLimit.pascal;
		let high = highLimit.pascal;
		let mid = 0;

		let guesses = 0;
		const maxGuesses = 30;

		let pressureSolution = PressureSolution.Low;

		if (!this.fluid) {
			throw new Error(`Inlet has no fluid`);
		}

		while (pressureSolution !== PressureSolution.Ok) {
			if (guesses++ > maxGuesses - 1) {
				console.log(`max guesses (${maxGuesses}) reached`);
				break;
			}

			mid = (low + high) / 2;

			// stream.write(
			// 	`${this.type} - ${this.name} GUESS ${guesses}:\n${
			// 		new Pressure(mid, PressureUnits.Pascal).bara
			// 	} Bara\n${this.fluid.flowrate.kgps} kg/s\n\n`
			// );

			pressureSolution = (await this.applyInletProperties(
				new Pressure(mid, PressureUnits.Pascal),
				this.temperature,
				this.fluid.flowrate
			)) as PressureSolution;

			if (pressureSolution === PressureSolution.Low) {
				low = mid;
			} else if (pressureSolution === PressureSolution.High) {
				high = mid;
			}
		}

		return {
			pressure: new Pressure(mid, PressureUnits.Pascal),
			pressureSolution,
		};
	}

	setDestination(dest: IElement) {
		this.destination = dest;
		dest.source = this;
	}

	async process(fluid: Fluid): Promise<PressureSolution> {
		if (!this.destination) return PressureSolution.Ok;

		return await this.destination.process(fluid);
	}
}
