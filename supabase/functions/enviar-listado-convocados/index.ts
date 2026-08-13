// Edge Function: envía por mail el PDF del listado de convocados de un
// operativo, a los destinatarios activos configurados en
// produccion_config_notificaciones_operativos.
//
// Se dispara desde OperativosPage.jsx (handleAprobar) recién cuando
// Javier/Valentín aprueba la citación — no en cada guardado de Carlos.
//
// Usa denomailer (SMTP nativo de Deno) en vez de nodemailer: nodemailer vía
// "npm:" depende del compatibilizador de Node para resolver DNS/abrir el
// socket, y ese compatibilizador falla en el runtime de Supabase Edge
// Functions ("queryA UNKNOWN <host>"). denomailer usa Deno.connect
// directamente y no tiene ese problema.
//
// Deploy manual (no ejecutado por el asistente — requiere login/project-ref
// propios de Supabase):
//   supabase login
//   supabase link --project-ref <ref>
//   supabase secrets set \
//     SMTP_HOST=mail.cimomet.com.ar \
//     SMTP_PORT=465 \
//     SMTP_USER=notificaciones@cimomet.com.ar \
//     SMTP_PASS=*** \
//     SMTP_FROM="Panel de Producción <notificaciones@cimomet.com.ar>"
//   supabase functions deploy enviar-listado-convocados

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { SMTPClient } from 'https://deno.land/x/denomailer/mod.ts'

const TIPO_LABEL: Record<string, string> = { Sabado: 'Sábado' }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fmtFechaLarga(fecha: string) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function armarHtml({
  tipoLabel,
  diaSemana,
  fechaLarga,
  cantidad,
  aprobadoPor,
}: {
  tipoLabel: string
  diaSemana: string
  fechaLarga: string
  cantidad: number
  aprobadoPor: string
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#2563eb;padding:18px 24px;">
              <span style="color:#ffffff;font-size:16px;font-weight:700;">🏭 Panel de Producción</span>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px;font-size:15px;color:#0f172a;">¡Hola, buen día! 👋</p>
              <p style="margin:0 0 20px;font-size:14px;color:#334155;line-height:1.5;">
                Se aprobó el plantel convocado para el <strong>${tipoLabel} ${fechaLarga}</strong>.
                Se adjunta el listado completo en PDF.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <tr><td style="padding:14px 18px 6px;font-size:13.5px;color:#334155;">📅&nbsp; ${diaSemana} ${fechaLarga}</td></tr>
                <tr><td style="padding:0 18px 6px;font-size:13.5px;color:#334155;">👥&nbsp; ${cantidad} persona${cantidad === 1 ? '' : 's'} citada${cantidad === 1 ? '' : 's'}</td></tr>
                <tr><td style="padding:0 18px 14px;font-size:13.5px;color:#334155;">✅&nbsp; Aprobado por ${aprobadoPor}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <span style="font-size:11.5px;color:#94a3b8;">Cimomet S.A. &amp; Co.mo.ing S.R.L.</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido' }, 405)
  }

  try {
    const { fecha, tipo, diaSemana, cantidad, pdfBase64, aprobadoPor } = await req.json()

    if (!fecha || !pdfBase64 || !cantidad) {
      return jsonResponse({ error: 'Faltan datos del listado (fecha/cantidad/pdfBase64)' }, 400)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: destinatarios, error: destErr } = await supabaseAdmin
      .from('produccion_config_notificaciones_operativos')
      .select('email')
      .eq('activo', true)

    if (destErr) throw destErr
    if (!destinatarios || !destinatarios.length) {
      return jsonResponse({ error: 'No hay destinatarios activos configurados en "Destinatarios del listado"' }, 422)
    }

    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get('SMTP_HOST')!.trim(),
        port: Number(Deno.env.get('SMTP_PORT') || 465),
        tls: true,
        auth: {
          username: Deno.env.get('SMTP_USER')!.trim(),
          password: Deno.env.get('SMTP_PASS')!.trim(),
        },
      },
    })

    const tipoLabel = TIPO_LABEL[tipo] || tipo
    const fechaLarga = fmtFechaLarga(fecha)
    const asunto = `Listado de convocados — ${tipoLabel} ${fechaLarga}`
    const html = armarHtml({
      tipoLabel,
      diaSemana,
      fechaLarga,
      cantidad,
      aprobadoPor: aprobadoPor || '—',
    })

    try {
      await client.send({
        from: Deno.env.get('SMTP_FROM')!.trim(),
        to: destinatarios.map((d: { email: string }) => d.email),
        subject: asunto,
        content: 'auto',
        html,
        attachments: [
          {
            filename: `listado-convocados-${fecha}.pdf`,
            content: pdfBase64,
            encoding: 'base64',
          },
        ],
      })
    } finally {
      try {
        await client.close()
      } catch {
        // ignorar — si send() ya falló, un error acá taparía el mensaje real
      }
    }

    return jsonResponse({ ok: true, enviados: destinatarios.length })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
