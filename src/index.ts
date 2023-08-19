/*
  TypeScript implementation of the Mersenne Twister PRNG.
  ==================================================================================================

  Based on the works of:
    - Takuji Nishimura & Makoto Matsumoto et al.
    - Isaku Wada
    - Sean McCullough

  TypeScript port by Richard King <richrdkng@gmail.com> (https://richrdkng.com)

  --------------------------------------------------------------------------------------------------

  Sean McCullough wrapped Makoto Matsumoto and Takuji Nishimura's code
  in a namespace (https://gist.github.com/banksean/300494).

  Real versions are due to Isaku Wada - added on 2002/01/09

  Sean McCullough <banksean@gmail.com> (https://github.com/banksean)

  --------------------------------------------------------------------------------------------------

  A C-program for MT19937, with initialization improved 2002/1/26.
  Coded by Takuji Nishimura and Makoto Matsumoto.

  Before using, initialize the state by using init_genrand(seed)
  or init_by_array(init_key, key_length).

  BSD 3-Clause License

  Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions
  are met:

  1. Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.

  2. Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.

  3. The names of its contributors may not be used to endorse or promote
    products derived from this software without specific prior written
    permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
  "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
  LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
  A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT
  OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
  SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
  TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

  Any feedback is very welcome.
  http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
  email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
*/

// -------------------------------------------------------------------------------------------------

/**
 * More information about the Mersenne Twister general-purpose pseudorandom number generator on:
 * https://en.wikipedia.org/wiki/Mersenne_Twister
 */

// -------------------------------------------------------------------------------------------------

/**
 * Default state length *(state size)*.
 * This is the **N** constant in the original C implementation.
 */
const _STATE_LENGTH = 624

/**
 * Default state period size *(shift size)*.
 * This is the **M** constant in the original C implementation.
 */
const _STATE_PERIOD = 397

/**
 * The **'a'** vector for mixing during the MT19937 state update.
 * This constant contributes to the periodicity and randomness of the generator's output.
 */
const _MATRIX_A = 0x9908B0DF

/**
 * The bitmask to extract the most significant w-r bits.
 * This mask helps separate the 'w-r' most significant bits from the state word during the tempering process.
 */
const _UPPER_MASK = 0x80000000 // most significant w-r bits

/**
 * This bitmask to extract the least significant r bits.
 * This mask assists in isolating the 'r' least significant bits during the tempering process.
 */
const _LOWER_MASK = 0x7FFFFFFF // least significant r bits

/**
 * 1st bitmask used during tempering.
 */
const _TEMPERING_MASK_1 = 0x9D2C5680

/**
 * 2nd bitmask used during tempering.
 */
const _TEMPERING_MASK_2 = 0xEFC60000

/**
 * The initial seed during initialization with an array seed.
 *
 * The constant **19650218** is the birthday of one of the authors, chosen
 * without reason (https://eprint.iacr.org/2005/165.pdf - page 4)
 */
const _MAGIC_SEED = 19650218

/**
 * Default function for automatic seeding providing *random enough* seeds.
 */
const _DEFAULT_AUTO_SEEDER = (): number => Math.floor(Math.random() * new Date().getTime())

// -------------------------------------------------------------------------------------------------

/**
 * Configurable parameters to Mersenne Twister 19937.
 */
interface MT19937Parameters {
  /**
   * State vector length *(state size)*.
   * This is the **N** constant in the original C implementation.
   *
   * @default 624
   */
  stateLength?: number

  /**
   * State period size *(shift size)*.
   * This is the **M** constant in the original C implementation..
   *
   * @default 397
   */
  statePeriod?: number

  /**
   * The **'a'** vector to generate the magic array of [0, n] for mixing
   * during the MT19937 state update.
   *
   * @default 0x9908B0DF
   */
  matrixA?: number

  /**
   * The upper bitmask to extract the most significant w-r bits.
   *
   * @default 0x80000000
   */
  upperMask?: number

  /**
   * The lower bitmask to extract the least significant r bits.
   *
   * @default 0x7FFFFFFF
   */
  lowerMask?: number

  /**
   * Auto seeder function if seed is not provided.
   * The default auto seeder provides *random enough* seeds.
   *
   * @default () => Math.floor(Math.random() * new Date().getTime())
   */
  autoSeeder?: () => number
}

// -------------------------------------------------------------------------------------------------

/**
 * Configurable Mersenne Twister PRNG.
 */
export default class MT19937 {
  private readonly _N: number
  private readonly _M: number
  private readonly _MATRIX_A: number
  private readonly _UPPER_MASK: number
  private readonly _LOWER_MASK: number

  private _seed!: number | number []
  private _stateVector: number[]
  private _stateIndex: number

  // -----------------------------------------------------------------------------------------------

  /**
   * Creates a Mersenne Twister 19937 PRNG instance with an automatic seed and
   * default parameters.
   */
  constructor ()

  /**
   * Creates a Mersenne Twister 19937 PRNG instance with a custom seed and
   * default parameters.
   */
  constructor (seed: number | number[])

  /**
   * Creates a Mersenne Twister 19937 PRNG instance with a custom seed and
   * custom parameters.
   */
  constructor (seed: number | number[], parameters: MT19937Parameters)

  /**
   * Creates a Mersenne Twister 19937 PRNG instance with an automatic seed and
   * custom parameters.
   */
  constructor (parameters: MT19937Parameters)

  constructor (arg1?: any, arg2?: any) {
    let seed: undefined | number | number[]
    let parameters: undefined | MT19937Parameters

    if (typeof arg1 !== 'undefined') {
      if (typeof arg1 === 'number' || Array.isArray(arg1)) {
        seed = arg1
      }

      if (arg1 !== null && typeof arg1 === 'object') {
        parameters = arg1
      } else if (arg2 !== null && typeof arg2 === 'object') {
        parameters = arg2
      }
    }

    // automatically seed MT19937
    if (typeof seed === 'undefined') {
      seed = typeof parameters?.autoSeeder === 'function'
        ? parameters.autoSeeder()
        : _DEFAULT_AUTO_SEEDER()
    }

    this._N = parameters?.stateLength ?? _STATE_LENGTH
    this._M = parameters?.statePeriod ?? _STATE_PERIOD
    this._MATRIX_A = parameters?.matrixA ?? _MATRIX_A
    this._UPPER_MASK = parameters?.upperMask ?? _UPPER_MASK
    this._LOWER_MASK = parameters?.lowerMask ?? _LOWER_MASK

    this._stateVector = new Array(this._N)
    this._stateIndex = this._N + 1

    this._init(seed)
  }

  // -----------------------------------------------------------------------------------------------

  get seed (): number | number[] {
    return this._seed
  }

  set seed (seed: number | number[]) {
    this._init(seed)
  }

  get stateLength (): number {
    return this._N
  }

  get statePeriod (): number {
    return this._M
  }

  get matrixA (): number {
    return this._MATRIX_A
  }

  get upperMask (): number {
    return this._UPPER_MASK
  }

  get lowerMask (): number {
    return this._LOWER_MASK
  }

  // -----------------------------------------------------------------------------------------------

  /**
   * Generates a random integer.
   *
   * @returns A random integer in range [0, 4294967295].
   */
  randomInt32 (): number {
    let y: number
    const magic: number[] = [0, this._MATRIX_A]

    if (this._stateIndex >= this._N) {
      let kk: number

      // initial state mixing
      for (kk = 0; kk < this._N - this._M; kk++) {
        y = (this._stateVector[kk] & this._UPPER_MASK) | (this._stateVector[kk + 1] & this._LOWER_MASK)
        this._stateVector[kk] = this._stateVector[kk + this._M] ^ (y >>> 1) ^ magic[y & 0x1]
      }

      // additional state mixing
      for (; kk < this._N - 1; kk++) {
        y = (this._stateVector[kk] & this._UPPER_MASK) | (this._stateVector[kk + 1] & this._LOWER_MASK)
        this._stateVector[kk] = this._stateVector[kk + (this._M - this._N)] ^ (y >>> 1) ^ magic[y & 0x1]
      }

      // final state mixing step
      y = (this._stateVector[this._N - 1] & this._UPPER_MASK) | (this._stateVector[0] & this._LOWER_MASK)
      this._stateVector[this._N - 1] = this._stateVector[this._M - 1] ^ (y >>> 1) ^ magic[y & 0x1]

      this._stateIndex = 0
    }

    y = this._stateVector[this._stateIndex++]

    // tempering
    y ^= y >>> 11
    y ^= (y << 7) & _TEMPERING_MASK_1
    y ^= (y << 15) & _TEMPERING_MASK_2
    y ^= y >>> 18

    return y >>> 0
  }

  /**
   * Generates a random integer.
   *
   * @returns A random integer in range [0, 2147483647].
   */
  randomInt31 (): number {
    return this.randomInt32() >>> 1
  }

  /**
   * Generates a random float.
   *
   * @returns A random float in range [0.0, 1.0].
   */
  randomFloat1 (): number {
    return this.randomInt32() * (1 / 4294967295) // divided by 2^32-1
  }

  /**
   * Generates a random float in same range as Math.random().
   *
   * @returns A random float in range [0.0, 1.0).
   */
  randomFloat2 (): number {
    return this.randomInt32() * (1 / 4294967296) // divided by 2^32
  }

  /**
   * Generates a random float.
   *
   * @returns A random float in range (0.0, 1.0).
   */
  randomFloat3 (): number {
    return (this.randomInt32() + 0.5) * (1 / 4294967296) // divided by 2^32
  }

  /**
   * Generates a random float.
   *
   * @returns A random float in range [0.0, 1.0) with 53-bit resolution.
   */
  randomFloatRes53 (): number {
    const a = this.randomInt32() >>> 5
    const b = this.randomInt32() >>> 6

    return (a * 67108864.0 + b) * (1 / 9007199254740992.0)
  }

  // -----------------------------------------------------------------------------------------------

  private _init (seed: number | number[]): void {
    this._seed = seed

    if (Array.isArray(seed)) {
      this._initWithArray(seed)
    } else {
      this._initWithNumber(seed)
    }
  }

  private _initWithNumber (seed: number): void {
    this._stateVector[0] = seed >>> 0

    for (this._stateIndex = 1; this._stateIndex < this._N; this._stateIndex++) {
      // calculate the intermediary value for tempering
      const s = this._stateVector[this._stateIndex - 1] ^ (this._stateVector[this._stateIndex - 1] >>> 30)

      // generate next state word
      this._stateVector[this._stateIndex] =
        (((((s & 0XFFFF0000) >>> 16) * 1812433253) << 16) +
        (s & 0X0000FFFF) * 1812433253) +
        this._stateIndex

      // ensure unsigned 32-bit integer
      this._stateVector[this._stateIndex] >>>= 0
    }
  }

  private _initWithArray (initKey: number[]): void {
    let i = 1
    let j = 0

    /* istanbul ignore next */
    let k = this._N > initKey.length
      ? this._N
      : initKey.length

    this._initWithNumber(_MAGIC_SEED)

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    for (; k; k--) {
      const s = this._stateVector[i - 1] ^ (this._stateVector[i - 1] >>> 30)

      this._stateVector[i] =
        (this._stateVector[i] ^ (((((s & 0xFFFF0000) >>> 16) * 1664525) << 16) + ((s & 0X0000FFFF) * 1664525))) +
        initKey[j] +
        j

      // ensure unsigned 32-bit integer
      this._stateVector[i] >>>= 0

      i++
      j++

      if (i >= this._N) {
        this._stateVector[0] = this._stateVector[this._N - 1]
        i = 1
      }

      if (j >= initKey.length) {
        j = 0
      }
    }

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    for (k = this._N - 1; k; k--) {
      const s = this._stateVector[i - 1] ^ (this._stateVector[i - 1] >>> 30)

      this._stateVector[i] =
        (this._stateVector[i] ^ (((((s & 0XFFFF0000) >>> 16) * 1566083941) << 16) +
        (s & 0X0000FFFF) * 1566083941)) -
        i

      // ensure unsigned 32-bit integer
      this._stateVector[i] >>>= 0

      i++

      if (i >= this._N) {
        this._stateVector[0] = this._stateVector[this._N - 1]
        i = 1
      }
    }

    this._stateVector[0] = 0x80000000
  }
}
