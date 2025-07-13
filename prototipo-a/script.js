const btn = document.getElementById("generateBtn");
const input = document.getElementById("promptInput");
const img = document.getElementById("generatedImage");
const placeholder = document.getElementById("imagePlaceholder");

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzRBDUM7qDGcT1o4cKK0Qs76H787WWz96qVixWwyPmSBVn_rnE-VxWE63fcQNtuG8a5/exec";

const MAX_USAGE_TIME = 8 * 60 * 1000;
const BLOCK_KEY = "blockedUntil";

let clickCount = 0;
let startTime = 0;

function bloquearUsuario() {
  btn.disabled = true;
  btn.textContent = "Tempo expirado";
  placeholder.style.display = "none";

  localStorage.setItem(BLOCK_KEY, Date.now() + MAX_USAGE_TIME);

  sendData({
    prompt: "USUÁRIO BLOQUEADO POR TEMPO",
    promptSource: "system",
    clickCount,
    elapsedTime: MAX_USAGE_TIME / 1000
  });
}

function checarBloqueio() {
  const blockedUntil = localStorage.getItem(BLOCK_KEY);
  const now = Date.now();

  if (blockedUntil && now < Number(blockedUntil)) {
    bloquearUsuario();
    return true;
  }

  localStorage.removeItem(BLOCK_KEY);
  return false;
}

if (!checarBloqueio()) {
  setTimeout(() => {
    bloquearUsuario();
  }, MAX_USAGE_TIME);
}

btn.addEventListener("click", () => {
  if (btn.disabled) return;

  const prompt = input.value.trim();
  if (!prompt) return;

  clickCount++;
  startTime = Date.now();

  const url = "https://image.pollinations.ai/prompt/"
    + encodeURIComponent(prompt)
    + "?model=flux";

  img.src = "";
  img.style.display = "none";
  btn.disabled = true;
  placeholder.style.display = "block";
  placeholder.textContent = "Carregando...";

  img.onload = () => {
    btn.disabled = false;
    btn.textContent = "Gerar imagem";
    placeholder.style.display = "none";
    img.style.display = "block";

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    sendData({
      prompt,
      promptSource: "typed",
      clickCount,
      elapsedTime
    });

    clickCount = 0;
  };

  img.onerror = () => {
    btn.disabled = false;
    btn.textContent = "Gerar imagem";
    placeholder.textContent = "Não foi possível gerar a imagem.";
  };

  img.src = url;
});

function sendData(data) {
  fetch(WEBHOOK_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: "A",
      ...data
    })
  }).catch(e => console.error('Erro ao enviar dados:', e));
}
