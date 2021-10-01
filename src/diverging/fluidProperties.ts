import IPhaseEnvelopeFileReader from './phaseEnvelopeFileReader';
import { Pressure, Temperature } from 'physical-quantities';
import IFluidPropertiesFileReader from './fluidDataFileReader';
import boundarySearch from '../utils/boundarySearch';
import FluidData, { FluidDatum } from './fluidData';
import PhaseData, { PhaseDatum } from './phaseData';

type xyDatumPoints = {
  x0y0: FluidDatum;
  x0y1: FluidDatum;
  x1y0: FluidDatum;
  x1y1: FluidDatum;
};
type xyKey = 'x0y0' | 'x0y1' | 'x1y0' | 'x1y1';
type xyNumberPoints = {
  x0y0: number;
  x0y1: number;
  x1y0: number;
  x1y1: number;
};
type ptWeights = {
  TM: {
    lowPT: {
      up: number;
      down: number;
    };
    highPT: {
      up: number;
      down: number;
    };
  };
  PT: {
    up: number;
    down: number;
  };
};

function mapSearchPointsToValues(searchPoints: xyDatumPoints, colIdx: number) {
  return Object.keys(searchPoints).reduce((acc, key) => {
    acc[key as xyKey] = searchPoints[key as xyKey][colIdx];
    return acc;
  }, {} as xyNumberPoints);
}

function ptWeightedAverage(points: xyNumberPoints, weights: ptWeights) {
  const x0avg =
    weights.TM.lowPT.down * points.x0y0 + weights.TM.lowPT.up * points.x0y1;
  const x1avg =
    weights.TM.highPT.down * points.x1y0 + weights.TM.highPT.up * points.x1y1;

  const avg = weights.PT.down * x0avg + weights.PT.up * x1avg;

  return avg;
}

function selectValuesAndAverage(
  searchPoints: xyDatumPoints,
  colIdx: number,
  weights: ptWeights,
) {
  return ptWeightedAverage(
    mapSearchPointsToValues(searchPoints, colIdx),
    weights,
  );
}
export default class FluidProperties {
  phaseData: Promise<PhaseData>;
  fluidData: Promise<FluidData>;
  fluidPressures: number[] = [];

  constructor(
    phaseData: IPhaseEnvelopeFileReader,
    fluidData: IFluidPropertiesFileReader,
  ) {
    this.phaseData = phaseData.readPhaseEnvelope();
    this.fluidData = fluidData.readFluidProperties();
  }

  async phase(pressure: Pressure, temperature: Temperature) {
    if (!(pressure instanceof Pressure)) {
      throw new Error('Not a prsesure');
    }
    const data = await this.phaseData;
    if (!data.data.length) {
      throw new Error('No data');
    }
    const rightIdx = data.data.findIndex(
      (point) => point[0] > temperature.celsius,
    );
    if (rightIdx <= 0) {
      const dewPressures = data.data.map((point) => point[1]);
      const maxDewPressure = Math.max(...dewPressures);
      if (maxDewPressure > pressure.pascal) {
        return Phase.Gas;
      }

      throw new Error('Out of range');
    }
    const leftIdx = rightIdx - 1;
    const [left, right] = [data.data[leftIdx], data.data[rightIdx]];

    const xInterval = right[0] - left[0];
    const distFromLeft = temperature.celsius - left[0];
    const fractionBetween = distFromLeft / xInterval;

    const interpolatePoints = (
      leftPoint: PhaseDatum,
      rightPoint: PhaseDatum,
      n: number,
    ): number => {
      const yInterval = rightPoint[n] - leftPoint[n];
      const gain = fractionBetween * yInterval;
      return leftPoint[n] + gain;
    };

    const [bubblePressure, dewPressure] = [1, 2].map((i) =>
      interpolatePoints(left, right, i),
    );

    const aboveBubble = pressure.pascal > bubblePressure;
    const aboveDew = pressure.pascal > dewPressure;

    if (aboveBubble) {
      return Phase.Liquid;
    }
    if (aboveDew) {
      return Phase.TwoPhase;
    }
    return Phase.Gas;
  }

  async searchNearbyPoints(pressure: Pressure, temperature: Temperature) {
    const fluidData = await this.fluidData;

    const pressureSearchResult = boundarySearch(
      fluidData.uniquePressures,
      pressure.pascal,
    );

    const rows = {
      highPressure:
        fluidData.groupedByPressure[pressureSearchResult.result.high],
      lowPressure: fluidData.groupedByPressure[pressureSearchResult.result.low],
    };

    const listTemperatures = (list: FluidDatum[]) => list.map((row) => row[1]);

    const temps = {
      highPressure: listTemperatures(rows.highPressure),
      lowPressure: listTemperatures(rows.lowPressure),
    };

    const tempSearchResult = {
      highPT: boundarySearch(temps.highPressure, temperature.celsius),
      lowPT: boundarySearch(temps.lowPressure, temperature.celsius),
    };

    const points = {
      x0y0: rows.lowPressure[tempSearchResult.lowPT.idx.low],
      x0y1: rows.lowPressure[tempSearchResult.lowPT.idx.high],
      x1y0: rows.highPressure[tempSearchResult.lowPT.idx.low],
      x1y1: rows.highPressure[tempSearchResult.lowPT.idx.high],
    };

    const weights: ptWeights = {
      TM: {
        lowPT: {
          up: tempSearchResult.lowPT.weights.high || 0.5,
          down: tempSearchResult.lowPT.weights.low || 0.5,
        },
        highPT: {
          up: tempSearchResult.highPT.weights.high || 0.5,
          down: tempSearchResult.highPT.weights.low || 0.5,
        },
      },
      PT: {
        up: pressureSearchResult.weights.high || 0.5,
        down: pressureSearchResult.weights.low || 0.5,
      },
    };

    return {
      points,
      weights,
    };
  }

  async density(pressure: Pressure, temperature: Temperature) {
    let phase = await this.phase(pressure, temperature);
    if (phase === Phase.TwoPhase) {
      // throw new Error('Fluid is two-phase')
      phase = Phase.Gas;
    }
    let colIdx;
    if (phase === Phase.Gas) colIdx = 5;
    if (phase === Phase.Liquid) colIdx = 6;

    if (!colIdx) colIdx = 5;

    const { points, weights } = await this.searchNearbyPoints(
      pressure,
      temperature,
    );

    return selectValuesAndAverage(points, colIdx, weights);
  }

  async viscosity(pressure: Pressure, temperature: Temperature) {
    let phase = await this.phase(pressure, temperature);

    if (phase === Phase.TwoPhase) {
      // throw new Error('Fluid is two-phase')
      phase = Phase.Gas;
    }

    let colIdx;

    if (phase === Phase.Gas) colIdx = 3;
    if (phase === Phase.Liquid) colIdx = 4;

    if (!colIdx) colIdx = 3;

    const { points, weights } = await this.searchNearbyPoints(
      pressure,
      temperature,
    );

    return selectValuesAndAverage(points, colIdx, weights);
  }

  async enthalpy(pressure: Pressure, temperature: Temperature) {
    const colIdx = 2;
    const { points, weights } = await this.searchNearbyPoints(
      pressure,
      temperature,
    );

    return selectValuesAndAverage(points, colIdx, weights);
  }
  async entropy(pressure: Pressure, temperature: Temperature) {
    let phase = await this.phase(pressure, temperature);

    if (phase === Phase.TwoPhase) {
      // throw new Error('Fluid is two-phase')
      phase = Phase.Gas;
    }

    let colIdx;

    if (phase === Phase.Gas) colIdx = 7;
    if (phase === Phase.Liquid) colIdx = 8;

    if (!colIdx) colIdx = 7;

    const { points, weights } = await this.searchNearbyPoints(
      pressure,
      temperature,
    );

    return selectValuesAndAverage(points, colIdx, weights);
  }
}

export enum Phase {
  Gas,
  Liquid,
  TwoPhase,
}
