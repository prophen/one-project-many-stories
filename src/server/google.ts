import { parseStories, prompt, validateFacts } from '../domain.js';
import { GOOGLE_MODEL } from '../providers.js';

export async function generateGoogle(input: unknown, options: {
  apiKey?: string; consent: boolean; fetcher?: typeof fetch;
}) {
  if (!options.consent) throw Error('Confirm that Google may receive these project facts before generating.');
  if (!options.apiKey?.trim()) throw Error('Google hosted Gemma is not configured. Enter GEMINI_API_KEY privately in the server environment and restart.');
  const facts = validateFacts(input);
  const messages = prompt(facts);
  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(
      `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_MODEL}:generateContent`,
      { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(120000),
        headers: {'Content-Type':'application/json', 'x-goog-api-key': options.apiKey},
        body: JSON.stringify({
          systemInstruction: {parts:[{text:messages[0].content}]},
          contents:[{role:'user',parts:[{text:messages[1].content}]}],
          generationConfig:{temperature:0,maxOutputTokens:6000,thinkingConfig:{thinkingLevel:'minimal'}}
        })
      }
    );
  } catch { throw Error('Google request failed or timed out. No fallback was attempted.'); }
  // Never return upstream error text: it may contain user content or credentials.
  if (!response.ok) {
    if ([401,403].includes(response.status)) throw Error('Google rejected authentication or model access. Check the key and project permissions privately.');
    if (response.status===429) throw Error('Google project quota or rate limit reached. Try later; no billing change or fallback was attempted.');
    if (response.status===404) throw Error('The configured Gemma model is unavailable for this project. No alternative model was used.');
    throw Error('Google could not complete generation. No fallback was attempted.');
  }
  let data:any;
  try {
    const raw=await response.text();
    if(raw.length>100000)throw Error();
    data=JSON.parse(raw);
  } catch { throw Error('Google returned an unreadable response. No draft was accepted.'); }
  if(data.promptFeedback?.blockReason)throw Error('Google blocked this request. No draft was accepted.');
  const candidate=data.candidates?.[0];
  if(candidate?.finishReason!=='STOP')throw Error('Google did not finish a complete response. No draft was accepted.');
  const parts=candidate.content?.parts;
  if(!Array.isArray(parts))throw Error('Google returned no story text.');
  const text=parts.filter((p:any)=>!p.thought&&typeof p.text==='string').map((p:any)=>p.text).join('');
  return parseStories(text,facts);
}
