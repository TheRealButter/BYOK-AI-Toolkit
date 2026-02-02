
export type ToolId = 
  | 'summarizer' 
  | 'code-fixer' 
  | 'email-polisher' 
  | 'seo-optimizer' 
  | 'meeting-recap' 
  | 'translator' 
  | 'idea-engine' 
  | 'social-viralizer' 
  | 'grammar-guardian' 
  | 'tone-shifter' 
  | 'keyword-surgeon' 
  | 'study-buddy' 
  | 'voiceover';

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
