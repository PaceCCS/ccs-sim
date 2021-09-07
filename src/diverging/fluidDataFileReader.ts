import FluidData, { FluidDatum } from './fluidData';
import * as fs from 'fs';
import * as csv from 'csv-parser';

export default interface IFluidPropertiesFileReader {
  readFluidProperties(): Promise<FluidData>;
}
export class FluidDataFileReader implements IFluidPropertiesFileReader {
  fileName: string;

  constructor(fileName: string) {
    this.fileName = fileName;
  }

  async readFluidProperties(): Promise<FluidData> {
    const data: FluidDatum[] = [];
    const readData = () => {
      return new Promise((resolve, reject) => {
        fs.createReadStream(this.fileName)
          .on('error', (error: any) => {
            reject(error);
          })
          .pipe(csv.default())
          .on('data', (row: any) => {
            const rowData = Object.values(row).map((value) =>
              Number(value),
            ) as FluidDatum;
            data.push(rowData);
          })
          .on('end', () => {
            resolve(data);
          });
      });
    };
    await readData();

    return new FluidData(data);
  }
}
