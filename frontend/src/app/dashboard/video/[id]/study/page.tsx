"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authFetch } from '@/lib/authFetch';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap, ArrowLeft, RotateCcw, Pencil, Save, X as XIcon, RefreshCw, Trash2 } from 'lucide-react';

interface Flashcard {
  term: string;
  context: string;
}
interface FillInBlank {
  question: string;
  answer: string;
}
interface MCQ {
  question: string;
  options: string[];
  answer: string;
}
interface StudyMaterials {
  flashcards: Flashcard[];
  fill_in_blanks: FillInBlank[];
  mcqs: MCQ[];
  is_saved: boolean;
}

type TabType = 'flashcards' | 'blanks' | 'mcq';

export default function StudyModePage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params?.id as string;
  const { user } = useAuth();
  const canManageContent = (user as any)?.role !== 'Learner';

  const [materials, setMaterials] = useState<StudyMaterials | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('flashcards');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const fetchMaterials = async () => {
    try {
      const res = await authFetch(`/learn/${videoId}/study-materials`);
      if (res.ok) {
        setMaterials(await res.json());
        setError(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || 'Could not load study materials for this video.');
      }
    } catch (e) {
      setError('Failed to load study materials.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) fetchMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Fire once per visit — feeds the "students who engaged with Study Mode"
  // classroom-engagement metric.
  useEffect(() => {
    if (!videoId) return;
    authFetch('/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: parseInt(videoId), event_type: 'study_mode_started' }),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await authFetch(`/learn/${videoId}/study-materials/generate`, { method: 'POST' });
      if (res.ok) {
        setMaterials(await res.json());
      } else {
        alert('Failed to regenerate study materials.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = async () => {
    if (!materials) return;
    setIsSaving(true);
    try {
      const res = await authFetch(`/learn/${videoId}/study-materials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flashcards: materials.flashcards,
          fill_in_blanks: materials.fill_in_blanks,
          mcqs: materials.mcqs,
        }),
      });
      if (res.ok) {
        setMaterials(await res.json());
        setIsEditing(false);
      } else {
        alert('Failed to save changes.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl">
      <button
        onClick={() => router.push(`/dashboard/video/${videoId}`)}
        className="flex items-center gap-1.5 text-label-large font-medium text-md-on-surface-variant hover:text-md-on-surface transition-colors"
      >
        <ArrowLeft size={16} />
        Back to video
      </button>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-medium font-bold text-md-on-surface tracking-tight flex items-center gap-3">
            Study Mode
            <GraduationCap className="text-md-primary h-6 w-6" />
          </h1>
          <p className="text-md-on-surface-variant mt-2">
            {materials?.is_saved
              ? 'Curated learning materials for this video.'
              : "Auto-generated draft — click Save (once you've reviewed it) to make it the version students see."}
          </p>
        </div>
        {canManageContent && materials && !isLoading && (
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={() => { setIsEditing(false); fetchMaterials(); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-label-medium font-medium text-md-on-surface-variant hover:bg-md-surface-container-highest rounded-full transition-colors"
                >
                  <XIcon size={14} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-md-primary hover:opacity-90 text-md-on-primary text-label-large font-semibold rounded-full transition-all disabled:opacity-50"
                >
                  <Save size={14} />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="flex items-center gap-1.5 px-3 py-2 text-label-medium font-medium text-md-on-surface-variant hover:bg-md-surface-container-highest rounded-full transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
                  Regenerate
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-md-primary-container text-md-on-primary-container text-label-large font-semibold rounded-full transition-all hover:opacity-90"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {isLoading ? (
        <p className="text-md-on-surface-variant">Loading...</p>
      ) : error ? (
        <div className="bg-md-surface-container p-8 rounded-xl text-center text-md-on-surface-variant">{error}</div>
      ) : materials ? (
        <>
          <div className="flex bg-md-surface-container-highest p-1 rounded-full w-fit">
            {[
              { id: 'flashcards' as TabType, label: `Flashcards (${materials.flashcards.length})` },
              { id: 'blanks' as TabType, label: `Fill in the Blank (${materials.fill_in_blanks.length})` },
              { id: 'mcq' as TabType, label: `Multiple Choice (${materials.mcqs.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-label-large font-medium rounded-full transition-all ${
                  activeTab === tab.id
                    ? 'bg-md-primary text-md-on-primary'
                    : 'text-md-on-surface-variant hover:text-md-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isEditing ? (
            <EditPanel
              activeTab={activeTab}
              materials={materials}
              setMaterials={setMaterials}
            />
          ) : (
            <>
              {activeTab === 'flashcards' && <FlashcardDeck cards={materials.flashcards} />}
              {activeTab === 'blanks' && <FillInBlankList questions={materials.fill_in_blanks} />}
              {activeTab === 'mcq' && <MCQList questions={materials.mcqs} />}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

function EditPanel({
  activeTab,
  materials,
  setMaterials,
}: {
  activeTab: TabType;
  materials: StudyMaterials;
  setMaterials: (m: StudyMaterials) => void;
}) {
  if (activeTab === 'flashcards') {
    return (
      <div className="space-y-3">
        {materials.flashcards.map((card, i) => (
          <div key={i} className="bg-md-surface-container rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <input
                value={card.term}
                onChange={(e) => {
                  const next = [...materials.flashcards];
                  next[i] = { ...next[i], term: e.target.value };
                  setMaterials({ ...materials, flashcards: next });
                }}
                className="flex-1 px-3 py-2 bg-md-surface-container-highest rounded-lg text-md-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-md-primary"
                placeholder="Term"
              />
              <button
                onClick={() => setMaterials({ ...materials, flashcards: materials.flashcards.filter((_, idx) => idx !== i) })}
                className="p-2 text-md-on-surface-variant hover:text-md-error rounded-full transition-colors shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <textarea
              value={card.context}
              onChange={(e) => {
                const next = [...materials.flashcards];
                next[i] = { ...next[i], context: e.target.value };
                setMaterials({ ...materials, flashcards: next });
              }}
              className="w-full px-3 py-2 bg-md-surface-container-highest rounded-lg text-md-on-surface-variant text-body-small resize-none focus:outline-none focus:ring-2 focus:ring-md-primary"
              rows={2}
              placeholder="Context / back of card"
            />
          </div>
        ))}
      </div>
    );
  }

  if (activeTab === 'blanks') {
    return (
      <div className="space-y-3">
        {materials.fill_in_blanks.map((q, i) => (
          <div key={i} className="bg-md-surface-container rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-2">
              <textarea
                value={q.question}
                onChange={(e) => {
                  const next = [...materials.fill_in_blanks];
                  next[i] = { ...next[i], question: e.target.value };
                  setMaterials({ ...materials, fill_in_blanks: next });
                }}
                className="flex-1 px-3 py-2 bg-md-surface-container-highest rounded-lg text-md-on-surface text-body-small resize-none focus:outline-none focus:ring-2 focus:ring-md-primary"
                rows={2}
              />
              <button
                onClick={() => setMaterials({ ...materials, fill_in_blanks: materials.fill_in_blanks.filter((_, idx) => idx !== i) })}
                className="p-2 text-md-on-surface-variant hover:text-md-error rounded-full transition-colors shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <input
              value={q.answer}
              onChange={(e) => {
                const next = [...materials.fill_in_blanks];
                next[i] = { ...next[i], answer: e.target.value };
                setMaterials({ ...materials, fill_in_blanks: next });
              }}
              className="px-3 py-1.5 bg-md-tertiary-container rounded-full text-md-on-tertiary-container text-label-medium font-semibold focus:outline-none focus:ring-2 focus:ring-md-primary"
              placeholder="Answer"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {materials.mcqs.map((q, i) => (
        <div key={i} className="bg-md-surface-container rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-2">
            <textarea
              value={q.question}
              onChange={(e) => {
                const next = [...materials.mcqs];
                next[i] = { ...next[i], question: e.target.value };
                setMaterials({ ...materials, mcqs: next });
              }}
              className="flex-1 px-3 py-2 bg-md-surface-container-highest rounded-lg text-md-on-surface text-body-small resize-none focus:outline-none focus:ring-2 focus:ring-md-primary"
              rows={2}
            />
            <button
              onClick={() => setMaterials({ ...materials, mcqs: materials.mcqs.filter((_, idx) => idx !== i) })}
              className="p-2 text-md-on-surface-variant hover:text-md-error rounded-full transition-colors shrink-0"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt, oi) => (
              <input
                key={oi}
                value={opt}
                onChange={(e) => {
                  const next = [...materials.mcqs];
                  const nextOptions = [...next[i].options];
                  const wasAnswer = nextOptions[oi] === next[i].answer;
                  nextOptions[oi] = e.target.value;
                  next[i] = { ...next[i], options: nextOptions, answer: wasAnswer ? e.target.value : next[i].answer };
                  setMaterials({ ...materials, mcqs: next });
                }}
                className={`px-3 py-1.5 rounded-lg text-body-small focus:outline-none focus:ring-2 focus:ring-md-primary ${
                  opt === q.answer ? 'bg-md-tertiary-container text-md-on-tertiary-container font-semibold' : 'bg-md-surface-container-highest text-md-on-surface'
                }`}
              />
            ))}
          </div>
          <select
            value={q.answer}
            onChange={(e) => {
              const next = [...materials.mcqs];
              next[i] = { ...next[i], answer: e.target.value };
              setMaterials({ ...materials, mcqs: next });
            }}
            className="px-3 py-1.5 bg-md-surface-container-highest rounded-full text-label-small text-md-on-surface focus:outline-none focus:ring-2 focus:ring-md-primary"
          >
            {q.options.map((opt, oi) => (
              <option key={oi} value={opt}>Correct: {opt}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function FlashcardDeck({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) {
    return <p className="text-md-on-surface-variant italic">No flashcards available.</p>;
  }

  const card = cards[index % cards.length];

  const next = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % cards.length);
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => setFlipped((f) => !f)}
        className="bg-md-surface-container rounded-xl p-10 min-h-[220px] flex items-center justify-center text-center cursor-pointer select-none transition-colors hover:bg-md-surface-container-high"
      >
        {flipped ? (
          <p className="text-body-large text-md-on-surface">{card.context}</p>
        ) : (
          <p className="text-headline-small font-bold text-md-primary">{card.term}</p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-label-small text-md-on-surface-variant">
          Card {(index % cards.length) + 1} of {cards.length} — click card to flip
        </span>
        <button
          onClick={next}
          className="flex items-center gap-1.5 px-4 py-2 bg-md-primary hover:opacity-90 text-md-on-primary text-label-large font-semibold rounded-full transition-all"
        >
          <RotateCcw size={14} />
          Next Card
        </button>
      </div>
    </div>
  );
}

function FillInBlankList({ questions }: { questions: FillInBlank[] }) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  if (questions.length === 0) {
    return <p className="text-md-on-surface-variant italic">No fill-in-the-blank questions available.</p>;
  }

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={i} className="bg-md-surface-container rounded-xl p-5">
          <p className="text-body-medium text-md-on-surface mb-3">{q.question}</p>
          {revealed[i] ? (
            <span className="inline-block px-3 py-1 rounded-full bg-md-tertiary-container text-md-on-tertiary-container text-label-medium font-semibold">
              {q.answer}
            </span>
          ) : (
            <button
              onClick={() => setRevealed((r) => ({ ...r, [i]: true }))}
              className="px-3 py-1.5 text-label-small font-medium text-md-primary hover:bg-md-primary-container rounded-full transition-colors"
            >
              Reveal answer
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function MCQList({ questions }: { questions: MCQ[] }) {
  const [selected, setSelected] = useState<Record<number, string>>({});

  if (questions.length === 0) {
    return <p className="text-md-on-surface-variant italic">No multiple-choice questions available.</p>;
  }

  return (
    <div className="space-y-4">
      {questions.map((q, i) => {
        const pick = selected[i];
        return (
          <div key={i} className="bg-md-surface-container rounded-xl p-5">
            <p className="text-body-medium text-md-on-surface mb-3">{q.question}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt) => {
                const isPicked = pick === opt;
                const isCorrect = opt === q.answer;
                const showResult = pick != null;
                return (
                  <button
                    key={opt}
                    onClick={() => setSelected((s) => ({ ...s, [i]: opt }))}
                    disabled={showResult}
                    className={`px-3 py-2 rounded-lg text-body-small text-left border transition-colors ${
                      showResult && isCorrect
                        ? 'bg-md-success-container border-transparent text-md-on-success-container'
                        : showResult && isPicked && !isCorrect
                        ? 'bg-md-error-container border-transparent text-md-on-error-container'
                        : 'bg-md-surface-container-high border-md-outline-variant text-md-on-surface hover:border-md-outline'
                    } disabled:cursor-default`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
