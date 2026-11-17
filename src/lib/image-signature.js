/**
 * Reconnaît uniquement les signatures des images admises, avant tout décodage.
 * @param {Uint8Array} bytes Les premiers octets du fichier.
 * @returns {"jpeg" | "png" | "webp" | null} Le format reconnu.
 */
export function detectImageType(bytes) {
  const matches = (signature, offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte);
  if (matches([0xff, 0xd8, 0xff])) return "jpeg";
  if (matches([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (bytes.length >= 12 && matches([82, 73, 70, 70]) && matches([87, 69, 66, 80], 8)) {
    return "webp";
  }
  return null;
}
