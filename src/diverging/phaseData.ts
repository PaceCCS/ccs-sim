export type PhaseDatum = [temp: number, bubble: number, dew: number];

export default class PhaseData {
  data: PhaseDatum[];

  constructor(data: PhaseDatum[]) {
    this.data = data;
  }
}
