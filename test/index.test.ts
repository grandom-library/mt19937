import MT19937 from '../src'

describe('config', () => {
  test('set seed as a number', () => {
    const mt19937 = new MT19937(12345)

    expect(mt19937.seed).toBe(12345)
  })

  test('set seed as an array', () => {
    const mt19937 = new MT19937([1, 2, 3, 4, 5])

    expect(mt19937.seed).toEqual([1, 2, 3, 4, 5])
  })

  test('set and get seed', () => {
    const mt19937 = new MT19937()

    mt19937.seed = 12345

    expect(mt19937.seed).toBe(12345)
  })

  test('set custom parameters', () => {
    const stateLength = 123
    const statePeriod = 456
    const matrixA = 0x8808C1DF
    const upperMask = 0x60000000
    const lowerMask = 0x5FFFFFFF

    const mt19937 = new MT19937({
      stateLength,
      statePeriod,
      matrixA,
      upperMask,
      lowerMask
    })

    expect(mt19937.stateLength).toBe(stateLength)
    expect(mt19937.statePeriod).toBe(statePeriod)
    expect(mt19937.matrixA).toBe(matrixA)
    expect(mt19937.upperMask).toBe(upperMask)
    expect(mt19937.lowerMask).toBe(lowerMask)
  })

  test('set auto seeder', () => {
    const mt19937 = new MT19937({
      autoSeeder: () => 56789
    })

    expect(mt19937.seed).toBe(56789)
  })

  test('set seed with custom parameters', () => {
    const seed = 12345
    const stateLength = 5678
    const statePeriod = 9925
    const matrixA = 0x8888C1DF
    const upperMask = 0x40000000
    const lowerMask = 0x4FFFFFFF

    const mt19937 = new MT19937(seed, {
      stateLength,
      statePeriod,
      matrixA,
      upperMask,
      lowerMask
    })

    expect(mt19937.seed).toBe(seed)
    expect(mt19937.stateLength).toBe(stateLength)
    expect(mt19937.statePeriod).toBe(statePeriod)
    expect(mt19937.matrixA).toBe(matrixA)
    expect(mt19937.upperMask).toBe(upperMask)
    expect(mt19937.lowerMask).toBe(lowerMask)
  })
})

test('random value functions', () => {
  const mt19937 = new MT19937()

  const randomInt32 = mt19937.randomInt32()

  expect(randomInt32).toBeInteger()
  expect(randomInt32).toBeWithin(0, 4294967296)

  const randomInt31 = mt19937.randomInt31()

  expect(randomInt31).toBeInteger()
  expect(randomInt31).toBeWithin(0, 2147483648)

  expect(mt19937.randomFloat1()).toBeWithin(0, 1)
  expect(mt19937.randomFloat2()).toBeWithin(0, 1)
  expect(mt19937.randomFloat3()).toBeWithin(0, 1)
  expect(mt19937.randomFloatRes53()).toBeWithin(0, 1)
})

test('repeat random sequence on same seed', () => {
  const mt19937 = new MT19937()
  const seed = 123456789

  mt19937.seed = seed

  const rand11 = mt19937.randomFloat2()
  const rand12 = mt19937.randomFloat2()
  const rand13 = mt19937.randomFloat2()

  mt19937.seed = seed

  const rand21 = mt19937.randomFloat2()
  const rand22 = mt19937.randomFloat2()
  const rand23 = mt19937.randomFloat2()

  expect(rand11).toBe(rand21)
  expect(rand12).toBe(rand22)
  expect(rand13).toBe(rand23)
})

test('get a close match with Python\'s random module, when seeded with array', () => {
  const mt1 = new MT19937()
  const mt2 = new MT19937()

  mt1.seed = [0]
  mt2.seed = [42]

  const values1 = [0.84442, 0.34535, 0.25570, 0.32368, 0.89075]
  const values2 = [0.63942, 0.55564, 0.55519, 0.81948, 0.94333]

  for (let i = 0; i < 5_000_000; i++) {
    const rand1 = mt1.randomFloatRes53()
    const rand2 = mt2.randomFloatRes53()

    if (i % 1000000 === 0) {
      const index = i / 1000000

      expect(rand1).toBeCloseTo(values1[index])
      expect(rand2).toBeCloseTo(values2[index])
    }
  }
})
