import { value2Bytes } from './to-bytes.ts'
import { bytes2Value } from './to-value.ts'
import { assertEquals } from 'https://deno.land/std@0.153.0/testing/asserts.ts'

Deno.test({
	name: 'should turn value to bytes and then back again',
	fn() {
		const obj = { foo: 'bar', baz: [1, -2, 0.6, true, null, undefined], obj: { bytes: new Uint8Array(100000), date: new Date() } }
		const bytes = value2Bytes(obj)
		const value = bytes2Value(bytes)

		assertEquals(value, obj)
	},
})
