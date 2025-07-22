import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private'
import { PostHog } from 'posthog-node'

import { OpenAI } from '@posthog/ai'

export async function POST({ request }) {
  const { context, text, type, focus } = await request.json();

  let user_prompt = `
Writing Type: ${type}\n
Prompt, Context, or Instructions: ${context}\n
Writing Text Content: ${text}\n
  `

  let input_prompt = "You are a writing tutor, aiming to provide detailed feedback on a given piece of writing. Focus on providing genuinely helpful and novel feedback"

  if (type == "College Application") {
    input_prompt = "You are a college essay tutor, aiming to provide detailed feedback on a user's college application essay. Focus on providing genuinely helpful and novel feedback. The user should have provided a prompt, and if you are familiar with the school or the prompt, give advice drawing from past knowledge on what works well for that prompt."
  }

  const phClient = new PostHog(
    'phc_',
    { host: 'https://us.i.posthog.com' }
  )

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    posthog: phClient,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        "role": "system",
        "content": [
          {
            "text": input_prompt,
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
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    response_format: {
      "type": "text"
    },
  });

  return json(response.choices[0].message.content) 
}