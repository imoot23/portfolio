const reply = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
});
const ready = env => Boolean(env.GITHUB_TOKEN && env.GITHUB_OWNER && env.GITHUB_REPO && env.GITHUB_BRANCH);
const protectedMode = env => Boolean(env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SITE_KEY);
const testMode = env => env.GUESTBOOK_ALLOW_UNPROTECTED === 'true' && !env.TURNSTILE_SECRET_KEY && !env.TURNSTILE_SITE_KEY;
export function onRequestGet({ env }) {
  return reply({ available: ready(env) && (protectedMode(env) || testMode(env)), siteKey: env.TURNSTILE_SITE_KEY || '' });
}
export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  if (request.headers.get('Origin') !== url.origin) return reply({ error: '허용되지 않은 요청입니다.' }, 403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({ error: 'JSON 요청만 허용됩니다.' }, 415);
  if (!ready(env) || (!protectedMode(env) && !testMode(env))) return reply({ error: '방명록 서버 설정이 필요합니다.' }, 503);
  let body;
  try {
    // Content-Length가 없는 요청도 스트림을 제한해 메모리 소모를 방지합니다.
    const reader = request.body?.getReader(); if (!reader) return reply({ error: '입력값이 없습니다.' }, 400);
    const chunks = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 8192) { await reader.cancel(); return reply({ error: '입력값이 너무 큽니다.' }, 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch { return reply({ error: '입력값을 확인해 주세요.' }, 400); }
  if (!body || typeof body !== 'object') return reply({ error: '입력값을 확인해 주세요.' }, 400);
  if (body.website) return reply({ error: '허용되지 않은 요청입니다.' }, 400);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!name || !message || name.length > 40 || message.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(name + message))
    return reply({ error: '이름은 1~40자, 메시지는 1~500자로 입력해 주세요.' }, 400);
  try {
    if (protectedMode(env)) {
      if (typeof body.turnstileToken !== 'string' || !body.turnstileToken || body.turnstileToken.length > 2048)
        return reply({ error: '보안 확인을 완료해 주세요.' }, 400);
      const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: body.turnstileToken, remoteip: request.headers.get('CF-Connecting-IP') }),
        signal: AbortSignal.timeout(10000)
      });
      if (!verification.ok) throw new Error('verification');
      const result = await verification.json();
      if (!result.success || result.hostname !== url.hostname || result.action !== 'guestbook')
        return reply({ error: '보안 확인에 실패했습니다. 다시 시도해 주세요.' }, 403);
    }
    const createdAt = new Date().toISOString();
    const file = `${createdAt.replace(/[:.]/g, '-')}-${crypto.randomUUID()}.json`;
    // JSON으로만 저장하며 공개 목록을 만들지 않습니다. CMS에서도 text 필드로 읽습니다.
    const text = JSON.stringify({ name, message, createdAt, approved: false }, null, 2) + '\n';
    const content = btoa(Array.from(new TextEncoder().encode(text), byte => String.fromCharCode(byte)).join(''));
    const owner = encodeURIComponent(env.GITHUB_OWNER), repo = encodeURIComponent(env.GITHUB_REPO);
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/content/guestbook/${file}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'portfolio-guestbook' },
      body: JSON.stringify({ message: 'Add guestbook message for moderation', content, branch: env.GITHUB_BRANCH }),
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error('github');
    return reply({ ok: true }, 201);
  } catch { return reply({ error: '전송하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 502); }
}
export const onRequestPut = () => reply({ error: 'Method not allowed' }, 405);
export const onRequestDelete = onRequestPut;
export const onRequestPatch = onRequestPut;
