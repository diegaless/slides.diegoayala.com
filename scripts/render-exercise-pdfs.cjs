/* Genera los PDF de la selección pública usando su HTML y sus estilos locales. */
const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    if (process.argv.includes('--check')) return;
    const tasks = JSON.parse(fs.readFileSync(0, 'utf8'));
    const context = await browser.newContext();
    await context.route('**/*', route => {
      const protocol = new URL(route.request().url()).protocol;
      return ['file:', 'data:', 'about:'].includes(protocol) ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    for (const task of tasks) {
      await page.goto(pathToFileURL(task.html).href, { waitUntil: 'load' });
      const download = await page.locator('#task-pdf-download').getAttribute('href');
      if (!download || path.resolve(fileURLToPath(new URL(download, pathToFileURL(task.html)))) !== path.resolve(task.pdf)) {
        throw new Error(`El destino PDF no coincide con el botón: ${task.html}`);
      }
      await page.evaluate(async () => {
        // Incluir todos los cursos aunque la web muestre solo el más reciente abierto.
        document.querySelectorAll('details.project-course').forEach(details => { details.open = true; });
        await document.fonts.ready;
        await Promise.all([...document.images].map(img => img.decode()));
        // El panel de metadatos y los controles pertenecen a la web, no al PDF.
        document.querySelectorAll('.task-aside').forEach(element => element.remove());
        if (document.querySelector('.attachments li')) {
          const note = document.createElement('p');
          note.className = 'pdf-materials-note';
          note.textContent = 'Los archivos adjuntos se descargan por separado desde la página de esta tarea.';
          document.querySelector('.attachments').before(note);
        }
        // Conservar los enlaces externos sin incluir rutas del disco local.
        for (const anchor of document.querySelectorAll('a[href]')) {
          if (new URL(anchor.href).protocol === 'file:') anchor.removeAttribute('href');
        }
      });
      const bytes = await page.pdf({
        preferCSSPageSize: true,
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: '<div style="font:9px sans-serif;color:#667085;width:100%;text-align:center">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>'
      });
      if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
        throw new Error(`La salida no es un PDF: ${task.pdf}`);
      }
      const temporary = path.join(path.dirname(task.pdf), '.enunciado-pdf.tmp');
      fs.writeFileSync(temporary, bytes);
      fs.renameSync(temporary, task.pdf);
    }
    console.log(`${tasks.length} PDF generados sin el panel «Sobre esta tarea».`);
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
