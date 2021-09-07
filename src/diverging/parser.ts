import fs from 'fs';
import YAML from 'yaml';
import { IPhysicalElement } from './element';
import { IPipeDefinition } from './pipeSeg';
import SnapshotBuilder from './snapshotBuilder';
import Fluid from './fluid';
import Transport from './transport';

const OLGA = {
  parse: (fileString: string) => {
    const lines = fileString.split('\n');
    const linesReversed = lines.slice().reverse();

    const lineThatStartsWith = (
      word: string,
      backwards = false,
    ): [number, string] => {
      const searchArr = backwards ? linesReversed : lines;
      const idx = searchArr.findIndex((line) =>
        line.startsWith(word.toUpperCase()),
      );
      if (idx < 0) {
        throw new Error(`Line not found: ${word}`);
      }
      if (backwards) {
        return [lines.length - idx - 1, linesReversed[idx]];
      }
      return [idx, lines[idx]];
    };
    const lastLineThatStartsWith = (word: string): [number, string] => {
      return lineThatStartsWith(word, true);
    };

    const keyLines = {
      initialConditions: lineThatStartsWith('initialconditions'),
      geometry: lineThatStartsWith('geometry'),
      firstPipe: lineThatStartsWith('pipe'),
      lastPipe: lastLineThatStartsWith('pipe'),
    };

    type IParam =
      | {
          YSTART: (string | number)[];
          LABEL?: string[];
          DIAMETER?: (string | number)[];
          YEND?: (string | number)[];
          XEND?: (string | number)[];
        }
      | {
          YSTART?: undefined;
          LABEL?: string[];
          DIAMETER?: (string | number)[];
          YEND?: (string | number)[];
          XEND?: (string | number)[];
        };

    type IParamKeys = keyof IParam;

    const readLineProperties = (line: string | [number, string]) => {
      if (typeof line !== 'string') {
        line = line[1];
      }
      line = line.replace(/NSEGMENT=\d+,\s/g, '');
      line = line.replace(/LSEGMENT=.+\).+?\s/g, '');

      const [type, parameterStrings] = [
        line.substring(0, line.indexOf(' ')),
        line.substring(line.indexOf(' ')).trim().split(', '),
      ];

      const unitConversion = (valueString: string) => {
        const matchName = valueString.match(/".+?"/);
        if (matchName) {
          return [matchName[0].substring(1, matchName[0].length - 1), '-'];
        }

        const matchNum = valueString.match(/-?[0-9]+\.?[0-9]*/);
        if (matchNum) {
          const numVal = matchNum[0];
          let num = Number(numVal);
          let unitString = valueString.substring(numVal.length).trim();
          switch (unitString) {
            case 'km':
              num = num * 1000;
              unitString = 'm';
              break;
            case 'mm':
              num = num / 1000;
              unitString = 'm';
              break;
          }
          return [Number(num.toFixed(4)), unitString];
        }
        return [null, null];
      };

      const parameters = parameterStrings.reduce(
        (acc, param) => {
          const [property, valueString] = param
            .split('=')
            .map((s) => s.trim()) as [string, string];

          const converted = unitConversion(valueString);

          if (converted[0] || converted[1]) {
            (acc as any)[property as keyof IParam] = converted;
          }
          return acc;
        },
        type === 'GEOMETRY' ? ({ YSTART: [0, 'm'] } as IParam) : {},
      );
      return { type, parameters };
    };

    const INLET = readLineProperties(keyLines.geometry);

    let prevX = 0;
    const getXLength = (lineParams: IParam) => {
      if (!lineParams.XEND) return 0;
      const length = (lineParams.XEND[0] as number) - prevX;
      prevX = lineParams.XEND[0] as number;
      return length;
    };
    const getYGain = (lineParams: IParam) => {
      const elevation = endElevation;
      if (lineParams.YEND) {
        endElevation = lineParams.YEND as [number, string];
      }
      return elevation[0];
    };

    let endElevation = INLET.parameters.YSTART as [number, string];

    const transformProperties = (lineProps: {
      type: string;
      parameters: IParam;
    }) => {
      const params = lineProps.parameters;

      const instructionMap = {
        GEOMETRY: 'inlet',
        PIPE: 'pipeseg',
      };

      type PipeSegInstruction = {
        name: string;
        length: number;
        elevation: number;
        diameters: number[];
      };

      type PipeSeriesInstruction = {
        n: number;
        pipeDef: IPipeDefinition;
        elevations: number[];
        lengths: number[];
      };

      const instructionType: string =
        instructionMap[lineProps.type as 'GEOMETRY' | 'PIPE'];

      const x = getXLength(params);
      const y = getYGain(params);
      const length =
        instructionType === instructionMap.GEOMETRY
          ? 0
          : Math.sqrt(x ** 2 + y ** 2);

      const transformed = {
        [instructionType]: {
          name: (params.LABEL as string[])[0],
          length,
          elevation: y,
          diameters: params.DIAMETER ? [params.DIAMETER[0]] : undefined,
        } as PipeSegInstruction | PipeSeriesInstruction,
      };

      for (const key of Object.keys(transformed[instructionType])) {
        if (
          !transformed[instructionType][
            key as keyof (PipeSegInstruction | PipeSeriesInstruction)
          ] &&
          key !== 'elevation'
        ) {
          delete transformed[instructionType][
            key as keyof (PipeSegInstruction | PipeSeriesInstruction)
          ];
        }
      }

      const maxSegLength = 200;
      const reduceToMaxLengthArr = (len: number) => {
        if (len < maxSegLength) return [len];

        const lengths: number[] = [];

        const sum = () => lengths.reduce((acc, a) => acc + a, 0);
        const remainder = () => len - sum();

        while (remainder() >= maxSegLength) {
          lengths.push(maxSegLength);
        }
        if (remainder()) {
          lengths.push(remainder());
        } else return [maxSegLength];
        return lengths;
      };

      if (
        instructionType === 'pipeseg' &&
        (transformed.pipeseg as PipeSegInstruction).length &&
        (transformed.pipeseg as PipeSegInstruction).length > maxSegLength
      ) {
        const fullLength = (transformed.pipeseg as PipeSegInstruction).length;
        const seriesLengths = reduceToMaxLengthArr(fullLength);

        // Elevation
        let lengthSoFar = 0;
        const startElevation = (transformed.pipeseg as PipeSegInstruction)
          .elevation;
        const elevationIncrease = endElevation[0] - startElevation;
        const elevations = seriesLengths.map((sLength) => {
          const cos = x / length;
          lengthSoFar += cos * sLength;
          const yGain = (elevationIncrease * lengthSoFar) / fullLength;
          return Number((startElevation + yGain).toFixed(4));
        });
        elevations.unshift(startElevation);
        elevations.pop();

        transformed.pipeseries = {
          n: seriesLengths.length,
          pipeDef: {
            name: (transformed.pipeseg as PipeSegInstruction).name,
            length: fullLength,
            elevation: startElevation,
            diameters: [
              ...(transformed.pipeseg as PipeSegInstruction).diameters,
            ],
          },
          elevations,
          lengths: seriesLengths,
        } as PipeSeriesInstruction;

        delete transformed.pipeseg;
      }

      return transformed;
    };

    const pipes = lines
      .slice(keyLines.firstPipe[0], keyLines.lastPipe[0] + 1)
      .map(readLineProperties);

    const data = {
      instructions: [
        transformProperties(INLET),
        ...pipes.map(transformProperties),
      ],
    };

    return data;
  },
};

export default class Parser {
  data: any;
  keyPoints: Transport[] = [];
  fluid?: Fluid;
  constructor() {
    // do nothing
  }

  readFile(fileName: string, save = false) {
    const file = fs.readFileSync(fileName, 'utf-8');
    if (!file) {
      throw new Error(`No file: ${fileName}`);
    }
    const fileExtension = fileName.split('.').pop();
    switch (fileExtension) {
      case 'yml':
      case 'yaml':
        this.data = YAML.parse(file);
        break;
      case 'genkey':
        this.data = OLGA.parse(file);
        break;
      default:
        throw new Error(`File type not supported: ${fileExtension}`);
    }

    if (save) {
      fs.writeFileSync(
        `${fileName.substring(0, fileName.indexOf('.'))}.yml`,
        YAML.stringify(this.data),
      );
    }

    return this.data;
  }

  async build() {
    if (!this.data) {
      throw new Error(
        `No data - call this.readFile(fileName) before this.build()`,
      );
    }
    let builder = new SnapshotBuilder();

    for (const instruction of this.data.instructions) {
      for (let [type, parameters] of Object.entries(instruction)) {
        type = type.toLowerCase();

        if (['selectsplitter', 'branch', 'setfluid'].includes(type)) {
          switch (type) {
            case 'selectsplitter':
              const { id } = parameters as { id: number | string };
              builder.selectSplitter(id);
              break;
            case 'branch':
              const pipeDef = parameters as IPipeDefinition;
              builder = builder.branch(pipeDef);
              break;
            case 'setfluid':
              const { pressure, temperature, flowrate } = parameters as {
                pressure: number;
                temperature: number;
                flowrate: number;
              };
              await builder.setFluid(pressure, temperature, flowrate);
              break;
          }
          continue;
        }

        switch (type) {
          case 'inlet':
            {
              const { name, physical } = parameters as {
                name: string;
                physical: IPhysicalElement;
              };
              builder = builder.addInlet(name, physical);
            }
            break;
          case 'pipeseg':
            {
              const pipeDef = parameters as IPipeDefinition;
              builder = builder.chainAddPipeSeg(pipeDef);
            }
            break;
          case 'splitter':
            {
              const { name, physical } = parameters as {
                name: string;
                physical: IPhysicalElement;
              };
              builder = builder.addSplitter(name, physical);
            }
            break;
          case 'well':
            {
              const { name, physical, realReservoirName } = parameters as {
                name: string;
                physical: IPhysicalElement;
                realReservoirName: 'Hamilton' | 'HamiltonNorth' | 'Lennox';
              };
              builder = builder.addWell(name, physical, realReservoirName);
            }
            break;
          case 'reservoir':
            {
              const { name, physical, pressure } = parameters as {
                name: string;
                physical: IPhysicalElement;
                pressure: number;
              };
              builder = builder.addReservoir(name, physical, pressure);
            }
            break;
          case 'pipeseries':
            {
              const { n, pipeDef, elevations, lengths } = parameters as {
                n: number;
                pipeDef: IPipeDefinition;
                elevations: number[];
                lengths: number[];
              };
              builder = builder.addPipeSeries(n, pipeDef, elevations, lengths);
            }
            break;
          default:
            throw new Error(`${type} not supported`);
        }
      }
    }

    this.keyPoints = builder.keyPoints;
    this.fluid = builder.fluid;

    return builder.elements[0];
  }
}
