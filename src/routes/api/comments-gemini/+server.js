import { json } from '@sveltejs/kit';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GOOGLE_API_KEY } from '$env/static/private'

export async function POST({ request }) {
  const { context, text, type, focus } = await request.json();

  let response;

  const common_prompt = "## Format requirements:\n\n quick, bold, and concise. Do not be overly verbose or use too much descriptive language. Give useful, helpful feedback."

  if (type == "College Application") {
    response = await getComments(
      `Essay Prompt: ${context}\nFeedback Focus: ${focus}\nEssay Text: ${text}`,
      "You are a professional college essay tutor. I have written a draft of a college application essay and would like your help improving it. Your goal is to give clear, concise, and helpful inline feedback that encourages the writer to reflect and revise." + common_prompt
    )
  } else if (type == "Academic Essay") {
    response = await getComments(
      `Essay Prompt or Instructions: ${context}\nFeedback Focus: ${focus}\nEssay Text: ${text}`,
      "You are a professional writing tutor. I have written a draft of an essay and would like your help improving it. Your goal is to give clear, concise, and helpful inline feedback that encourages the writer to reflect and revise." + common_prompt
    )
  } else if (type == "Creative Writing") {
    response = await getComments(
      `Prompt or Instructions: ${context}\nFeedback Focus: ${focus}\nWriting Content: ${text}`,
      "You are a professional tutor and writing coach. I have written a draft and would like your help improving it. Your goal is to give clear, concise, and helpful inline feedback that encourages the writer to reflect and revise." + common_prompt
    )
  } else if (type == "Email") {
    response = await getComments(
      `Context: ${context}\nFeedback Focus: ${focus}\nWriting Content: ${text}`,
      "You are a professional advisor and counselor. I have written a draft of an email and would like your help improving it. Your goal is to give clear, concise, and helpful inline feedback that encourages the writer to reflect and revise." + common_prompt
    )
  } else {
    response = await getComments(
      `Prompt, Instructions, or Context: ${context}\nFeedback Focus: ${focus}\nWriting Content: ${text}`,
      "You are a professional tutor and writing coach. I have written a draft and would like your help improving it. Your goal is to give clear, concise, and helpful inline feedback that encourages the writer to reflect and revise." + common_prompt
    )
  }

  return json(response) 
}


async function getComments(prompt, system_instructions) {
  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

  // DEBUG
  //console.log(prompt)

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro-preview-03-25",
    systemInstruction: system_instructions,
  });

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 20000,
    responseModalities: [
    ],
    responseMimeType: "text/plain",
  };

  const chatSession = model.startChat({
    generationConfig,
    history: [],
  });

  let result;

  try {
    result = await chatSession.sendMessage(prompt);
  } catch (error) {
    console.error("Error:", error);
  }

  return result.response.text()
}