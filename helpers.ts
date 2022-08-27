export function joinByteArrays(bytesArray: Uint8Array[]) {
	let length = 0

	for (const bytes of bytesArray) length += bytes.length

	const joinedBytes = new Uint8Array(length)

	let index = 0
	for (const bytes of bytesArray) {
		for (let byteIndex = 0; byteIndex < bytes.length; byteIndex++) {
			joinedBytes[index + byteIndex] = bytes[byteIndex]
		}

		index += bytes.length
	}

	return joinedBytes
}
