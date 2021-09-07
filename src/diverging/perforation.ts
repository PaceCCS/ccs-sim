import { IPhysicalElement } from './element';
import Analogue from './analogue';
import Reservoir, { RealReservoir } from './reservoir';
import Well from './well';

const perforationFunctions = {
  [RealReservoir.Hamilton]: {
    split: 4,
    intercept: -1.6137583306682473,
    powers: [
      [1, 0],
      [0, 1],
      [2, 0],
      [1, 1],
      [0, 2],
    ],
    coefficients: [
      -5.31124455e-2, 1.00818995, 1.48023509e-4, 4.18609179e-4, 3.00308213e-6,
    ],
  },
  [RealReservoir.HamiltonNorth]: {
    split: 2,
    intercept: -1.9597510728900147,
    powers: [
      [1, 0],
      [0, 1],
      [2, 0],
      [1, 1],
      [0, 2],
    ],
    coefficients: [
      -1.4969207e-1, 1.06629533, -2.80472165e-5, 1.40749378e-3, -5.39246727e-4,
    ],
  },
  [RealReservoir.Lennox]: {
    split: 2,
    intercept: -0.5620851518695815,
    powers: [
      [1, 0],
      [0, 1],
      [2, 0],
      [1, 1],
      [0, 2],
    ],
    coefficients: [
      -6.23044797e-3, 1.00131251, -2.09522684e-5, 7.52686842e-5, 1.19926497e-5,
    ],
  },
};

export default class Perforation extends Analogue {
  source?: Well;
  destination: Reservoir | null;

  constructor(
    name: string,
    physical: IPhysicalElement,
    realReservoir: RealReservoir,
  ) {
    super(name, physical, 'Well', perforationFunctions[realReservoir]);
    this.destination = null;
  }

  get x() {
    if (!this.fluid) {
      throw new Error(`${this.type} has no fluid`);
    }

    return this.fluid.flowrate.kgps / this.modelFunction.split;
  }

  setDestination(dest: Reservoir) {
    this.destination = dest;
    dest.source = this;
  }
}
