import Fluid from './fluid';
import IElement, { IPhysicalElement, PressureSolution } from './element';

interface ITransport extends IElement {
  name: string;
  process(fluid: Fluid): Promise<PressureSolution>;
}

export default abstract class Transport implements ITransport {
  name: string;
  physical: IPhysicalElement;
  type: string;

  constructor(name: string, physical: IPhysicalElement, type: string) {
    this.name = name;
    this.physical = physical;
    this.type = type;
  }

  abstract process(fluid: Fluid): Promise<PressureSolution>;
}
