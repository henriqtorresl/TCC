import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ReportDownloadDataResponse } from "@/components/chat/types";

function display(value: unknown): string {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "Não informado";
  }
  return String(value);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getReportHtml(data: ReportDownloadDataResponse): string {
  const missingCriteriaMapper: Record<string, string> = {
    queixa_principal: "Queixa principal",
    inicio_duracao: "Início e duração",
    evolucao: "Evolução",
    fatores_melhora_piora: "Fatores de melhora/piora",
    sintomas_associados: "Sintomas associados",
    antecedentes: "Antecedentes",
    medicacoes_alergias: "Medicações e alergias",
    habitos_contexto: "Hábitos e contexto",
  };

  const metadata = data.report.metadata ?? {};
  const readiness = metadata.readiness ?? {};
  const sections = metadata.sections ?? {};
  const missingCriteria = Array.isArray(readiness.missing_criteria)
    ? readiness.missing_criteria.map((c) => missingCriteriaMapper[c] ?? c)
    : [];
  const score = typeof readiness.score === "number" ? readiness.score : null;
  const requiredScore =
    typeof readiness.required_score === "number"
      ? readiness.required_score
      : null;
  const readinessOk = readiness.is_ready === true;

  const criteriaHtml =
    missingCriteria.length > 0
      ? `<p><strong>Itens pendentes:</strong></p><ul class="list">${missingCriteria
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join("")}</ul>`
      : "";

  const sectionField = (title: string, value: string | null | undefined) => `
    <div class="field">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(display(value))}</p>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Relatório de Anamnese</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; color: #111827; background: #f3f4f6; }
      .page { max-width: 920px; margin: 24px auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 24px rgba(0,0,0,.06); }
      .header { padding: 24px; background: #0f172a; color: #f8fafc; }
      .header h1 { margin: 0 0 8px; font-size: 26px; }
      .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px 16px; font-size: 14px; line-height: 1.4; }
      .content { padding: 22px 24px 26px; }
      .section { margin-bottom: 20px; }
      .section h2 { margin: 0 0 10px; font-size: 16px; color: #0f172a; }
      .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; background: #ffffff; }
      .summary { white-space: pre-wrap; line-height: 1.5; margin: 0; }
      .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
      .field { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; }
      .field strong { display: block; font-size: 13px; color: #374151; margin-bottom: 6px; }
      .field p { margin: 0; font-size: 14px; line-height: 1.5; }
      .badge { display: inline-block; font-size: 12px; border-radius: 999px; padding: 4px 10px; background: #d1fae5; color: #065f46; font-weight: 600; }
      .badge.warn { background: #fef3c7; color: #92400e; }
      .list { margin: 8px 0 0; padding-left: 18px; }
      .list li { margin-bottom: 4px; }
      .footer { padding: 12px 24px 20px; font-size: 12px; color: #6b7280; }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="header">
        <h1>Relatório de Anamnese</h1>
        <div class="meta">
          <div><strong>Relatório ID:</strong> ${escapeHtml(display(data.report.id))}</div>
          <div><strong>Atendimento ID:</strong> ${escapeHtml(display(data.report.conversation_id || data.attendance.id))}</div>
          <div><strong>Paciente:</strong> ${escapeHtml(display(data.patient.full_name))}</div>
          <div><strong>Gerado em:</strong> ${escapeHtml(display(data.report.generated_at))}</div>
          <div><strong>Status do atendimento:</strong> ${escapeHtml(display(data.attendance.status))}</div>
          <div><strong>Status do relatório:</strong> ${escapeHtml(display(data.report.status))}</div>
        </div>
      </header>

      <section class="content">
        <section class="section">
          <h2>Completude da Anamnese</h2>
          <div class="card">
            ${
              score !== null && requiredScore !== null
                ? `<p>
                    <span class="badge ${readinessOk ? "" : "warn"}">${readinessOk ? "Completo" : "Incompleto"}</span>
                    <strong style="margin-left:8px;">Score:</strong> ${score}/${requiredScore}
                  </p>`
                : "<p>Completude não disponível.</p>"
            }
            ${criteriaHtml}
          </div>
        </section>

        <section class="section">
          <h2>Seções Clínicas</h2>
          <div class="grid-2">
            ${sectionField("Queixa principal", sections.queixa_principal)}
            ${sectionField("Início e duração", sections.inicio_duracao)}
            ${sectionField("Evolução", sections.evolucao)}
            ${sectionField("Fatores de melhora/piora", sections.fatores_melhora_piora)}
            ${sectionField("Sintomas associados", sections.sintomas_associados)}
            ${sectionField("Antecedentes", sections.antecedentes)}
            ${sectionField("Medicações e alergias", sections.medicacoes_alergias)}
            ${sectionField("Hábitos e contexto", sections.habitos_contexto)}
          </div>
        </section>

        <section class="section">
          <h2>Resumo Consolidado</h2>
          <div class="card">
            <p class="summary">${escapeHtml(display(data.report.summary))}</p>
          </div>
        </section>
      </section>

      <footer class="footer">
        Este documento representa triagem/anamnese e não substitui diagnóstico médico.
      </footer>
    </main>
  </body>
</html>`;
}

export async function renderAndDownloadReportPdf(
  data: ReportDownloadDataResponse,
): Promise<void> {
  const html = getReportHtml(data);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "1100px";
  iframe.style.height = "1600px";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  try {
    const iframeDocument = iframe.contentDocument;
    if (!iframeDocument) {
      throw new Error("Não foi possível inicializar o documento do relatório.");
    }

    iframeDocument.open();
    iframeDocument.write(html);
    iframeDocument.close();

    await new Promise<void>((resolve) => {
      if (iframe.contentWindow?.document.readyState === "complete") {
        resolve();
        return;
      }
      iframe.onload = () => resolve();
    });

    const pageEl = iframeDocument.querySelector(".page") as HTMLElement | null;
    if (!pageEl) {
      throw new Error("Não foi possível renderizar o template do relatório.");
    }

    const canvas = await html2canvas(pageEl, {
      scale: 2,
      backgroundColor: "#f3f4f6",
      useCORS: true,
      windowWidth: 1100,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`relatorio-atendimento-${data.attendance.id}-r${data.report.id}.pdf`);
  } finally {
    document.body.removeChild(iframe);
  }
}
