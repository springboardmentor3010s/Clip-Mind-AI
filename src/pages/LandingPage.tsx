import React from 'react';
import {
  Sparkles,
  PlayCircle,
  Video,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Mic,
  Brain,
  Zap,
  ArrowRight,
  CheckCircle2,
  Workflow,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  isAuthenticated?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
}) => {
  return (
    <div className="relative w-full overflow-hidden bg-[#070B16]">

      {/* =====================================================
          CONTINUOUS BACKGROUND
      ===================================================== */}
      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-blue-600/[0.07] blur-[150px] rounded-full" />

        <div className="absolute top-[850px] left-[-200px] w-[500px] h-[500px] bg-purple-600/[0.05] blur-[150px] rounded-full" />

        <div className="absolute top-[1800px] right-[-200px] w-[500px] h-[500px] bg-blue-600/[0.05] blur-[150px] rounded-full" />

        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '70px 70px',
          }}
        />
      </div>


      {/* =====================================================
          HERO
      ===================================================== */}
      <section
  id="hero"
  className="relative z-10 w-full px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-28 scroll-mt-20"
>

        <div className="w-full max-w-7xl mx-auto text-center">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            Intelligent Video Understanding Platform
          </div>

          <h1 className="mx-auto mt-8 max-w-5xl text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.04]">

            <span className="text-white">
              Every second of video,
            </span>

            <br />

            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
              understood automatically.
            </span>

          </h1>

          <p className="mx-auto mt-7 max-w-3xl text-base sm:text-lg text-slate-400 leading-8">
            ClipMind AI transforms long-form videos into searchable,
            structured knowledge by generating accurate transcripts,
            concise summaries, and important key moments automatically.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-9">

            <button
              onClick={() => onNavigate('register')}
              className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() =>
                document
                  .getElementById('studio')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-slate-700 bg-slate-900/70 text-slate-200 font-bold text-sm hover:bg-slate-800 transition-all"
            >
              <PlayCircle className="w-4 h-4 text-blue-400" />
              Live Demo
            </button>

          </div>

          <div className="flex items-center justify-center gap-3 mt-6 text-xs text-slate-500">
            <span>Upload</span>
            <ArrowRight className="w-3 h-3" />
            <span>Transcribe</span>
            <ArrowRight className="w-3 h-3" />
            <span>Summarize</span>
            <ArrowRight className="w-3 h-3" />
            <span>Detect Key Moments</span>
          </div>

        </div>
      </section>


      {/* =====================================================
          FLOW CONNECTOR
      ===================================================== */}
      <SectionConnector />


      {/* =====================================================
          ROLES
      ===================================================== */}
      <section
        id="roles"
        className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-20"
      >

        <div className="w-full max-w-7xl mx-auto">

          <SectionHeading
            icon={<ShieldCheck className="w-4 h-4" />}
            label="Built for Every Role"
            title="One platform, four ways to work with it."
            description="Role-based access ensures every user gets the tools they need."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-12">

            <RoleCard
              icon={<Video className="w-5 h-5" />}
              title="Content Creator"
              description="Create and manage summarized content for audiences."
              items={[
                'Upload and manage videos',
                'Generate transcripts and summaries',
                'Detect key moments',
                'View content insights',
              ]}
              button="Start as Creator"
              onClick={() => onNavigate('register')}
            />

            <RoleCard
              icon={<BookOpen className="w-5 h-5" />}
              title="Learner"
              description="Consume educational and informational content efficiently."
              items={[
                'Read generated summaries',
                'Search transcripts',
                'Jump to timestamps',
                'Bookmark important moments',
              ]}
              button="Start as Learner"
              onClick={() => onNavigate('register')}
            />

            <RoleCard
              icon={<GraduationCap className="w-5 h-5" />}
              title="Educator"
              description="Transform long educational content into concise resources."
              items={[
                'Upload lecture videos',
                'Review transcripts',
                'Generate learning summaries',
                'Monitor learning content',
              ]}
              button="Start as Educator"
              onClick={() => onNavigate('register')}
            />

            <RoleCard
              icon={<ShieldCheck className="w-5 h-5" />}
              title="Administrator"
              description="Maintain platform operations, security, and performance."
              items={[
                'Manage users and roles',
                'Monitor platform activity',
                'View system analytics',
                'Access audit information',
              ]}
              button="Admin Access"
onClick={() => { window.location.href = '/admin-login'; }}
            />

          </div>

        </div>
      </section>


      <SectionConnector />


      {/* =====================================================
          STUDIO
      ===================================================== */}
      <section
        id="studio"
        className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-20"
      >

        <div className="w-full max-w-7xl mx-auto">

          <SectionHeading
            icon={<PlayCircle className="w-4 h-4" />}
            label="Interactive Workspace"
            title="Experience the ClipMind Intelligence Studio"
            description="Upload a video and transform hours of content into transcripts, summaries, and searchable key moments."
          />

          <div className="mt-12 rounded-2xl border border-slate-800 bg-[#0B1120]/90 p-5 sm:p-7 shadow-2xl">

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">

              <div className="flex items-center gap-3">

                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                </div>

                <span className="text-xs sm:text-sm font-semibold text-slate-300">
                  Sample Video: Machine_Learning_Lecture_01.mp4
                </span>

              </div>

              <div className="flex items-center gap-1 bg-slate-950 rounded-lg border border-slate-800 p-1">

                <span className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-bold">
                  Summary
                </span>

                <span className="px-3 py-1.5 text-xs font-semibold text-slate-500">
                  Transcript
                </span>

                <span className="px-3 py-1.5 text-xs font-semibold text-slate-500">
                  Key Moments
                </span>

              </div>

            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">

              <StudioCard
                icon={<Mic className="w-5 h-5 text-blue-400" />}
                title="Whisper Transcription"
                description="Convert spoken audio into accurate timestamped transcripts."
              />

              <StudioCard
                icon={<Brain className="w-5 h-5 text-purple-400" />}
                title="AI Summarization"
                description="Generate concise and detailed summaries from transcripts."
              />

              <StudioCard
                icon={<Zap className="w-5 h-5 text-cyan-400" />}
                title="Key Moment Detection"
                description="Identify important segments and searchable timestamps."
              />

            </div>


            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-5">

              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-3">
                Sample Summary
              </p>

              <p className="text-sm leading-7 text-slate-400">
                ClipMind AI analyzes the uploaded lecture, extracts spoken
                content, generates a structured summary, and identifies
                important moments for quick navigation.
              </p>

            </div>

          </div>

        </div>
      </section>


      <SectionConnector />


      {/* =====================================================
          CAPABILITIES
      ===================================================== */}
      <section
  id="features"
  className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20"
>

        <div className="w-full max-w-7xl mx-auto">

        <SectionHeading
  icon={<Workflow className="w-4 h-4" />}
  label="Features"
  title="Everything you need to understand video faster."
  description="A complete AI-powered workflow for video understanding."
/>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">

            <Capability
              icon={<Mic />}
              title="Speech-to-Text"
              text="Convert video speech into searchable timestamped transcripts using Whisper."
            />

            <Capability
              icon={<Brain />}
              title="AI Summaries"
              text="Generate short and detailed summaries from processed video transcripts."
            />

            <Capability
              icon={<Zap />}
              title="Key Moments"
              text="Find important segments and create timestamped highlights."
            />

          </div>

        </div>
      </section>


      {/* =====================================================
          FINAL CTA
      ===================================================== */}
      <section className="relative z-10 w-full px-4 sm:px-6 lg:px-8 pt-10 pb-24">

        <div className="w-full max-w-5xl mx-auto rounded-3xl border border-slate-800 bg-gradient-to-br from-blue-600/[0.08] via-slate-900 to-purple-600/[0.08] p-10 sm:p-16 text-center">

          <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-5" />

          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Turn hours of video into useful knowledge.
          </h2>

          <p className="mt-4 text-slate-400 max-w-xl mx-auto">
            Upload your first video and let ClipMind AI do the heavy lifting.
          </p>

          <button
            onClick={() => onNavigate('register')}
            className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>

      </section>

      {/* ADMINISTRATOR LOGIN */}
      <div className="border-t border-slate-800/60 mt-8 pt-6 pb-8">
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => { window.location.href = '/admin-login'; }}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Administrator Login
          </button>
        </div>
      </div>



    </div>
  );
};


/* =========================================================
   SECTION HEADING
========================================================= */

interface SectionHeadingProps {
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  icon,
  label,
  title,
  description,
}) => (
  <div className="text-center">

    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold">
      {icon}
      {label}
    </div>

    <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black text-white">
      {title}
    </h2>

    <p className="mt-4 max-w-2xl mx-auto text-slate-400 leading-7">
      {description}
    </p>

  </div>
);


/* =========================================================
   SECTION CONNECTOR
========================================================= */

const SectionConnector = () => (
  <div className="relative z-10 flex justify-center h-14">

    <div className="relative flex items-center justify-center">

      <div className="h-14 w-px bg-gradient-to-b from-blue-500/0 via-blue-500/40 to-purple-500/0" />

      <div className="absolute w-2 h-2 rounded-full bg-blue-400 shadow-lg shadow-blue-500/50" />

    </div>

  </div>
);


/* =========================================================
   ROLE CARD
========================================================= */

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: string[];
  button: string;
  onClick: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({
  icon,
  title,
  description,
  items,
  button,
  onClick,
}) => (
  <div className="h-full min-h-[390px] flex flex-col rounded-2xl border border-slate-800 bg-[#0B1120]/90 p-6 hover:border-blue-500/30 hover:-translate-y-1 transition-all">

    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
      {icon}
    </div>

    <h3 className="text-lg font-black text-white">
      {title}
    </h3>

    <p className="mt-3 text-sm text-slate-400 leading-6 min-h-[72px]">
      {description}
    </p>

    <div className="mt-5 space-y-3 flex-1">

      {items.map((item) => (
        <div
          key={item}
          className="flex items-start gap-2 text-xs text-slate-400"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
          <span>{item}</span>
        </div>
      ))}

    </div>

    <button
      onClick={onClick}
      className="w-full mt-6 py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-bold hover:bg-blue-500/10 transition-all"
    >
      {button}
    </button>

  </div>
);


/* =========================================================
   STUDIO CARD
========================================================= */

interface StudioCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const StudioCard: React.FC<StudioCardProps> = ({
  icon,
  title,
  description,
}) => (
  <div className="h-full rounded-xl border border-slate-800 bg-slate-950/60 p-5">

    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
      {icon}
    </div>

    <h3 className="font-bold text-white">
      {title}
    </h3>

    <p className="mt-2 text-sm text-slate-400 leading-6">
      {description}
    </p>

  </div>
);


/* =========================================================
   CAPABILITY CARD
========================================================= */

interface CapabilityProps {
  icon: React.ReactNode;
  title: string;
  text: string;
}

const Capability: React.FC<CapabilityProps> = ({
  icon,
  title,
  text,
}) => (
  <div className="h-full rounded-2xl border border-slate-800 bg-[#0B1120]/90 p-7 hover:border-blue-500/30 transition-all">

    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
      {React.cloneElement(icon as React.ReactElement, {
        className: 'w-5 h-5',
      })}
    </div>

    <h3 className="text-lg font-bold text-white">
      {title}
    </h3>

    <p className="mt-3 text-sm text-slate-400 leading-7">
      {text}
    </p>

</div>
);