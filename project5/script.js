const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const cards = $$('.product-card');
const searchInput = $('#search-input');
const emptySearch = $('#empty-search');
const toast = $('#toast');
let activeFilter = 'all';
let currentProduct = { title: 'Fujifilm X100V', price: 48 };
let toastTimer;

function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

function openModal(name) {
  const modal = $(`#${name}-modal`);
  if (!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

$$('[data-open]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.open)));
$$('[data-close]').forEach(button => button.addEventListener('click', () => closeModal(button.closest('.modal'))));
$$('.modal').forEach(modal => modal.addEventListener('click', event => {
  if (event.target === modal) closeModal(modal);
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal($('.modal.open'));
});

function filterCatalog() {
  const query = searchInput.value.trim().toLowerCase();
  let visible = 0;
  cards.forEach(card => {
    const categoryMatch = activeFilter === 'all' || card.dataset.category === activeFilter;
    const textMatch = !query || card.textContent.toLowerCase().includes(query);
    const show = categoryMatch && textMatch;
    card.classList.toggle('is-hidden', !show);
    if (show) visible += 1;
  });
  emptySearch.hidden = visible > 0;
}

$$('.filter').forEach(button => button.addEventListener('click', () => {
  $$('.filter').forEach(filter => filter.classList.remove('active'));
  button.classList.add('active');
  activeFilter = button.dataset.filter;
  filterCatalog();
}));

$('#hero-search').addEventListener('submit', event => {
  event.preventDefault();
  activeFilter = 'all';
  $$('.filter').forEach(filter => filter.classList.toggle('active', filter.dataset.filter === 'all'));
  filterCatalog();
  $('#catalog').scrollIntoView({ behavior: 'smooth' });
});
searchInput.addEventListener('input', filterCatalog);

$$('.heart').forEach(heart => heart.addEventListener('click', event => {
  event.stopPropagation();
  heart.classList.toggle('active');
  heart.textContent = heart.classList.contains('active') ? '♥' : '♡';
  $('#favorite-count').textContent = $$('.heart.active').length;
  notify(heart.classList.contains('active') ? 'Добавлено в избранное' : 'Удалено из избранного');
}));

$('#favorites-button').addEventListener('click', () => {
  const favorites = $$('.heart.active');
  if (!favorites.length) return notify('В избранном пока пусто');
  cards.forEach(card => card.classList.toggle('is-hidden', !$('.heart', card).classList.contains('active')));
  emptySearch.hidden = true;
  $('#catalog').scrollIntoView({ behavior: 'smooth' });
  notify(`Избранных вещей: ${favorites.length}`);
});

function dateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const nextDay = new Date(today);
nextDay.setDate(today.getDate() + 2);
$('#date-from').min = dateValue(today);
$('#date-from').value = dateValue(tomorrow);
$('#date-to').min = dateValue(tomorrow);
$('#date-to').value = dateValue(nextDay);

function updateTotal() {
  const from = new Date(`${$('#date-from').value}T12:00:00`);
  const to = new Date(`${$('#date-to').value}T12:00:00`);
  const difference = Math.ceil((to - from) / 86400000);
  const days = Number.isFinite(difference) && difference > 0 ? difference : 1;
  const word = days === 1 ? 'день' : days < 5 ? 'дня' : 'дней';
  $('#booking-days').textContent = `${days} ${word}`;
  $('#booking-total').textContent = `${days * currentProduct.price} BYN`;
}

$$('.book-button').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('.product-card');
  currentProduct = { title: card.dataset.title, price: Number(card.dataset.price) };
  $('#booking-title').textContent = currentProduct.title;
  $('#booking-price').textContent = `${currentProduct.price} BYN`;
  $('#booking-note').textContent = 'Деньги не списываются.';
  updateTotal();
  openModal('booking');
}));

$('#date-from').addEventListener('change', () => {
  const start = new Date(`${$('#date-from').value}T12:00:00`);
  const following = new Date(start);
  following.setDate(start.getDate() + 1);
  $('#date-to').min = dateValue(following);
  if ($('#date-to').value <= $('#date-from').value) $('#date-to').value = dateValue(following);
  updateTotal();
});
$('#date-to').addEventListener('change', updateTotal);
$('#confirm-booking').addEventListener('click', () => {
  $('#booking-note').textContent = '✓ Демо-запрос создан. Реальные данные не отправлялись.';
  notify(`Запрос на ${currentProduct.title} создан`);
});

$('#login-form').addEventListener('submit', event => {
  event.preventDefault();
  $('#login-note').textContent = '✓ Демо-вход выполнен.';
  notify('Добро пожаловать в RE:USE');
});

const fileInput = $('.upload-drop input');
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) {
    $('.upload-drop b').textContent = `ВЫБРАНО ФАЙЛОВ: ${fileInput.files.length}`;
  }
});
$('#listing-form').addEventListener('submit', event => {
  event.preventDefault();
  $('#listing-note').textContent = '✓ Демо-объявление создано локально.';
  notify('Объявление готово');
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
$$('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  observer.observe(element);
});

if (matchMedia('(pointer:fine)').matches) {
  document.addEventListener('pointermove', event => {
    $('.cursor-glow').style.left = `${event.clientX}px`;
    $('.cursor-glow').style.top = `${event.clientY}px`;
  });
  $$('.tilt').forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 5;
      const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -5;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => card.style.transform = '');
  });
}

updateTotal();
