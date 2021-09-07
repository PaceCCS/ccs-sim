import Well from '../well';
import Reservoir from '../reservoir';
import { defaultFluidConstructor } from '../fluid';
import {
	Pressure,
	PressureUnits,
	Temperature,
	TemperatureUnits,
	Flowrate,
	FlowrateUnits,
} from 'physical-quantities';
import { RealReservoir } from '../reservoir';
import PipeSeg from '../pipeSeg';

describe('endPressure', () => {
	it('should match the predicted value from python', async () => {
		const fluid = await defaultFluidConstructor(
			new Pressure(60, PressureUnits.Bara),
			new Temperature(300, TemperatureUnits.Kelvin),
			new Flowrate(30 * 4, FlowrateUnits.Kgps) // the well function divides by the number of lines
		);

		const pipe = new PipeSeg({
			name: 'pipe',
			length: 1,
			diameters: [16, 14, 12],
			elevation: 1,
		})
		const well = new Well('HM1', { elevation: 0 }, RealReservoir.Hamilton)
		well.source = pipe
		const reservoir = new Reservoir('Hamilton', { elevation: 0 }, new Pressure(10, PressureUnits.Pascal))
		well.setDestination(reservoir)
		well.process(fluid)

		const predictedValue = new Pressure(7961834.114000641, PressureUnits.Pascal)
			.pascal;

		expect(well.endPressure().pascal).toBeCloseTo(predictedValue)
	})
})
