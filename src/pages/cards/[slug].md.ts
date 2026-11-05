// Представление карточки Markdown по тому же адресу с суффиксом .md (S3, D-FAB-2).
import type { APIRoute } from 'astro';
import { loadCards } from '../../lib/cards';

export function getStaticPaths() {
  return loadCards().map((c) => ({ params: { slug: c.slug }, props: { raw: c.raw } }));
}
export const GET: APIRoute = ({ props }) =>
  new Response(props.raw as string, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
