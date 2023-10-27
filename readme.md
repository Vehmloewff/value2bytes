# Value2Bytes

> I built this before I know that CBOR existed. Use that instead. For a Deno wrapper, see [Dtils](https://github.com/Vehmloewff/dtils) `cborEncode` and `cborDecode`.

A simple pair of functions that turn a js value that can be sterilized into a `Uint8Array` and then back again.

```ts
import { value2Bytes, bytes2Value } from 'https://denopkg.com/Vehmloewff/value2bytes/mod.ts'
import { assertEquals } from 'https://deno.land/std@0.153.0/testing/asserts.ts'

const obj = { foo: 'bar', baz: [1, -2, 0.6, true, null, undefined], obj: { bytes: new Uint8Array(100), date: new Date() } }
const bytes = value2Bytes(obj)
const value = bytes2Value(bytes)

assertEquals(value, obj)
```
