
import { ToolConfig } from './types';

export const TOOLS: ToolConfig[] = [
  {
    id: 'code-fixer',
    name: 'Code Error Fixer',
    description: 'Analyze and fix code errors instantly with root cause analysis and refactoring suggestions.',
    icon: '👨‍💻',
    placeholder: 'Paste your buggy code here...',
    systemInstruction: 'You are an expert developer. Analyze the code, identify the error, explain the root cause, provide the minimal fix, and suggest refactoring improvements.',
    model: 'gemini-3-pro-preview',
    inputType: 'code',
    category: 'coding'
  },
  {
    id: 'email-polisher',
    name: 'Email Rewriter',
    description: 'Transform casual emails into professional communications with tone adjustment and clarity.',
    icon: '✉️',
    placeholder: 'Draft your casual email here...',
    systemInstruction: 'Rewrite the casual email to be professional, polite, firm, or concise as needed. Focus on clarity and professional impact.',
    model: 'gemini-3-flash-preview',
    inputType: 'textarea',
    category: 'writing'
  },
  {
    id: 'meeting-recap',
    name: 'Meeting Insights',
    description: 'Extract key decisions, action items, owners, and deadlines from meeting notes.',
    icon: '📝',
    placeholder: 'Paste your meeting notes or transcript...',
    systemInstruction: 'Extract structured insights from these meeting notes. Focus on Key Decisions, Action Items with Owners, Deadlines, and Follow-ups.',
    model: 'gemini-3-flash-preview',
    inputType: 'textarea',
    category: 'productivity'
  },
  {
    id: 'idea-engine',
    name: 'Research Organizer',
    description: 'Structure materials, identify themes, and generate outlines from raw research data.',
    icon: '🔍',
    placeholder: 'Enter your research notes or materials...',
    systemInstruction: 'Organize this research material. Identify major themes, key insights, and provide a structured outline and summary.',
    model: 'gemini-3-flash-preview',
    inputType: 'textarea',
    category: 'productivity'
  },
  {
    id: 'workflow-generator',
    name: 'Workflow Generator',
    description: 'Generate automation scripts for Zapier, Python, or shell workflows.',
    icon: '⚙️',
    placeholder: 'Describe the workflow you want to automate...',
    systemInstruction: 'Generate a step-by-step automation workflow. Provide Zapier steps, a Python script, or a shell script as appropriate.',
    model: 'gemini-3-pro-preview',
    inputType: 'textarea',
    category: 'coding'
  },
  {
    id: 'pdf-summarizer',
    name: 'PDF Summarizer',
    description: 'Extract executive summaries, key points, and critical insights from document text.',
    icon: '📄',
    placeholder: 'Paste the text extracted from your PDF...',
    systemInstruction: 'Provide an executive summary, a list of key points, action items, and critical insights from the document text provided.',
    model: 'gemini-3-flash-preview',
    inputType: 'textarea',
    category: 'productivity'
  },
  {
    id: 'image-alt-text',
    name: 'Image Alt Text',
    description: 'Generate SEO-friendly short, medium, and detailed image descriptions.',
    icon: '🖼️',
    placeholder: 'Describe the image content for alt text generation...',
    systemInstruction: 'Generate SEO-friendly image descriptions. Provide a short version, a medium version, and a detailed variation.',
    model: 'gemini-3-flash-preview',
    inputType: 'textarea',
    category: 'writing'
  },
  {
    id: 'translator',
    name: 'Smart Translator',
    description: 'Context-aware translations across 8 languages with tone preservation.',
    icon: '🌐',
    placeholder: 'Enter text and target language (Supports 8 languages)...',
    systemInstruction: 'Provide a context-aware translation. Preserve the tone and nuance. Offer both formal and casual versions.',
    model: 'gemini-3-flash-preview',
    inputType: 'textarea',
    category: 'learning'
  },
  {
    id: 'audio-transcriber',
    name: 'Audio Transcriber',
    description: 'Convert speech notes to clean, formatted text with paragraph breaks.',
    icon: '🎤',
    placeholder: 'Paste your raw transcription here...',
    systemInstruction: 'Clean up this transcription. Add appropriate paragraph breaks, speaker labels (if applicable), and ensure grammatical correctness.',
    model: 'gemini-3-flash-preview',
    inputType: 'textarea',
    category: 'productivity'
  },
  {
    id: 'video-summarizer',
    name: 'Video Summarizer',
    description: 'Extract key moments, timestamps, and actionable takeaways from video scripts.',
    icon: '🎥',
    placeholder: 'Paste the video script or transcript...',
    systemInstruction: 'Analyze the video transcript. Provide a summary, suggested timestamps for key moments, main topics, and actionable takeaways.',
    model: 'gemini-3-flash-preview',
    inputType: 'textarea',
    category: 'writing'
  },
  {
    id: 'study-buddy',
    name: 'Learning Guide',
    description: 'Create personalized learning paths with steps, resources, and practice exercises.',
    icon: '📚',
    placeholder: 'What do you want to learn?',
    systemInstruction: 'Create a learning path. Include prerequisites, a 5-7 step path, resources, and practice exercises. Support levels: Beginner to Expert.',
    model: 'gemini-3-pro-preview',
    inputType: 'text',
    category: 'learning'
  },
  {
    id: 'social-media-master',
    name: 'Social Media Master',
    description: 'Optimize posts for engagement across Twitter, LinkedIn, and Instagram.',
    icon: '📱',
    placeholder: 'Enter your post idea...',
    systemInstruction: 'Optimize this for social media. Provide platform-specific versions (Twitter, LinkedIn, Instagram) with hooks, content, CTAs, and hashtags.',
    model: 'gemini-3-flash-preview',
    inputType: 'textarea',
    category: 'writing'
  },
  {
    id: 'seo-optimizer',
    name: 'SEO Optimizer',
    description: 'Boost search rankings with meta titles, descriptions, and keyword strategies.',
    icon: '🎯',
    placeholder: 'Paste your article or draft here...',
    systemInstruction: 'Provide SEO optimization. Suggest meta titles (max 60 chars), meta descriptions (max 155 chars), H1 suggestions, and a keyword strategy.',
    model: 'gemini-3-flash-preview',
    inputType: 'textarea',
    category: 'writing'
  }
];
