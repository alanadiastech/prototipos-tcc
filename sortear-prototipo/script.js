function iniciarEstudo() {
  const resultado = Math.random() < 0.5 ? 'Protótipo A' : 'Protótipo B';
  const resultCard = document.getElementById('resultado');
  resultCard.textContent = resultado;
  resultCard.style.display = 'block';
}