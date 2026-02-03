import { ToolConfig, ToolExecutionResult } from '../types';

type GeminiCandidate = {
  content?: {
    parts?: Array<{
      text?: string;
      inlineData?: { data?: string; mimeType?: string };
    }>;
  };
  finishReason?: string;
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const readApiKey = async (): Promise<string | null> => {
  if (window.aistudio?.getSelectedApiKey) {
    return window.aistudio.getSelectedApiKey();
  }

  return (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim() || null;
};

const parseResponse = (data: GeminiResponse): ToolExecutionResult => {
  if (data.error?.message) {
    return { content: '', error: data.error.message };
  }

  if (data.promptFeedback?.blockReason) {
    return { content: '', error: `Request blocked: ${data.promptFeedback.blockReason}` };
  }

  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const textChunks = parts.map((part) => part.text).filter(Boolean) as string[];
  const audioPart = parts.find((part) => part.inlineData?.data);

  return {
    content: textChunks.join('\n').trim(),
    audioData: audioPart?.inlineData?.data,
  };
};

export const executeTool = async (tool: ToolConfig, prompt: string): Promise<ToolExecutionResult> => {
  const apiKey = await readApiKey();
  if (!apiKey) {
    return { content: '', error: 'Missing Gemini API key. Add GEMINI_API_KEY to .env.local or connect via AI Studio.' };
  }

  try {
    const response = await fetch(`${GEMINI_API_BASE}/${tool.model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: tool.systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.5,
          topP: 0.9,
          topK: 40,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { content: '', error: `Request failed (${response.status}): ${errorText}` };
    }

    const data = (await response.json()) as GeminiResponse;
    return parseResponse(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: '', error: message };
  }
};

export const decodeAudio = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const decodePcm16 = (audioData: ArrayBuffer, audioCtx: AudioContext, sampleRate: number, channels: number) => {
  const buffer = audioCtx.createBuffer(channels, audioData.byteLength / 2 / channels, sampleRate);
  const view = new DataView(audioData);
  let offset = 0;

  for (let channel = 0; channel < channels; channel += 1) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < channelData.length; i += 1) {
      const sample = view.getInt16(offset, true);
      channelData[i] = sample / 32768;
      offset += 2;
    }
  }

  return buffer;
};

export const decodeAudioData = async (
  audioData: ArrayBuffer,
  audioCtx: AudioContext,
  sampleRate = 24000,
  channels = 1,
): Promise<AudioBuffer> => {
  try {
    return await audioCtx.decodeAudioData(audioData.slice(0));
  } catch (error) {
    return decodePcm16(audioData, audioCtx, sampleRate, channels);
  }
};
