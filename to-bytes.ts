import { joinByteArrays } from './helpers.ts'
import { Types, Value } from './types.ts'

const encoder = new TextEncoder()

function getType(value: Value): number {
	if (value === null) return Types.Null
	if (value === undefined) return Types.Undefined
	if (typeof value === 'boolean') return Types.Boolean
	if (typeof value === 'string') return Types.String
	if (typeof value === 'number') {
		if (value % 1 === 0) return Types.Int
		return Types.Float
	}
	if (typeof value === 'object') {
		if (Array.isArray(value)) return Types.Array
		if (value instanceof Date) return Types.Date
		if (value instanceof Uint8Array) return Types.Bytes

		return Types.Object
	}

	if (typeof value === 'function') throw new Error('Function are not supported for representation in binary')

	throw new Error(`Unknown type of value: ${value}`)
}

function byteString(value: string) {
	return generateByteFormat(Types.String, encoder.encode(value))
}

function byteBoolean(value: boolean) {
	const bytes = new Uint8Array(2)

	bytes[0] = Types.Boolean
	bytes[1] = value === true ? 1 : 0

	return bytes
}

function byteInt(value: number) {
	return byteNumber(Types.Int, value)
}

function byteFloat(value: number) {
	return byteNumber(Types.Float, value)
}

function byteDate(value: Date) {
	return byteNumber(Types.Date, value.getTime())
}

function byteNumber(type: number, value: number) {
	const bytes = new Uint8Array(21)
	const numBytes = encoder.encode(padNumber(value, 20))

	bytes[0] = type

	for (let index = 0; index <= numBytes.length; index++) {
		bytes[index + 1] = numBytes[index]
	}

	return bytes
}

function byteNull() {
	const bytes = new Uint8Array(1)
	bytes[0] = Types.Null

	return bytes
}

function byteUndefined() {
	const bytes = new Uint8Array(1)
	bytes[0] = Types.Undefined

	return bytes
}

function byteBytes(value: Uint8Array) {
	return generateByteFormat(Types.Bytes, value)
}

function byteArray(values: Value[]) {
	const bytesArray: Uint8Array[] = []

	for (const value of values) bytesArray.push(value2Bytes(value))

	return generateByteFormat(Types.Array, joinByteArrays(bytesArray))
}

function byteObject(values: Record<string | number, Value>) {
	const entries: Uint8Array[] = []

	for (const [key, value] of Object.entries(values)) {
		entries.push(value2Bytes(key), value2Bytes(value))
	}

	return generateByteFormat(Types.Object, joinByteArrays(entries))
}

function generateByteFormat(type: number, bytes: Uint8Array) {
	const sizeBytes = encoder.encode(padNumber(bytes.length, 10)) // The 10 bytes that represent the size of the bytes following them
	const length = 1 + sizeBytes.length + bytes.length // the type, the size, and the bytes

	const joinedBytes = new Uint8Array(length)

	// Set the type
	joinedBytes[0] = type

	// Set the 10 bytes of size
	for (let index = 0; index < sizeBytes.length; index++) {
		joinedBytes[index + 1] = sizeBytes[index]
	}

	// Set the rest
	for (let index = 0; index < bytes.length; index++) {
		joinedBytes[index + 11] = bytes[index]
	}

	return joinedBytes
}

function padNumber(num: number, length: number) {
	const string = num.toString()
	if (string.length > length) throw new Error(`Value is too big. Max length is 9,999,999,999 but length is ${num}`)

	const padStart = (string: string): string => {
		if (string.length < length) return padStart(`0${string}`)
		return string
	}

	return padStart(string)
}

export function value2Bytes(value: Value): Uint8Array {
	const type = getType(value)

	if (type === Types.Null) return byteNull()
	if (type === Types.Undefined) return byteUndefined()
	if (type === Types.Boolean) return byteBoolean(value)
	if (type === Types.Int) return byteInt(value)
	if (type === Types.Float) return byteFloat(value)
	if (type === Types.String) return byteString(value)
	if (type === Types.Array) return byteArray(value)
	if (type === Types.Bytes) return byteBytes(value)
	if (type === Types.Date) return byteDate(value)
	if (type === Types.Object) return byteObject(value)

	throw new Error('Unknown type')
}
