const API_URL = "https://wy28p8c6f7.execute-api.us-east-2.amazonaws.com/presign";

async function subirDocumento() {
  const input = document.getElementById("fileInput");
  const status = document.getElementById("status");

  if (!input.files.length) {
    alert("Selecciona un archivo");
    return;
  }

  const file = input.files[0];
  status.innerText = "⏳ Solicitando autorización...";

  // 1. Pedir URL prefirmada
  const presignResponse = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type
    })
  });

  const { uploadUrl, documentId } = await presignResponse.json();

  // 2. Subir archivo directo a S3
  status.innerText = "📤 Subiendo documento...";

  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file
  });

  status.innerText = `✅ Documento enviado.
ID: ${documentId}
Procesando validación...`;
}
