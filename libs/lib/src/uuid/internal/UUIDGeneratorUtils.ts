import { formatBytesAsUUIDv7 } from "./UUIDv7Utils.ts"

/**
 * Assemble a UUIDv7 from components.
 *
 * Layout (128 bits):
 * - Bytes 0-5 (48 bits): unix timestamp in milliseconds
 * - Bytes 6-7 (16 bits): version (4 bits = 0111) + rand_a (12 bits)
 * - Bytes 8-15 (64 bits): variant (2 bits = 10) + rand_b (62 bits)
 */
export function buildUUID(
  milliseconds: number,
  randA: number,
  randBHi: number,
  randBLo: number
) {
  const bytes = new Uint8Array(16)

  // Bytes 0-5: timestamp (48 bits, big-endian)
  bytes[0] = Math.floor(milliseconds / (2 ** 40)) & 0xff
  bytes[1] = Math.floor(milliseconds / (2 ** 32)) & 0xff
  bytes[2] = Math.floor(milliseconds / (2 ** 24)) & 0xff
  bytes[3] = Math.floor(milliseconds / (2 ** 16)) & 0xff
  bytes[4] = Math.floor(milliseconds / (2 ** 8)) & 0xff
  bytes[5] = milliseconds & 0xff

  // Bytes 6-7: version (0111) + rand_a (12 bits)
  bytes[6] = 0x70 | ((randA >>> 8) & 0x0f)
  bytes[7] = randA & 0xff

  // Bytes 8-15: variant (10) + rand_b (62 bits)
  // randBHi is 30 bits, randBLo is 32 bits = 62 bits total
  bytes[8] = 0x80 | ((randBHi >>> 24) & 0x3f)
  bytes[9] = (randBHi >>> 16) & 0xff
  bytes[10] = (randBHi >>> 8) & 0xff
  bytes[11] = randBHi & 0xff
  bytes[12] = (randBLo >>> 24) & 0xff
  bytes[13] = (randBLo >>> 16) & 0xff
  bytes[14] = (randBLo >>> 8) & 0xff
  bytes[15] = randBLo & 0xff

  return formatBytesAsUUIDv7(bytes)
}
