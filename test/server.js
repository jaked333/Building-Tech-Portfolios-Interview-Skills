import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(root, 'public');
const port = Number(process.env.PORT) || 3000;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': mimeTypes['.json'] });
  response.end(JSON.stringify(payload));
}

function localReview({ project, stack, context }) {
  const stackText = stack || 'your current stack';
  return {
    source: 'local-demo-model',
    summary: `${project || 'This project'} has a clear starting point. The next step is to make its value obvious in one sentence and connect the implementation choices to a measurable outcome.`,
    strengths: [
      `The ${stackText} choice is a credible foundation for a production workflow.`,
      'The project has a useful shape for discussing decisions in a technical interview.'
    ],
    nextSteps: [
      'Add one concrete result: latency, adoption, cost, or another user-facing metric.',
      `Explain how you would validate the next iteration${context ? ` for ${context}` : ''}.`
    ]
  };
}

async function modelReview(input) {
  if (!process.env.OPENAI_API_KEY) return localReview(input);

  const result = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a concise portfolio coach. Return JSON with summary (string), strengths (array of 2 strings), and nextSteps (array of 2 strings).' },
        { role: 'user', content: JSON.stringify(input) }
      ]
    })
  });

  if (!result.ok) throw new Error(`Model request failed with ${result.status}`);
  const data = await result.json();
  return { source: 'openai', ...JSON.parse(data.choices[0].message.content) };
}

async function handleReview(request, response) {
  let body = '';
  for await (const chunk of request) body += chunk;

  try {
    const input = JSON.parse(body);
    if (!input.project || !input.stack) {
      sendJson(response, 400, { error: 'Project and stack are required.' });
      return;
    }
    sendJson(response, 200, await modelReview(input));
  } catch (error) {
    sendJson(response, 500, { error: error.message || 'Unable to create a review.' });
  }
}

async function serveFile(request, response) {
  const requested = request.url === '/' ? '/index.html' : request.url;
  const safePath = normalize(join(publicDir, requested.split('?')[0])).replace(/^[.][\\/]/, '');
  if (!safePath.startsWith(publicDir)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const file = await readFile(safePath);
    response.writeHead(200, { 'Content-Type': mimeTypes[extname(safePath)] || 'application/octet-stream' });
    response.end(file);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}

createServer(async (request, response) => {
  if (request.method === 'POST' && request.url === '/api/review') {
    await handleReview(request, response);
    return;
  }
  if (request.method === 'GET') {
    await serveFile(request, response);
    return;
  }
  sendJson(response, 405, { error: 'Method not allowed.' });
}).listen(port, () => {
  console.log(`Portfolio AI demo running at http://localhost:${port}`);
});
