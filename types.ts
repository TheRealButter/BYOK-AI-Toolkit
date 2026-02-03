
export type ToolId = 
  | 'code-fixer' 
  | 'email-polisher' 
  | 'workflow-generator' 
  | 'pdf-summarizer' 
  | 'image-alt-text' 
  | 'meeting-recap' 
  | 'translator' 
  | 'idea-engine' 
  | 'video-summarizer' 
  | 'social-media-master' 
  | 'audio-transcriber' 
  | 'study-buddy' 
  | 'seo-optimizer';

export interface ToolConfig {
  id: ToolId;
  name: string;
  description: string;
  icon: string;
  placeholder: string;
  systemInstruction: string;
  model: 'gemini-3-flash-preview' | 'gemini-3-pro-preview' | 'gemini-2.5-flash-preview-tts';
  inputType: 'text' | 'code' | 'textarea';
  category: 'productivity' | 'coding' | 'writing' | 'learning';
}

export interface ToolExecutionResult {
  content: string;
  audioData?: string;
  error?: string;
}
