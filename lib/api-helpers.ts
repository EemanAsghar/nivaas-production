import { NextResponse } from 'next/server';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export const unauthorized = () => err('Unauthorized', 401);
export const forbidden    = () => err('Forbidden', 403);
export const notFound     = (entity = 'Resource') => err(`${entity} not found`, 404);

export function paginate(page: number, limit: number) {
  const safePage  = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));
  return { skip: (safePage - 1) * safeLimit, take: safeLimit };
}

export function parsePaginationParams(searchParams: URLSearchParams) {
  return {
    page:  Math.max(1, parseInt(searchParams.get('page')  ?? '1')),
    limit: Math.min(50, parseInt(searchParams.get('limit') ?? '20')),
  };
}
