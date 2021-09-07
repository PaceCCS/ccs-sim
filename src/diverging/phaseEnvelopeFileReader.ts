import { PhaseData, PhaseDatum } from './fluidProperties';

const csv = require('csv-parser');
const fs = require('fs');

export default interface IPhaseEnvelopeFileReader {
  readPhaseEnvelope(): Promise<PhaseData>;
}

export class PhaseEnvelopeFileReader implements IPhaseEnvelopeFileReader {
  fileName: string;

  constructor(fileName: string) {
    this.fileName = fileName;
  }

  async readPhaseEnvelope(): Promise<PhaseData> {
    const data: PhaseDatum[] = [];
    const readData = () => {
      return new Promise((resolve, reject) => {
        fs.createReadStream(this.fileName)
          .on('error', (error: any) => {
            reject(error);
          })
          .pipe(csv())
          .on('data', (row: any) => {
            const rowData = Object.values(row);
            data.push([
              Number(rowData[0]),
              Number(rowData[1]),
              Number(rowData[2]),
            ]);
          })
          .on('end', () => {
            resolve(data);
          });
      });
    };
    await readData();

    return new PhaseData(data);
  }
}
