import { Types, Value } from './types.ts'

const decoder = new TextDecoder()

function parseSize(input: Uint8Array, float?: boolean): number {
	const string = decoder.decode(input)

	const minusIndex = string.indexOf('-')
	if (~minusIndex) {
		if (minusIndex !== 0) return parseSize(input.slice(minusIndex), float)
	}

	const parser = float ? parseFloat : parseInt
	const int = parser(string)

	if (isNaN(int)) throw new Error(`Could not parse size: ${string}`)

	return int
}

function collectValues(bytes: Uint8Array) {
	const values: Value[] = []
	let index = 0

	while (index < bytes.length) {
		const [value, consumed] = valueRawBytes(bytes.slice(index))
		if (!consumed) throw new Error('A value valued must always consume bytes')

		values.push(value)

		index += consumed
	}

	return values
}

function valueBoolean(bytes: Uint8Array): [Value, number] {
	const isTrue = bytes[1] === 1
	return [isTrue, 2]
}

function valueInt(bytes: Uint8Array): [Value, number] {
	const num = parseSize(bytes.slice(1, 21))

	return [num, 21]
}

function valueFloat(bytes: Uint8Array): [Value, number] {
	const num = parseSize(bytes.slice(1, 21), true)

	return [num, 21]
}

function valueString(bytes: Uint8Array): [Value, number] {
	const size = parseSize(bytes.slice(1, 11))
	const stringBytes = bytes.slice(11, size + 11)

	const string = decoder.decode(stringBytes)
	return [string, 11 + size]
}

function valueArray(bytes: Uint8Array): [Value, number] {
	const size = parseSize(bytes.slice(1, 11))

	const itemsBytes = bytes.slice(11, size + 11)
	const items = collectValues(itemsBytes)

	return [items, size + 11]
}

function valueBytes(bytes: Uint8Array): [Value, number] {
	const size = parseSize(bytes.slice(1, 11))
	const trueBytes = bytes.slice(11, size + 11)

	return [trueBytes, 11 + size]
}

function valueDate(bytes: Uint8Array): [Value, number] {
	const time = parseSize(bytes.slice(1, 21))

	return [new Date(time), 21]
}

function valueObject(bytes: Uint8Array): [Value, number] {
	const obj: Record<string | number, Value> = {}
	const size = parseSize(bytes.slice(1, 11))

	const entriesBytes = bytes.slice(11, size + 11)
	const entries = collectValues(entriesBytes)

	for (let index = 0; index < entries.length; index += 2) {
		const key = entries[index]
		const value = entries[index + 1]

		obj[key] = value
	}

	return [obj, size + 11]
}

/** Returns the value valued and the amount of bytes consumed */
function valueRawBytes(bytes: Uint8Array): [Value, number] {
	if (bytes[0] === Types.Null) return [null, 1]
	if (bytes[0] === Types.Undefined) return [undefined, 1]
	if (bytes[0] === Types.Boolean) return valueBoolean(bytes)
	if (bytes[0] === Types.Int) return valueInt(bytes)
	if (bytes[0] === Types.Float) return valueFloat(bytes)
	if (bytes[0] === Types.String) return valueString(bytes)
	if (bytes[0] === Types.Array) return valueArray(bytes)
	if (bytes[0] === Types.Bytes) return valueBytes(bytes)
	if (bytes[0] === Types.Date) return valueDate(bytes)
	if (bytes[0] === Types.Object) return valueObject(bytes)

	throw new Error('Unknown data type')
}

export function bytes2Value(bytes: Uint8Array): Value {
	const [value, consumed] = valueRawBytes(bytes)
	if (consumed < bytes.length) throw new Error('Valuer did not consume entire root node of bytes')

	return value
}
