// Integração com WhatsApp (Z-API) desligada pra cortar o custo da instância.
// O backend continua no repo atrás desta flag; o frontend (tela /settings/whatsapp,
// guias do blog, textos da landing) foi removido. Pra religar: volte isto pra `true`,
// faça o mesmo em supabase/functions/generate-pack/whatsapp.ts, reconfigure as envs
// Z_API_* e restaure o frontend pelo git (o commit que criou este arquivo).
export const WHATSAPP_ENABLED = false;
