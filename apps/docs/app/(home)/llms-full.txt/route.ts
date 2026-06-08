import { getLLMText, llmsSource } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const scan = llmsSource.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join('\n\n'));
}
