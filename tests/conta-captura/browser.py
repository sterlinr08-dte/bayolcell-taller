"""QA local con Playwright y PostgreSQL efímero. Nunca abre producción."""
import os, base64, json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
BASE=os.getenv('QA_BASE','http://127.0.0.1:8960')
OUT=Path(os.getenv('QA_OUT','/workspace/scratch/captura-guiada'));OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for width in [390,1280]:
        context=browser.new_context(viewport={'width':width,'height':844},reduced_motion='reduce',locale='es-DO')
        context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(BASE) else route.abort())
        context.request.post(BASE+'/reset',data='{}',headers={'content-type':'application/json'})
        page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(BASE);page.wait_for_load_state('networkidle');expect(page.locator('#pcAvance')).to_contain_text('46 Sin monto')
        expect(page.locator('#peResumen')).to_contain_text('Resultado provisional')
        assert 'Ganancia ·' not in page.locator('#peResumen').inner_text()
        page.get_by_role('tab',name='Santiago',exact=True).click()
        row=page.locator('.pc-gasto').first
        row.locator('[data-pc-estado]').select_option('confirmado')
        expect(page.locator('#aviso')).to_contain_text('Escriba el monto')
        assert page.evaluate('BayolEquilibrio._estado().filas[1].gastos[0].monto')==''
        row.locator('.pe-g-m').fill('12000')
        row.locator('[data-pc-estado]').select_option('estimado')
        expect(page.locator('#pcAvance')).to_contain_text('1 Estimados')
        row.locator('.pe-g-m').fill('13000')
        expect(row.locator('[data-pc-estado]')).to_have_value('revisar')
        row.locator('summary').click();row.locator('[data-pc-nota]').fill('Alquiler de noviembre, recibo recibido.');row.locator('[data-pc-nota]').blur()
        row.locator('[data-pc-estado]').select_option('confirmado')
        expect(page.locator('#pcAvance')).to_contain_text('1 / 46')
        second=page.locator('.pc-gasto').nth(1);second.locator('.pe-g-m').fill('0');second.locator('[data-pc-estado]').select_option('confirmado')
        expect(page.locator('#pcAvance')).to_contain_text('2 / 46')
        # No se permite el texto como soporte ejecutable ni se confirma un gasto por subir un archivo.
        row.locator('input[type=file]').set_input_files({'name':'prueba.txt','mimeType':'text/plain','buffer':b'bad'})
        expect(page.locator('#aviso')).to_contain_text('foto o PDF')
        png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGZkAAAAASUVORK5CYII=')
        row.locator('input[type=file]').set_input_files({'name':'recibo-noviembre.png','mimeType':'image/png','buffer':png})
        page.wait_for_function('BayolCaptura.ocupado()')
        page.evaluate("BayolEquilibrio.mes('2026-12')")
        assert page.evaluate('BayolEquilibrio._estado().mes')=='2026-11'
        page.wait_for_function('!BayolCaptura.ocupado()')
        expect(page.locator('.pc-file')).to_have_text('recibo-noviembre.png')
        stale=context.new_page();stale.goto(BASE);stale.wait_for_load_state('networkidle');stale.get_by_role('tab',name='Santiago',exact=True).click()
        page.locator('#peBtnGuardar').click();expect(page.locator('#aviso')).to_contain_text('guardados')
        stale.locator('.pc-gasto').first.locator('.pe-g-m').fill('1');stale.locator('#peBtnGuardar').click()
        expect(stale.locator('#aviso')).to_contain_text('Otra persona cambió')
        page.reload();page.wait_for_load_state('networkidle');page.get_by_role('tab',name='Santiago',exact=True).click()
        row=page.locator('.pc-gasto').first
        expect(row.locator('.pe-g-m')).to_have_value('13000');expect(row.locator('[data-pc-estado]')).to_have_value('confirmado');expect(page.locator('.pc-file')).to_have_text('recibo-noviembre.png')
        # XSS escapado incluso en notas de libre captura.
        row.locator('[data-pc-nota]').fill('<img src=x onerror="window.pcXss=true">');row.locator('[data-pc-nota]').blur();page.evaluate('BayolEquilibrio._pintar()');assert not page.evaluate('Boolean(window.pcXss)')
        # Capturas con archivos y autor persistidos.
        row.locator('[data-pc-nota]').fill('Alquiler de noviembre. Recibo recibido.');row.locator('[data-pc-nota]').blur()
        page.evaluate('window.scrollTo(0,0)');page.screenshot(path=str(OUT/f'captura-{width}.png'),full_page=False)
        page.locator('.pc-gasto').first.scroll_into_view_if_needed();page.screenshot(path=str(OUT/f'gasto-{width}.png'),full_page=False)
        measures=page.evaluate('''() => [...document.querySelectorAll('.pc-gasto select,.pc-gasto input,.pc-gasto textarea,.pc-gasto summary,.pc-file,#peBtnGuardar')].filter(e=>e.getBoundingClientRect().height>0).map(e=>({tag:e.tagName,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height,font:parseFloat(getComputedStyle(e).fontSize)}))''')
        assert all(x['h']>=44 for x in measures),measures
        assert all(x['h']>=48 and x['font']>=16 for x in measures if x['tag'] in ['SELECT','TEXTAREA']),measures
        assert page.evaluate('document.documentElement.scrollWidth')<=width
        Path(OUT/f'medidas-{width}.json').write_text(json.dumps(measures,indent=2))
        # Copiar nunca reutiliza la confirmación ni el recibo del mes anterior y conserva la versión del destino.
        page.get_by_role('button',name='Copiar del mes anterior').click();expect(page.locator('#aviso')).to_contain_text('Copiado')
        expect(page.locator('.pc-gasto').first.locator('[data-pc-estado]')).to_have_value('estimado');assert page.locator('.pc-file').count()==0
        page.locator('#peBtnGuardar').click();expect(page.locator('#aviso')).to_contain_text('guardados')
        page.reload();page.wait_for_load_state('networkidle');page.get_by_role('tab',name='Santiago',exact=True).click();expect(page.locator('.pc-gasto').first.locator('[data-pc-estado]')).to_have_value('estimado')
        # Todos los ceros explícitos completan captura, nunca implican cierre contable.
        page.evaluate("Object.values(BayolEquilibrio._estado().filas).forEach(f=>f.gastos.forEach(g=>{g.monto=0;g.captura={estado:'confirmado'}}));BayolEquilibrio._pintar()")
        expect(page.locator('#pcAvance')).to_contain_text('Listo para revisión contable')
        # Sin permiso: tampoco presenta los datos de captura.
        page.evaluate('window.testPermiso=false;BayolEquilibrio._pintar()');expect(page.locator('#pe_contenido')).to_contain_text('Necesita permiso')
        assert not errors,errors
        stale.close();context.close();print(f'PASS {width}px: persistencia, cero, estados, soporte, permisos, conflicto, copia, XSS y medidas')
    # Interruptor de reversión: la interfaz previa sigue disponible.
    context=browser.new_context();context.add_init_script("localStorage.setItem('bc_captura_off','1')")
    page=context.new_page();page.goto(BASE);page.wait_for_load_state('networkidle');assert page.evaluate('typeof BayolCaptura')=='undefined';assert page.locator('#pcAvance').count()==0
    context.close();browser.close()
print('PASS reversión de captura')
