import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} → ${violation.nodes.map((node) => node.target).join(', ')}`,
  );
  expect(summary).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  // Sin animaciones: axe evalúa el contenido final (las animaciones de aparición usan opacidad).
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('la página principal no tiene violaciones de accesibilidad WCAG 2.2 AA', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Come mejor y crea hábitos que duran',
  );
  await expectNoA11yViolations(page);
});

test('la página 404 es accesible y permite volver al inicio', async ({ page }) => {
  const response = await page.goto('./ruta-que-no-existe/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('No encontramos esta página');
  await expectNoA11yViolations(page);

  await page.getByRole('link', { name: 'Volver al inicio' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Come mejor y crea hábitos que duran',
  );
});

test('los CTA de cuenta llevan al módulo de autenticación del web-app', async ({ page }) => {
  await page.goto('./');
  const main = page.getByRole('main');

  await expect(main.getByRole('link', { name: 'Empieza gratis' })).toHaveAttribute(
    'href',
    /\/auth\/register$/,
  );
  await expect(main.getByRole('link', { name: 'Ya tengo una cuenta' })).toHaveAttribute(
    'href',
    /\/auth\/login$/,
  );
});

test('el menú móvil se abre, navega y se cierra con Escape', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'El menú desplegable solo existe en pantallas pequeñas');
  await page.goto('./');

  const toggle = page.getByRole('button', { name: 'Menú' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const mobileNav = page.getByRole('navigation', { name: 'Principal (móvil)' });
  await expect(mobileNav).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(mobileNav).toBeHidden();
  await expect(toggle).toBeFocused();

  await toggle.click();
  await mobileNav.getByRole('link', { name: 'Preguntas' }).click();
  await expect(mobileNav).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Resolvemos tus dudas' })).toBeInViewport();
  expect(new URL(page.url()).hash).toBe('');
});

test('la navegación entre secciones no añade "#" a la URL', async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), 'En móvil se cubre con la prueba del menú desplegable');
  await page.goto('./');
  const urlBefore = page.url();

  await page
    .getByRole('navigation', { name: 'Principal', exact: true })
    .getByRole('link', { name: 'Contacto' })
    .click();

  await expect(page.getByRole('heading', { name: '¿Hablamos?' })).toBeInViewport();
  await expect(page.locator('#contacto')).toBeFocused();
  expect(page.url()).toBe(urlBefore);
});

test('un enlace compartido con "#seccion" lleva a la sección y limpia la URL', async ({ page }) => {
  await page.goto('./#faq');

  await expect(page.getByRole('heading', { name: 'Resolvemos tus dudas' })).toBeInViewport();
  await expect.poll(() => new URL(page.url()).hash).toBe('');
});

test('el formulario de contacto valida y envía a la API', async ({ page }) => {
  let payload: Record<string, string> | undefined;
  await page.route('**/api/v1/contact', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 204 });
  });

  await page.goto('./#contacto');
  // La isla React se hidrata al entrar en pantalla (client:visible).
  await page.locator('astro-island:not([ssr])').waitFor();

  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByLabel('Nombre', { exact: true })).toBeFocused();

  await page.getByLabel('Nombre', { exact: true }).fill('Ana');
  await page.getByLabel('Apellido').fill('Torres');
  await page.getByLabel('Correo electrónico').fill('ana@correo.com');
  await page.getByLabel('Mensaje').fill('Quisiera más información sobre los planes.');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();

  await expect(page.getByRole('heading', { name: '¡Gracias, Ana!' })).toBeVisible();
  expect(payload).toMatchObject({ nombre: 'Ana', correo: 'ana@correo.com', website: '' });
});

test.describe('animaciones', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });

  test('el hero entra con animación y todo su contenido termina visible', async ({ page }) => {
    await page.goto('./');
    const title = page.getByRole('heading', { level: 1 });
    await expect(title).toHaveCSS('animation-name', 'enter-up');

    // Al terminar la secuencia (≈1,9 s) nada debe quedar oculto.
    await page.waitForTimeout(2200);
    const hidden = await page
      .locator('#inicio [data-enter]:visible')
      .evaluateAll(
        (elements) =>
          elements.filter((element) => getComputedStyle(element).opacity !== '1').length,
      );
    expect(hidden).toBe(0);
  });

  test('las preguntas frecuentes se abren y cierran con una transición de altura', async ({
    page,
  }) => {
    await page.goto('./#faq');
    const item = page.locator('details[data-accordion-item]').first();
    const summary = item.locator('summary');
    const collapsed = await item.evaluate((element) => element.getBoundingClientRect().height);

    await summary.click();
    await page.waitForTimeout(250);
    const midway = await item.evaluate((element) => element.getBoundingClientRect().height);

    await expect(item).toHaveAttribute('open', '');
    await expect(item.getByText(/plan Básico sin costo/)).toBeVisible();
    await page.waitForTimeout(700);
    const expanded = await item.evaluate((element) => element.getBoundingClientRect().height);

    // A mitad de camino la altura está entre cerrada y abierta: hubo transición.
    expect(midway).toBeGreaterThan(collapsed);
    expect(midway).toBeLessThan(expanded);

    await summary.click();
    await expect(item).not.toHaveAttribute('open', '');
  });
});

test.describe('políticas y seguridad', () => {
  for (const policy of [
    { path: './privacidad/', heading: 'Política de privacidad' },
    { path: './seguridad/', heading: 'Política de seguridad' },
  ]) {
    test(`${policy.heading}: accesible y enlazada desde el pie`, async ({ page }) => {
      await page.goto('./');
      await page
        .getByRole('contentinfo')
        .getByRole('link', { name: policy.heading.replace('Política de ', ''), exact: false })
        .first()
        .click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(policy.heading);
      await expect(page.getByRole('main')).toContainText('proyecto académico y de portafolio');
      await expectNoA11yViolations(page);
    });
  }

  test('la CSP no bloquea nada en las páginas (scripts, estilos ni la isla de contacto)', async ({
    page,
  }) => {
    const violations: string[] = [];
    await page.exposeFunction('reportCspViolation', (detail: string) => violations.push(detail));
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (event) => {
        // @ts-expect-error: expuesta con exposeFunction.
        window.reportCspViolation(`${event.violatedDirective} ${event.blockedURI}`);
      });
    });

    for (const path of ['./', './privacidad/', './seguridad/', './ruta-que-no-existe/']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    }
    await page.goto('./#contacto');
    await page.locator('astro-island:not([ssr])').waitFor();

    const csp = await page
      .locator('meta[http-equiv="content-security-policy"]')
      .getAttribute('content');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(violations).toEqual([]);
  });

  test('security.txt publica el contacto y la política', async ({ request }) => {
    const response = await request.get('./.well-known/security.txt');
    expect(response.ok()).toBe(true);
    const body = await response.text();
    expect(body).toContain('Contact: mailto:projects@vfernandezg.dev');
    expect(body).toContain('Policy: https://healthybites.vfernandezg.dev/seguridad/');
  });
});
