# @grandom/mt19937

Configurable [Mersenne Twister PRNG][url-wikipedia] implementation written in TypeScript.

## Install

```
npm i @grandom/mt19937
```

## Usage

```ts
import MT19937 from '@grandom/mt19937'

// create a new MT19937 instance with seed 12345
const random = new MT19937(12345)

// a random integer in range [0, 4294967295]
// use this for common random integer generation
const randomInt32 = random.randomInt32()

// a random integer in range [0, 2147483647]
const randomInt31 = random.randomInt31()

// a random float in range [0.0, 1.0]
const randomFloat1 = random.randomFloat1()

// a random float in range [0.0, 1.0) - same as Math.random()
// use this for common random float generation
const randomFloat2 = random.randomFloat2()

// a random float in range (0.0, 1.0)
const randomFloat3 = random.randomFloat3()

// a random float in range [0.0, 1.0) with 53-bit resolution.
const randomFloatRes53 = random.randomFloatRes53()
```

## License

[BSD-3-Clause][url-license-doc] @ [Richard King](https://richrdkng.com)

<!--- References =============================================================================== -->

<!--- URLs -->
[url-wikipedia]: https://en.wikipedia.org/wiki/Mersenne_Twister
[url-license-doc]: https://github.com/grandom-library/mt19937/blob/main/LICENSE
