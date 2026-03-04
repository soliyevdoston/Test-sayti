const buildCertificateHtml = ({
  studentName = "",
  testTitle = "",
  totalScore = 0,
  correctCount = 0,
  wrongCount = 0,
  issuedBy = "OsonTestOl",
  issuedAt = new Date().toISOString(),
} = {}) => {
  const safeName = String(studentName || "O'quvchi");
  const safeTest = String(testTitle || "Online test");
  const safeIssuer = String(issuedBy || "OsonTestOl");
  const dateLabel = new Date(issuedAt).toLocaleString("uz-UZ");

  return `
<!doctype html>
<html lang="uz">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>Sertifikat - ${safeName}</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", Arial, sans-serif;
        background: #f5f7ff;
        padding: 24px;
      }
      .sheet {
        max-width: 980px;
        margin: 0 auto;
        background: #fff;
        border: 2px solid #dbe5ff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 20px 50px rgba(37, 99, 235, 0.15);
      }
      .top {
        background: linear-gradient(135deg, #1d4ed8, #3b82f6);
        color: #fff;
        padding: 26px 36px;
      }
      .brand {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: .2em;
        opacity: .88;
      }
      .title {
        margin-top: 6px;
        font-size: 36px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }
      .body {
        padding: 34px 36px;
      }
      .label {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: .14em;
        color: #64748b;
        font-weight: 700;
      }
      .name {
        margin-top: 8px;
        font-size: 44px;
        font-weight: 900;
        color: #0f172a;
        letter-spacing: -0.02em;
      }
      .desc {
        margin-top: 12px;
        color: #334155;
        font-size: 16px;
      }
      .stats {
        margin-top: 20px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .stat {
        border: 1px solid #dbe5ff;
        border-radius: 14px;
        padding: 12px;
        background: #f8faff;
      }
      .stat p {
        margin: 0;
      }
      .stat .k {
        color: #64748b;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: .1em;
        font-weight: 700;
      }
      .stat .v {
        margin-top: 5px;
        color: #0f172a;
        font-size: 30px;
        font-weight: 900;
      }
      .meta {
        margin-top: 22px;
        display: flex;
        justify-content: space-between;
        gap: 16px;
        color: #334155;
        font-size: 14px;
      }
      @media print {
        body { background: #fff; padding: 0; }
        .sheet { box-shadow: none; border-radius: 0; border: 0; }
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <header class="top">
        <div class="brand">OsonTestOl • testonlinee.uz</div>
        <div class="title">Natija Sertifikati</div>
      </header>
      <section class="body">
        <div class="label">Muvaffaqiyatli yakunlagan foydalanuvchi</div>
        <div class="name">${safeName}</div>
        <p class="desc">
          <strong>${safeTest}</strong> testi bo'yicha yakuniy natija qayd etildi.
        </p>
        <div class="stats">
          <article class="stat">
            <p class="k">Jami ball</p>
            <p class="v">${Number(totalScore || 0)}</p>
          </article>
          <article class="stat">
            <p class="k">To'g'ri javob</p>
            <p class="v">${Number(correctCount || 0)}</p>
          </article>
          <article class="stat">
            <p class="k">Xato javob</p>
            <p class="v">${Number(wrongCount || 0)}</p>
          </article>
        </div>
        <div class="meta">
          <span>Berildi: ${dateLabel}</span>
          <span>Mas'ul: ${safeIssuer}</span>
        </div>
      </section>
    </main>
  </body>
</html>`;
};

export const printStudentCertificate = (payload = {}) => {
  const html = buildCertificateHtml(payload);
  const win = window.open("", "_blank", "noopener,noreferrer,width=1024,height=760");
  if (!win) {
    throw new Error("Brauzer pop-up ni blokladi");
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 180);
};

