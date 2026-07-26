const category = document.querySelector('#category');
const audience = document.querySelector('#audience');
const mood = document.querySelector('#mood');
const form = document.querySelector('#brand-form');
const notice = document.querySelector('#form-notice');
const empty = document.querySelector('#empty-output');
const content = document.querySelector('#concept-content');
const names = ['AURA', 'NOVA', 'MERA', 'VERA', 'SOLA', 'RITM', 'LINO', 'ORA'];
const palettes = [['#ff795e','#d7ff4f','#15201d','#eeece3'],['#9cc7ef','#f5d6a9','#213754','#fff9ef'],['#b7cb74','#f06a4d','#48382c','#f3eddb']];
let number = 0;

document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => {
  [category.value, audience.value, mood.value] = button.dataset.preset.split('|');
}));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  number += 1;
  const seed = [...`${category.value}${audience.value}${mood.value}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const selectedName = names[seed % names.length];
  const voice = mood.value.split(/[,;–—]+/).map((item) => item.trim().toLowerCase()).filter(Boolean).slice(0, 3);
  const colors = palettes[seed % palettes.length];
  document.querySelector('#concept-number').textContent = `Новая концепция / ${String(number).padStart(3, '0')}`;
  document.querySelector('#concept-name').textContent = selectedName;
  document.querySelector('#concept-tagline').textContent = `${category.value.trim()} — в своём ясном ритме.`;
  document.querySelector('#concept-description').textContent = `Для ${audience.value.trim().toLowerCase()} это не просто ${category.value.trim().toLowerCase()}, а знак принадлежности к новому, более осмысленному выбору.`;
  document.querySelector('#voice-tags').innerHTML = voice.map((item) => `<span>${item || 'живой'}</span>`).join('');
  document.querySelector('#swatches').innerHTML = colors.map((color) => `<i style="background:${color}" title="${color}"></i>`).join('');
  empty.hidden = true; content.hidden = false;
  notice.textContent = 'Концепция собрана локально — ничего никуда не отправлено.';
  document.querySelector('#library').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.querySelector('#copy-idea').addEventListener('click', async () => {
  const text = `${document.querySelector('#concept-name').textContent} — ${document.querySelector('#concept-tagline').textContent}`;
  try { await navigator.clipboard.writeText(text); document.querySelector('#copy-idea').textContent = 'Скопировано ✓'; } catch { document.querySelector('#copy-idea').textContent = 'Готово ✓'; }
});

const modal = document.querySelector('#modal');
document.querySelector('#open-modal').addEventListener('click', () => { modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); });
document.querySelector('#close-modal').addEventListener('click', () => { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); });
modal.addEventListener('click', (event) => { if (event.target === modal) document.querySelector('#close-modal').click(); });
document.querySelector('#fake-signup').addEventListener('click', () => { document.querySelector('#modal-note').textContent = 'Готово — демонстрационная регистрация завершена. Почта никуда не отправлялась.'; });
