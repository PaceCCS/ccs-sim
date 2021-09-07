import PipeSegment from '../pipeSegment';

describe('constructor', () => {
  it('should set the value of the node', () => {
    const ps = new PipeSegment();
    expect(ps.value).toBe(0);
  });

  it('should set the name of the node', () => {
    const ps = new PipeSegment({ name: 'namedpipeseg' });
    expect(ps.name).toBe('namedpipeseg');
  });

  it('should set diameter', () => {
    const ps = new PipeSegment({ name: 'pseg', diameter: 1 });
    expect(ps.properties.diameter).toBe(1);
  });

  it('should set length', () => {
    const ps = new PipeSegment({ name: 'pseg', length: 1 });
    expect(ps.properties.length).toBe(1);
  });

  it('should set flowrate', () => {
    const ps = new PipeSegment({ name: 'pseg', flowrate: 1 });
    expect(ps.properties.flowrate).toBe(1);
  });

  it('should set roughness', () => {
    const ps = new PipeSegment({ name: 'pseg', roughness: 1 });
    expect(ps.properties.roughness).toBe(1);
  });

  it('should set pressure', () => {
    const ps = new PipeSegment({ name: 'pseg', start: { pressure: 1 } });
    expect(ps.properties.start.pressure).toBe(1);
  });

  it('should set viscosity', () => {
    const ps = new PipeSegment({ name: 'pseg', start: { viscosity: 1 } });
    expect(ps.properties.start.viscosity).toBe(1);
  });

  it('should set temperature', () => {
    const ps = new PipeSegment({ name: 'pseg', start: { temperature: 1 } });
    expect(ps.properties.start.temperature).toBe(1);
  });

  it('should set x', () => {
    const ps = new PipeSegment({ name: 'pseg', start: { x: 1 } });
    expect(ps.properties.start.x).toBe(1);
  });

  it('should set y', () => {
    const ps = new PipeSegment({ name: 'pseg', start: { y: 1 } });
    expect(ps.properties.start.y).toBe(1);
  });
});

describe('constructor - defaults', () => {
  it('name = pipeseg', () => {
    const ps = new PipeSegment();
    expect(ps.name).toBe('pipeseg');
  });

  it('properties.diameter = 2', () => {
    const ps = new PipeSegment();
    expect(ps.properties.diameter).toBe(2);
  });

  it('no sources', () => {
    const ps = new PipeSegment();
    expect(ps.sources.length).toBe(0);
  });

  it('properties.length = 200', () => {
    const ps = new PipeSegment();
    expect(ps.properties.length).toBe(200);
  });

  it('properties.flowrate = 0', () => {
    const ps = new PipeSegment();
    expect(ps.properties.flowrate).toBe(0);
  });

  it('properties.start.pressure = 2e6', () => {
    const ps = new PipeSegment();
    expect(ps.properties.start.pressure).toBe(2e6);
  });

  it('properties.start.viscosity = 0', () => {
    const ps = new PipeSegment();
    expect(ps.properties.start.viscosity).toBe(0);
  });

  it('properties.start.temperature = 10', () => {
    const ps = new PipeSegment();
    expect(ps.properties.start.temperature).toBe(10);
  });

  it('properties.start.x = 0', () => {
    const ps = new PipeSegment();
    expect(ps.properties.start.x).toBe(0);
  });

  it('properties.start.y = 0', () => {
    const ps = new PipeSegment();
    expect(ps.properties.start.y).toBe(0);
  });
});

describe('addSource', () => {
  it('should add a node to the list of sources', () => {
    const ps = new PipeSegment();
    const ps2 = new PipeSegment();

    ps.addSource(ps2);

    expect(ps.sources).toContain(ps2);
  });

  it('should set this.destination.properties.start.pressure to the lower value', () => {
    const rootPs = new PipeSegment({
      name: 'root',
      start: { pressure: 10000000, temperature: 300 },
    });
    const ps = new PipeSegment({
      name: 'drop',
      start: { pressure: 10000000, temperature: 300 },
      length: 200,
      diameter: 0.9144,
      flowrate: 200,
    });

    rootPs.addSource(ps);

    expect(ps.pressureContinuity()).toBe(true);
  });
});

describe('inflow', () => {
  it('should sum the flow rates of its child nodes (1)', () => {
    const root = new PipeSegment({ name: 'parent' });
    const child = new PipeSegment({ name: 'child' });
    const child2 = new PipeSegment({ name: 'child2' });
    root.addSource(child);
    root.addSource(child2);
    const grandchild = new PipeSegment({ name: 'grandchild', flowrate: 4 });
    const grandchild2 = new PipeSegment({ name: 'grandchild', flowrate: 5 });
    child.addSource(grandchild);
    child.addSource(grandchild2);

    expect(root.inflow()).toBe(9);
  });

  it('should sum the flow rates of its child nodes (2) - grandchildren', () => {
    const root = new PipeSegment({ name: 'parent' });
    const child = new PipeSegment({ name: 'child' });
    const child2 = new PipeSegment({ name: 'child2', flowrate: 10 });
    root.addSource(child);
    root.addSource(child2);
    const grandchild = new PipeSegment({ name: 'grandchild', flowrate: 4 });
    const grandchild2 = new PipeSegment({ name: 'grandchild' });
    child.addSource(grandchild);
    child.addSource(grandchild2);

    expect(root.inflow()).toBe(14);
  });
});

describe('pressure drop', () => {
  it('should calculate pressure drop (1/3)', () => {
    const ps = new PipeSegment({
      name: 'drop',
      start: { pressure: 100000, temperature: 300 },
      length: 200,
      diameter: 0.9144,
      flowrate: 150,
    });

    expect(ps.endPressure()).toBe(61111.81128965647);
  });

  it('should calculate pressure drop (2/3)', () => {
    const ps = new PipeSegment({
      name: 'drop',
      start: { pressure: 300000, temperature: 350 },
      length: 200,
      diameter: 0.9144,
      flowrate: 100,
    });

    expect(ps.endPressure()).toBe(294535.73943407804);
  });

  it('should calculate pressure drop (3/3)', () => {
    const ps = new PipeSegment({
      name: 'drop',
      start: { pressure: 10000000, temperature: 300 },
      length: 200,
      diameter: 0.9144,
      flowrate: 200,
    });

    expect(ps.endPressure()).toBe(9999443.064800411);
  });

  test('this.pressureDrop should return the difference', () => {
    const ps = new PipeSegment({
      name: 'drop',
      start: { pressure: 10000000, temperature: 300 },
      length: 200,
      diameter: 0.9144,
      flowrate: 200,
    });

    const diff = 10000000 - 9999443.064800411;

    expect(ps.pressureDrop).toBe(diff);
  });
});

describe('common interface', () => {
  test('temperature getter should return start temp', () => {
    const ps = new PipeSegment();

    expect(ps.temperature).toBe(10);
  });

  test('pressure getter should return end pressure', () => {
    const ps = new PipeSegment({
      name: 'drop',
      start: { pressure: 10000000, temperature: 300 },
      length: 200,
      diameter: 0.9144,
      flowrate: 200,
    });

    expect(ps.pressure).toBe(9999443.064800411);
  });

  test('flowrate getter should return inflow', () => {
    const root = new PipeSegment({ name: 'parent' });
    const child = new PipeSegment({ name: 'child' });
    const child2 = new PipeSegment({ name: 'child2' });
    root.addSource(child);
    root.addSource(child2);
    const grandchild = new PipeSegment({ name: 'grandchild', flowrate: 4 });
    const grandchild2 = new PipeSegment({ name: 'grandchild', flowrate: 5 });
    child.addSource(grandchild);
    child.addSource(grandchild2);

    expect(root.flowrate).toBe(9);
  });
});

describe('pressure continuity', () => {
  it('should return true when the destination pipe has only one source', () => {
    const rootPs = new PipeSegment({
      name: 'root',
      start: { pressure: 10000000, temperature: 300 },
    });
    const ps = new PipeSegment({
      name: 'drop',
      start: { pressure: 10000000, temperature: 300 },
      length: 200,
      diameter: 0.9144,
      flowrate: 200,
    });

    rootPs.addSource(ps);

    expect(ps.pressureContinuity()).toBe(true);
  });

  it('should return false when the destination is connected to a lower pressure source', () => {
    const rootPs = new PipeSegment({
      name: 'root',
      start: { pressure: 10000000, temperature: 300 },
    });
    const ps = new PipeSegment({
      name: 'drop',
      start: { pressure: 10000000, temperature: 300 },
      length: 200,
      diameter: 0.9144,
      flowrate: 200,
    });
    const ps_low = new PipeSegment({
      name: 'drop',
      start: { pressure: 1000000, temperature: 300 },
      length: 200,
      diameter: 0.9144,
      flowrate: 200,
    });

    rootPs.addSource(ps);
    rootPs.addSource(ps_low);

    expect(ps.pressureContinuity()).toBe(false);
  });
});
