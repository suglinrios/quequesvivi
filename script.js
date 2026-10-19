// IMPORTANTE: colocá aquí el número de WhatsApp del negocio con código de país.
// Ejemplo para Costa Rica: "50688888888" (sin +, espacios ni guiones).
const WHATSAPP_NEGOCIO = "50688787845";

const form = document.getElementById('orderForm');
const fileInput = document.getElementById('referencia');
const zone = document.getElementById('dropZone');
const previewWrap = document.getElementById('previewWrap');
const preview = document.getElementById('preview');
const fileName = document.getElementById('fileName');
const message = document.getElementById('formMessage');
let photoUrl = null;

// Para evitar solicitar fechas anteriores al día actual.
const today = new Date();
const localToday = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
document.getElementById('fecha').min = localToday;
document.getElementById('year').textContent = today.getFullYear();

function updateImage(file) {
  if (photoUrl) { URL.revokeObjectURL(photoUrl); photoUrl = null; }
  message.textContent = '';
  if (!file) { fileInput.value = ''; previewWrap.hidden = true; preview.removeAttribute('src'); return; }
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
    message.textContent = 'Seleccioná una imagen JPG, PNG o WEBP.'; fileInput.value=''; previewWrap.hidden=true; return;
  }
  if (file.size > 8 * 1024 * 1024) {
    message.textContent = 'La imagen debe pesar menos de 8 MB.'; fileInput.value=''; previewWrap.hidden=true; return;
  }
  photoUrl = URL.createObjectURL(file);
  preview.src = photoUrl;
  fileName.textContent = file.name;
  previewWrap.hidden = false;
}
fileInput.addEventListener('change', () => updateImage(fileInput.files[0]));
document.getElementById('removePhoto').addEventListener('click', () => updateImage(null));
['dragenter','dragover'].forEach(type => zone.addEventListener(type, e => { e.preventDefault(); zone.classList.add('dragging'); }));
['dragleave','drop'].forEach(type => zone.addEventListener(type, e => { e.preventDefault(); zone.classList.remove('dragging'); }));
zone.addEventListener('drop', e => {
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const dt = new DataTransfer(); dt.items.add(file); fileInput.files = dt.files;
  updateImage(file);
});

// Los botones del catálogo seleccionan el producto y llevan al formulario.
document.querySelectorAll('[data-product]').forEach(button => {
  button.addEventListener('click', () => {
    document.getElementById('producto').value = button.dataset.product;
    document.getElementById('encargos').scrollIntoView({behavior:'smooth'});
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  if (!form.reportValidity()) return;

  const get = id => document.getElementById(id).value.trim();
  if (get('fecha') < localToday) { message.textContent = 'Elegí una fecha de hoy en adelante.'; return; }

  const fecha = new Date(`${get('fecha')}T12:00:00`).toLocaleDateString('es-CR', {day:'numeric',month:'long',year:'numeric'});
  const tieneFoto = Boolean(fileInput.files[0]);
  const texto = [
    '¡Hola, Queques Vivi! ♡ Quisiera consultar por un encargo.',
    '',
    `*Nombre:* ${get('nombre')}`,
    `*Mi WhatsApp:* ${get('telefono')}`,
    `*Producto:* ${get('producto')}`,
    `*Fecha deseada:* ${fecha}`,
    `*Porciones o cantidad:* ${get('cantidad') || 'Por definir'}`,
    `*Sabor:* ${get('sabor') || 'Por definir'}`,
    `*Mi idea:* ${get('detalles')}`,
    `*Foto de referencia:* ${tieneFoto ? 'Sí, la adjuntaré a continuación.' : 'No'}`,
    '',
    '¿Me podrían confirmar disponibilidad y cotización? ¡Gracias!'
  ].join('\n');

  if (!/^\d{8,15}$/.test(WHATSAPP_NEGOCIO)) {
    // Modo demostración: evita enviar a un número incorrecto.
    try { await navigator.clipboard.writeText(texto); message.textContent = '¡Pedido preparado y copiado! Para activar el envío directo, configurá el número del negocio en script.js.'; }
    catch { message.textContent = 'Configurá el número del negocio en script.js para activar WhatsApp.'; }
    return;
  }
  const url = `https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(texto)}`;
  const newTab = window.open(url, '_blank', 'noopener,noreferrer');
  if (!newTab) window.location.href = url;
  message.textContent = tieneFoto ? '¡Listo! Cuando se abra WhatsApp, adjuntá la foto de referencia al chat. La imagen no se envía automáticamente.' : '¡Listo! Se preparó tu mensaje en WhatsApp.';
});
