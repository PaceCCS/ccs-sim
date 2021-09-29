import Fluid from './fluid';
import IElement, { IPhysicalElement, PressureSolution } from './element';
import { Pressure } from 'physical-quantities';

interface ITransport extends IElement {
  name: string;
  process(fluid: Fluid): Promise<{
    pressureSolution: PressureSolution;
    pressure: Pressure;
    target: null | Pressure;
  }>;
}

export default abstract class Transport implements ITransport {
  name: string;
  physical: IPhysicalElement;
  type: string;
  fluid?: Fluid;
  source?: IElement;
  destination?: IElement;

  constructor(name: string, physical: IPhysicalElement, type: string) {
    this.name = name;
    this.physical = physical;
    this.type = type;
  }

  abstract process(fluid: Fluid): Promise<{
    pressureSolution: PressureSolution;
    pressure: Pressure;
    target: null | Pressure;
  }>;
}
