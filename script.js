function subirDocumento() {
  const file = document.getElementById("fileInput").files[0];

  if (!file) {
    alert("Selecciona un archivo");
    return;
  }

  document.getElementById("status").innerText =
    "📤 Documento listo. Próximo paso: conectarlo con AWS...";
}

