import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private'
import { PostHog } from 'posthog-node'

import { OpenAI } from '@posthog/ai'

export async function POST({ request }) {
  const { context, text, type, focus } = await request.json();

  let user_prompt = `
Writing Type: ${type}\n
Prompt, Context, or Instructions: ${context}\n
Writing Text: ${text}\n
  `

  const phClient = new PostHog(
    'phc_',
    { host: 'https://us.i.posthog.com' }
  )

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    posthog: phClient,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        "role": "system",
        "content": [
          {
            "text": "Create a short but descriptive title for the submitted writing.\n\n Output notes: \n\n - Just output the title, not any other text.\n- Aim for the title to be just a few words long, around three or four words maximum\n- Be blunt with what the writng is, don't try to come up with a creative title\n\Title style examples:\n\n- Job Satisfaction in Mexico\n- Purdue Application Essay\n- Habits of Marine Animals\n- Pottery and Nature",
            "type": "text"
          }
        ]
      },
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": user_prompt
          }
        ]
      }
    ],
    temperature: 1,
    max_tokens: 16384,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    response_format: {
      "type": "text"
    },
  });

  return json(response.choices[0].message.content) 
}