const LEGACY_TOKEN_SECRET = 'l1f3154n4dv3ntur3st4yS7r0n9s3cr3t'
const MIN_TOKEN_SECRET_BYTES = 32

let cachedKey: Promise<Uint8Array> | null = null

function getSecretMaterial(): string {
  const tokenSecret = process.env.OST_TOKEN_SECRET

  if (tokenSecret === LEGACY_TOKEN_SECRET) {
    throw new Error(
      "OST_TOKEN_SECRET uses Outstatic's deprecated public fallback. Replace it with a unique random value."
    )
  }

  if (
    tokenSecret &&
    new TextEncoder().encode(tokenSecret).byteLength < MIN_TOKEN_SECRET_BYTES
  ) {
    throw new Error(
      `OST_TOKEN_SECRET must contain at least ${MIN_TOKEN_SECRET_BYTES} bytes.`
    )
  }

  const material =
    tokenSecret ||
    process.env.OST_GITHUB_SECRET ||
    process.env.OUTSTATIC_API_KEY

  if (!material) {
    throw new Error(
      'Outstatic cannot derive a session key. Set OST_GITHUB_SECRET (GitHub OAuth) or OUTSTATIC_API_KEY (Outstatic Pro).'
    )
  }

  return material
}

async function deriveSessionKey(): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecretMaterial()),
    'HKDF',
    false,
    ['deriveBits']
  )

  return new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: encoder.encode('outstatic:session:v1'),
        info: encoder.encode('cookie-encryption')
      },
      keyMaterial,
      256
    )
  )
}

export function getSessionKey(): Promise<Uint8Array> {
  cachedKey ??= deriveSessionKey()
  return cachedKey
}
