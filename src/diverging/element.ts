import Fluid from './fluid';
import { Pressure } from 'physical-quantities';
export default interface IElement {
  physical: IPhysicalElement;
  name: string;
  type: string;
  source?: IElement;
  // Returns pressure delta between end and passed
  process(fluid: Fluid): Promise<{
    pressureSolution: PressureSolution;
    pressure: Pressure;
    target: null | Pressure;
  }>;
}

export interface IPhysicalElement {
  elevation: number;
}

export enum PressureSolution {
  High,
  Low,
  Ok,
}
