// Edge Function: envía por mail el PDF del listado de convocados de un
// operativo, a los destinatarios activos configurados en
// produccion_config_notificaciones_operativos.
//
// Se dispara desde OperativosPage.jsx (handleAprobar) recién cuando
// Javier/Valentín aprueba la citación — no en cada guardado de Carlos.
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
import nodemailer from 'npm:nodemailer@6'

const TIPO_LABEL: Record<string, string> = { Sabado: 'Sábado' }

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 })
  }

  try {
    const { fecha, tipo, diaSemana, cantidad, pdfBase64 } = await req.json()

    if (!fecha || !pdfBase64 || !cantidad) {
      return new Response(JSON.stringify({ error: 'Faltan datos del listado (fecha/cantidad/pdfBase64)' }), {
        status: 400,
      })
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
      return new Response(
        JSON.stringify({ error: 'No hay destinatarios activos configurados en "Destinatarios del listado"' }),
        { status: 422 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: Number(Deno.env.get('SMTP_PORT') || 465),
      secure: true,
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      },
    })

    const tipoLabel = TIPO_LABEL[tipo] || tipo
    const asunto = `Listado de convocados — ${tipoLabel} ${fecha}`
    const cuerpo =
      `Se aprobó el listado de convocados para el ${diaSemana} ${fecha} (${tipoLabel}).\n\n` +
      `Personas citadas: ${cantidad}\n\n` +
      `Se adjunta el listado en PDF.`

    await transporter.sendMail({
      from: Deno.env.get('SMTP_FROM'),
      to: destinatarios.map((d: { email: string }) => d.email).join(', '),
      subject: asunto,
      text: cuerpo,
      attachments: [
        {
          filename: `listado-convocados-${fecha}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
        },
      ],
    })

    return new Response(JSON.stringify({ ok: true, enviados: destinatarios.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
    })
  }
})
