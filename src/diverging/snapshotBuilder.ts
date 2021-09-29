import IElement, { IPhysicalElement } from './element';
import Inlet from './inlet';
import PipeSeg, { IPipeDefinition } from './pipeSeg';
import Splitter from './splitter';
import Reservoir, { RealReservoir } from './reservoir';
import Well from './well';
import Perforation from './perforation';
import Fluid, { defaultFluidConstructor } from './fluid';
import {
  Pressure,
  PressureUnits,
  Temperature,
  TemperatureUnits,
  Flowrate,
  FlowrateUnits,
} from 'physical-quantities';
import Valve from './valve';

export default class SnapshotBuilder {
  elements: IElement[] = [];
  keyPoints: IElement[] = [];
  splitters: Splitter[] = [];
  selectedSplitter?: Splitter;
  previousElem?: IElement;
  fluid?: Fluid;
  constructor() {
    // do nothing
  }

  private set = (elem: IElement, isKey = false) => {
    if (!this.elements.length) {
      if (!(elem instanceof Inlet)) {
        throw new Error(`First element must be inlet`);
      }
    }
    this.previousElem = elem;
    this.elements.push(elem);
    if (elem instanceof Splitter) {
      this.splitters.push(elem);
      this.selectedSplitter = elem;
    }
    if (isKey) {
      this.keyPoints.push(elem);
    }
  };

  addInlet(name: string, physical: IPhysicalElement): SnapshotBuilder {
    const elem = new Inlet(name, physical);
    this.set(elem, true);
    return this;
  }

  addSplitter(name: string, physical: IPhysicalElement): SnapshotBuilder {
    if (!(this.previousElem instanceof PipeSeg)) {
      throw new Error(`Splitter creation must come after pipeseg`);
    }
    const elem = new Splitter(name, physical, this.previousElem);

    this.set(elem, true);
    return this;
  }

  addPipeSeg(
    pipeDef: IPipeDefinition,
    source?: Inlet | PipeSeg | Splitter | Well | Perforation,
  ): SnapshotBuilder {
    const elem = new PipeSeg({ ...pipeDef });

    this.set(elem);

    if (source) {
      if (source instanceof Splitter) {
        source.addDestination(elem);
      } else {
        if (source instanceof Perforation) {
          return this;
        }
        source.setDestination(elem);
      }
    }
    return this;
  }

  addWell(
    name: string,
    physical: IPhysicalElement,
    realReservoirName: 'Hamilton' | 'HamiltonNorth' | 'Lennox',
  ): SnapshotBuilder {
    if (!Object.values(RealReservoir).includes(realReservoirName)) {
      throw new Error(`Unsupported reservoir: ${realReservoirName}`);
    }
    if (
      !(this.previousElem instanceof PipeSeg) &&
      !(this.previousElem instanceof Valve)
    ) {
      throw new Error(`Well creation must come after pipe segment or valve`);
    }
    const well = new Well(name, physical, RealReservoir[realReservoirName]);
    this.previousElem.setDestination(well);

    this.set(well, true);

    const perforation = new Perforation(
      name,
      physical,
      RealReservoir[realReservoirName],
    );

    well.setDestination(perforation);

    this.set(perforation, true);
    return this;
  }

  addValve(name: string, physical: IPhysicalElement, inputPressure: number) {
    if (!(this.previousElem instanceof PipeSeg)) {
      throw new Error(`Valve creation must come after pipe segment `);
    }
    const valve = new Valve(
      name,
      physical,
      new Pressure(inputPressure, PressureUnits.Pascal),
    );
    this.previousElem.setDestination(valve);
    this.set(valve);
    return this;
  }

  addReservoir(
    name: string,
    physical: IPhysicalElement,
    pressure: number,
  ): SnapshotBuilder {
    if (!(this.previousElem instanceof Perforation)) {
      throw new Error(`Reservoir creation must come after well (perforation)`);
    }
    const reservoir = new Reservoir(
      name,
      physical,
      new Pressure(pressure, PressureUnits.Pascal),
    );
    this.previousElem.setDestination(reservoir);

    this.set(reservoir, true);
    return this;
  }

  addPipeSeries(
    n: number,
    pipeDef: IPipeDefinition,
    elevations?: number[],
    lengths?: number[],
  ): SnapshotBuilder {
    elevations = elevations || [];
    lengths = lengths || [];
    for (let i = 0; i < n; i++) {
      if (elevations.length) {
        pipeDef.elevation = elevations[i % elevations.length];
      }
      if (lengths.length) {
        pipeDef.length = lengths[i % lengths.length];
      }
      this.chainAddPipeSeg(pipeDef);
    }
    return this;
  }

  chainAddPipeSeg(pipeDef: IPipeDefinition, from?: Splitter | PipeSeg) {
    if (!this.previousElem || this.previousElem instanceof Reservoir) {
      return this.addPipeSeg(pipeDef);
    }
    if (
      this.previousElem instanceof Inlet ||
      this.previousElem instanceof PipeSeg ||
      this.previousElem instanceof Splitter ||
      this.previousElem instanceof Well ||
      this.previousElem instanceof Perforation
    ) {
      if (from) {
        return this.addPipeSeg(pipeDef, from);
      }
      return this.addPipeSeg(pipeDef, this.previousElem);
    } else {
      throw new Error(`Previous elem cannot have a destination`);
    }
  }

  async setFluid(pressure: number, temperature: number, flowrate: number) {
    this.fluid = await defaultFluidConstructor(
      new Pressure(pressure, PressureUnits.Pascal),
      new Temperature(temperature, TemperatureUnits.Kelvin),
      new Flowrate(flowrate, FlowrateUnits.Kgps),
    );
  }

  selectSplitter(id: number | string): this {
    if (typeof id === 'string') {
      this.selectedSplitter = this.splitters.find(
        (s) => s.name.toLowerCase() === id.toLowerCase(),
      );
    }
    if (typeof id === 'number') {
      if (id < 0 || id >= this.splitters.length) {
        throw new Error(
          `Out of range: splitters exist at positions 0-${this.splitters.length}`,
        );
      }
      this.selectedSplitter = this.splitters[id];
    }
    return this;
  }

  branch(pipeDef: IPipeDefinition): SnapshotBuilder {
    if (!this.selectedSplitter) {
      throw new Error(`No splitter selected to branch from`);
    }
    this.previousElem = this.selectedSplitter;
    return this.chainAddPipeSeg(pipeDef, this.selectedSplitter);
  }
}
