export default class Fluid {
  pressure: number;
  temperature: number;
  flowrate: number;

  constructor(pressure: number, temperature: number, flowrate: number) {
    this.pressure = pressure;
    this.temperature = temperature;
    this.flowrate = flowrate;
  }

  viscosity(): number {
    const μ0 = 0.000018; // Ref viscosity
    const T0 = 373; // Ref temperature
    const C = 240; // Southerland constant
    const T = this.temperature;
    return μ0 * ((T0 + C) / (T + C)) * (T / T0) ** (3 / 2);
  }

  density(): number {
    // ρ=(Pμ)/(RT)
    const μ = 0.044;
    const R = 8.31462;
    return Number((this.pressure * μ) / (R * this.temperature));
  }
}
