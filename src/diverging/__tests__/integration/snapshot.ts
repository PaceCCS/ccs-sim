import Parser from '../../parser';
import Inlet from '../../inlet';
import Reservoir from '../../reservoir';
import {
  Pressure,
  PressureUnits,
  Temperature,
  TemperatureUnits,
  Flowrate,
  FlowrateUnits,
} from 'physical-quantities';

describe('Test case', () => {
  const gasPhaseTestCases = [
    {
      inletP: new Pressure(69.4140625, PressureUnits.Bara),
      inletFlowrate: new Flowrate(150.3, FlowrateUnits.Kgps),
      HM_P: new Pressure(40.7, PressureUnits.Bara),
      HN_P: new Pressure(35.5, PressureUnits.Bara),
      LX_P: new Pressure(37.4, PressureUnits.Bara),
    },
    {
      inletP: new Pressure(67.9208984375, PressureUnits.Bara),
      inletFlowrate: new Flowrate(150.3, FlowrateUnits.Kgps),
      HM_P: new Pressure(35.5, PressureUnits.Bara),
      HN_P: new Pressure(30.7, PressureUnits.Bara),
      LX_P: new Pressure(32.2, PressureUnits.Bara),
    },
  ];

  test.each(gasPhaseTestCases)(
    'return expected inlet pressure',
    async ({ inletP, inletFlowrate, HM_P, HN_P, LX_P }) => {
      const parser = new Parser();
      parser.readFile(`${__dirname}/../inputFiles/whole.yml`);
      await parser.build();
      const keyPoints = parser.keyPoints;

      const inlet = keyPoints[0] as Inlet;

      const HM = keyPoints[4] as Reservoir;
      const HN = keyPoints[7] as Reservoir;
      const LX = keyPoints[10] as Reservoir;

      HM.pressure = HM_P;
      HN.pressure = HN_P;
      LX.pressure = LX_P;

      await inlet.applyInletProperties(
        new Pressure(10, PressureUnits.Bara), // placeholder
        new Temperature(50, TemperatureUnits.Celsius),
        inletFlowrate,
        true,
      );

      const result = await inlet.searchInletPressure();

      expect(result.pressure).toEqual(inletP);
    },
  );
});
