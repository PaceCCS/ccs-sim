import { IPhysicalElement } from './element';
import Analogue from './analogue';
import { RealReservoir } from './reservoir';
import PipeSeg from './pipeSeg';
import IElement from './element';

const wellFunctions = {
  [RealReservoir.Hamilton]: {
    split: 4,
    intercept: -20.31516015999359,
    powers: [
      [1, 0],
      [0, 1],
      [2, 0],
      [1, 1],
      [0, 2],
    ],
    coefficients: [
      -0.37894667, 1.72349699, 0.01190302, -0.00793804, 0.00318551,
    ],
  },
  [RealReservoir.HamiltonNorth]: {
    split: 2,
    intercept: 11.32919867985288,
    powers: [
      [1, 0],
      [0, 1],
      [2, 0],
      [1, 1],
      [0, 2],
    ],
    coefficients: [-1.13430676, 0.80762331, 0.02455265, -0.0025288, 0.01129731],
  },
  [RealReservoir.Lennox]: {
    split: 2,
    intercept: 37.42144930263483,
    powers: [
      [1, 0],
      [0, 1],
      [2, 0],
      [1, 1],
      [0, 2],
    ],
    coefficients: [-0.6367235, -0.55748098, 0.00104096, 0.0142587, 0.01755446],
  },
};

export default class Well extends Analogue {
  destination: IElement | null;

  constructor(
    name: string,
    physical: IPhysicalElement,
    realWell: RealReservoir,
  ) {
    super(name, physical, 'Well', wellFunctions[realWell]);
    this.destination = null;
  }

  get x() {
    if (!this.fluid) {
      throw new Error(`${this.type} has no fluid`);
    }

    return this.fluid.flowrate.kgps / this.modelFunction.split;
  }

  setDestination(dest: IElement) {
    this.destination = dest;
    dest.source = this;
  }
}
