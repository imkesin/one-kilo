const Alphabet = {
  Base62: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  CrockfordBase32: "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
} as const

const RandomStringTypes = {
  Id: {
    length: 26,
    alphabet: Alphabet.CrockfordBase32
  },
  RefreshToken: {
    length: 25,
    alphabet: Alphabet.Base62
  }
} as const

export const generateRandomString = (type: keyof typeof RandomStringTypes) => {
  const { length, alphabet } = RandomStringTypes[type]

  const result = new Uint8Array(length)
  const maxValid = 256 - (256 % alphabet.length)

  let filled = 0
  while (filled < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(Math.max(32, length - filled)))

    for (let i = 0; i < bytes.length && filled < length; i++) {
      const byte = bytes[i]

      if (byte !== undefined && byte < maxValid) {
        result[filled++] = alphabet.charCodeAt(byte % alphabet.length)
      }
    }
  }

  return new TextDecoder().decode(result)
}
