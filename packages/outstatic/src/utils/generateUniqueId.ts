type generateUniqueIdParams = {
  repoOwner: string
  repoSlug: string
}

async function generateUniqueId({
  repoOwner,
  repoSlug
}: generateUniqueIdParams) {
  const encoder = new TextEncoder()
  const data = encoder.encode(repoOwner + repoSlug)
  const hash = await window.crypto.subtle.digest('SHA-256', data)

  // Convert the result to hexadecimal
  const hashArray = Array.from(new Uint8Array(hash))
  const uniqueId = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return uniqueId
}

export default generateUniqueId
