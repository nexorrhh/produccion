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

// El navegador manda un preflight OPTIONS antes del POST (supabase-js
// agrega headers como "apikey"/"authorization", que no son "simples" para
// CORS) — sin estos headers en TODAS las respuestas, el browser corta la
// conexión antes de que la app vea siquiera el resultado real.
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido' }, 405)
  }

  try {
    const { fecha, tipo, diaSemana, cantidad, pdfBase64 } = await req.json()

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
        hostname: Deno.env.get('SMTP_HOST')!,
        port: Number(Deno.env.get('SMTP_PORT') || 465),
        tls: true,
        auth: {
          username: Deno.env.get('SMTP_USER')!,
          password: Deno.env.get('SMTP_PASS')!,
        },
      },
    })

    const tipoLabel = TIPO_LABEL[tipo] || tipo
    const asunto = `Listado de convocados — ${tipoLabel} ${fecha}`
    const cuerpo =
      `Se aprobó el listado de convocados para el ${diaSemana} ${fecha} (${tipoLabel}).\n\n` +
      `Personas citadas: ${cantidad}\n\n` +
      `Se adjunta el listado en PDF.`

    try {
      await client.send({
        from: Deno.env.get('SMTP_FROM')!,
        to: destinatarios.map((d: { email: string }) => d.email),
        subject: asunto,
        content: cuerpo,
        attachments: [
          {
            filename: `listado-convocados-${fecha}.pdf`,
            content: pdfBase64,
            encoding: 'base64',
          },
        ],
      })
    } finally {
      await client.close()
    }

    return jsonResponse({ ok: true, enviados: destinatarios.length })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
