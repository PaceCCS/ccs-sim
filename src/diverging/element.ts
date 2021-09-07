import Fluid from './fluid';

export default interface IElement {
  physical: IPhysicalElement;
  name: string;
  type: string;
  source?: IElement;
  // Returns pressure delta between end and passed
  process(fluid: Fluid): Promise<PressureSolution>;
}

export interface IPhysicalElement {
  elevation: number;
}

export enum PressureSolution {
  High,
  Low,
  Ok,
}
