import Point from '../point';

describe('constructor', () => {
  it('should set the value of the node', () => {
    const p = new Point();

    expect(p.value).toBe(0);
  });
});

describe('common interface', () => {
  it('should have a pressure', () => {
    const p = new Point();
    expect(p.pressure).toBeDefined();
  });

  it('should have a flowrate', () => {
    const p = new Point();
    expect(p.flowrate).toBeDefined();
  });

  it('should have a temperature', () => {
    const p = new Point();
    expect(p.temperature).toBeDefined();
  });
});
