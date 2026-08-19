import {
  Upload,
  FileText,
  Sparkles,
  ListChecks,
  BarChart3,
  ShieldCheck,
  Download,
  Lightbulb,
  Mic,
  Film,
  LayoutDashboard,
  Users,
  GraduationCap,
  ShieldAlert,
  Code2,
  Server,
  Database,
  Cloud,
  Waves,
} from 'lucide-react'

export const NAV_LINKS = [
  { label: 'About', href: '/#about' },
  { label: 'Features', href: '/#features' },
  { label: 'Workflow', href: '/#workflow' },
  { label: 'Technology', href: '/#technology' },
  { label: 'Contact', href: '/#contact' },
]

export const ABOUT_POINTS = [
  {
    icon: Mic,
    title: 'Speech Recognition',
    description:
      'State-of-the-art speech-to-text models transcribe every word of your video with high accuracy, even in noisy environments.',
  },
  {
    icon: Sparkles,
    title: 'AI Summarization',
    description:
      'Advanced language models distill hours of content into concise, digestible summaries without losing key context.',
  },
  {
    icon: FileText,
    title: 'Transcript Generation',
    description:
      'Fully searchable, timestamped transcripts generated automatically so you can jump to any part of the conversation.',
  },
  {
    icon: ListChecks,
    title: 'Key Moment Detection',
    description:
      'Automatically identifies the most important segments so you never miss a critical insight buried in long recordings.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description:
      'Deep engagement and content analytics that help creators, educators, and teams understand what truly resonates.',
  },
]

export const FEATURES = [
  {
    icon: Upload,
    title: 'Video Upload',
    description: 'Drag, drop, and upload videos of any length with resumable, chunked uploads built for reliability.',
  },
  {
    icon: FileText,
    title: 'Transcript Generation',
    description: 'Accurate, timestamped transcripts generated automatically using Whisper-powered speech recognition.',
  },
  {
    icon: Sparkles,
    title: 'AI Summary',
    description: 'Get a crisp executive summary of any video in seconds, powered by transformer-based language models.',
  },
  {
    icon: ListChecks,
    title: 'Key Moments',
    description: 'Automatically surface the highlights and pivotal moments so you can skip straight to what matters.',
  },
  {
    icon: Lightbulb,
    title: 'Keyword Extraction',
    description: 'Top keywords are pulled from every transcript automatically, giving you an at-a-glance sense of the content.',
  },
  {
    icon: LayoutDashboard,
    title: 'Analytics Dashboard',
    description: 'Track views, exports, and processing performance across your whole video library in real time.',
  },
  {
    icon: ShieldCheck,
    title: 'Role Based Access',
    description: 'Distinct roles for creators, learners, educators, and administrators out of the box.',
  },
  {
    icon: Download,
    title: 'Export Anywhere',
    description: 'Download transcripts, summaries, and highlight reports as TXT or SRT with one click.',
  },
]

export const WORKFLOW_STEPS = [
  { icon: Upload, title: 'Upload Video', description: 'Add any video file through a secure, resumable upload.' },
  { icon: Mic, title: 'Speech Recognition', description: 'Audio is transcribed using AI-powered speech models.' },
  { icon: FileText, title: 'Transcript', description: 'A structured, searchable transcript is generated.' },
  { icon: Sparkles, title: 'AI Summary', description: 'The transcript is condensed into a smart summary.' },
  { icon: ListChecks, title: 'Key Moments', description: 'Important highlights are automatically extracted.' },
  { icon: LayoutDashboard, title: 'Analytics Dashboard', description: 'Insights are visualized on your dashboard.' },
]

export const ROLES = [
  {
    icon: Film,
    title: 'Content Creator',
    tasks: ['Upload videos', 'Generate summaries', 'Download transcripts', 'Analytics'],
  },
  {
    icon: GraduationCap,
    title: 'Learner',
    tasks: ['Read summaries', 'Search transcript', 'Bookmarks', 'Learning history'],
  },
  {
    icon: Users,
    title: 'Educator',
    tasks: ['Upload lectures', 'Share summaries', 'Student engagement', 'Class analytics'],
  },
  {
    icon: ShieldAlert,
    title: 'Administrator',
    tasks: ['Manage users', 'Manage AI jobs', 'Audit logs', 'Platform analytics'],
  },
]

export const TECH_STACK = [
  { icon: Code2, name: 'Next.js', description: 'Modern React framework powering the frontend.' },
  { icon: Server, name: 'FastAPI', description: 'High-performance async Python backend.' },
  { icon: Database, name: 'PostgreSQL', description: 'Reliable relational data storage.' },
  { icon: Waves, name: 'Whisper', description: 'AI speech-to-text transcription engine.' },
  { icon: Sparkles, name: 'Transformers', description: 'HuggingFace models powering summarization.' },
  { icon: Film, name: 'FFmpeg', description: 'Audio extraction from uploaded video files.' },
  { icon: Cloud, name: 'Cloudflare R2', description: 'Object storage for uploaded videos.' },
  { icon: ShieldCheck, name: 'JWT Auth', description: 'Token-based authentication and sessions.' },
]