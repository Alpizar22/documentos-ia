async function esperarResultado(documentId) {
  const statusEl = document.getElementById("status");

  const interval = setInterval(async () => {
    const res = await fetch(
      `https://wy28p8c6f7.execute-api.us-east-2.amazonaws.com/prod/status?documentId=${encodeURIComponent(documentId)}`
    );

    const data = await res.json();

    if (data.status === "PENDIENTE") {
      statusEl.innerText = "⏳ Validando documento...";
      return;
    }

    clearInterval(interval);

    if (data.status === "APROBADO") {
      statusEl.innerText = "✅ Documento APROBADO";
    } else if (data.status === "RECHAZADO") {
      statusEl.innerText =
        "❌ Documento RECHAZADO:\n" + data.errors.join("\n");
    } else {
      statusEl.innerText = "⚠️ Error inesperado";
    }
  }, 3000);
}
