export type FluidDatum = [
  PT: number,
  TM: number,
  HG: number,
  VISG: number,
  VISHL: number,
  ROG: number,
  ROHL: number,
];

export default class FluidData {
  data: FluidDatum[];
  uniquePressures: number[] = [];
  groupedByPressure: { [PT: number]: FluidDatum[] } = {};

  constructor(data: FluidDatum[]) {
    this.data = data;
    data.forEach((datum) => {
      if (!this.groupedByPressure[datum[0]]) {
        this.groupedByPressure[datum[0]] = [];
      }
      this.groupedByPressure[datum[0]].push(datum);

      if (!this.uniquePressures.includes(Number(datum[0]))) {
        this.uniquePressures.push(Number(datum[0]));
      }
    });
  }
}
