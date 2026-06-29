import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';

const host = '127.0.0.1';
const port = Number(process.env.KORANTIS_DEV_PROXY_PORT || 8787);
const upstream = new URL(process.env.KORANTIS_API_UPSTREAM || 'https://www.korantis.com');
const allowedPath = /^\/api\/(venues(?:\?.*)?|venue-images\/[^/?]+)$/;

function corsHeaders(origin) {
  const isLocalOrigin = typeof origin === 'string'
    && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

  return {
    'access-control-allow-origin': isLocalOrigin ? origin : 'http://localhost:8081',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'Accept, Content-Type',
    vary: 'Origin',
  };
}

const server = createServer(async (request, response) => {
  const headers = corsHeaders(request.headers.origin);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, headers);
    response.end();
    return;
  }

  if (request.method !== 'GET' || !request.url || !allowedPath.test(request.url)) {
    response.writeHead(404, { ...headers, 'content-type': 'application/json' });
    response.end(JSON.stringify({ code: 'NOT_FOUND', message: 'Development proxy route not found' }));
    return;
  }

  try {
    const target = new URL(request.url, upstream);
    const upstreamResponse = await fetch(target, {
      headers: { accept: request.headers.accept || 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    const body = Buffer.from(await upstreamResponse.arrayBuffer());

    response.writeHead(upstreamResponse.status, {
      ...headers,
      'content-type': upstreamResponse.headers.get('content-type') || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    response.end(body);
  } catch {
    response.writeHead(502, { ...headers, 'content-type': 'application/json' });
    response.end(JSON.stringify({ code: 'UPSTREAM_UNAVAILABLE', message: 'Korantis API is unavailable' }));
  }
});

server.listen(port, host, () => {
  process.stdout.write(`[korantis-api] http://${host}:${port} -> ${upstream.origin}\n`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
