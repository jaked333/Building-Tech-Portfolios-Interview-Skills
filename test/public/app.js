const form = document.querySelector('#review-form');
const result = document.querySelector('#result');
const source = document.querySelector('#source');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true;
  button.classList.add('loading');
  button.querySelector('span').textContent = 'Thinking...';
  source.textContent = 'PROCESSING';

  const payload = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    source.textContent = data.source === 'openai' ? 'OPENAI' : 'LOCAL MODEL';
    result.innerHTML = `<div class="panel-top"><span>OUTPUT / SIGNAL REPORT</span><span id="source" class="mono">${source.textContent}</span></div><div class="report"><h2>${data.summary}</h2><div class="report-grid"><div><h3>What is working</h3><ul>${data.strengths.map((item) => `<li>${item}</li>`).join('')}</ul></div><div><h3>Make it sharper</h3><ul>${data.nextSteps.map((item) => `<li>${item}</li>`).join('')}</ul></div></div></div>`;
  } catch (error) {
    source.textContent = 'ERROR';
    result.querySelector('.empty-state').innerHTML = `<span class="pulse">!</span><h2>Could not create the report.</h2><p>${error.message}</p>`;
  } finally {
    button.disabled = false;
    button.classList.remove('loading');
    button.querySelector('span').textContent = 'Generate review';
  }
});
