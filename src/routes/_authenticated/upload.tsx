import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { FiCheckCircle, FiFilm, FiUploadCloud, FiX } from "react-icons/fi";
import { Button } from "../../components/PrimaryButton";
import { useToast } from "../../context/ToastContext";
import { STAGE_LABELS, useWorkspace } from "../../context/WorkspaceContext";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({
    meta: [
      { title: "Upload recording — ClipMind AI" },
      { name: "description", content: "Upload a lecture, seminar or interview recording and run the ClipMind AI processing pipeline." },
      { property: "og:title", content: "Upload recording — ClipMind AI" },
      { property: "og:description", content: "Run transcription, summarisation, key-moment extraction and analytics on a recording." },
    ],
  }),
  component: UploadPage,
});

const STAGES = ["uploading", "transcribing", "summarising", "moments", "analytics"] as const;

function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const { processFile, stage, progress } = useWorkspace();
  const { toast } = useToast();
  const navigate = useNavigate();

  const onFile = useCallback((f: File | null) => {
    if (!f) return;
    setFile(f);
    setDone(false);
  }, []);

  const start = async () => {
    if (!file) return;
    setRunning(true);
    try {
      const record = await processFile(file);
      setDone(true);
      toast(`Processing complete — ${record.moments.length} key moments extracted`, "success");
    } finally {
      setRunning(false);
    }
  };

  const stageIndex = STAGES.indexOf(stage as (typeof STAGES)[number]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Upload recording</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          MP4, MOV, WEBM or audio. Processing runs locally as a mock of the FastAPI pipeline.
        </p>
      </div>

      {!file && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files?.[0] ?? null); }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
          }`}
        >
          <input type="file" accept="video/*,audio/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          <div className="h-14 w-14 rounded-xl border border-border bg-muted flex items-center justify-center text-primary">
            <FiUploadCloud className="text-2xl" />
          </div>
          <div className="mt-4 font-display text-lg">Drop a recording here</div>
          <p className="mt-1 text-sm text-muted-foreground">or click to browse your files</p>
        </label>
      )}

      {file && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="h-16 w-24 shrink-0 rounded-xl border border-border bg-muted flex items-center justify-center text-primary">
              <FiFilm className="text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{file.name}</div>
              <div className="mt-0.5 font-mono-num text-xs text-muted-foreground">
                {(file.size / 1048576).toFixed(1)} MB · {file.type || "unknown type"}
              </div>
            </div>
            {!running && (
              <button onClick={() => { setFile(null); setDone(false); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Remove file">
                <FiX />
              </button>
            )}
          </div>

          {(running || done) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{STAGE_LABELS[stage]}</span>
                {stage === "uploading" && <span className="font-mono-num">{progress}%</span>}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-primary"
                  animate={{ width: done ? "100%" : `${((stageIndex + 1) / STAGES.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <ul className="grid gap-2 sm:grid-cols-5">
                {STAGES.map((s, i) => (
                  <li
                    key={s}
                    className={`rounded-lg border px-2.5 py-2 text-[11px] ${
                      done || i < stageIndex
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : i === stageIndex
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {STAGE_LABELS[s]}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {done ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 text-sm text-foreground"><FiCheckCircle className="text-primary" /> Outputs generated</span>
              <Button onClick={() => navigate({ to: "/summary" })}>View AI summary</Button>
              <Button variant="outline" onClick={() => navigate({ to: "/moments" })}>Key moments</Button>
              <Button variant="ghost" onClick={() => { setFile(null); setDone(false); }}>Upload another</Button>
            </div>
          ) : (
            <Button onClick={start} loading={running} className="w-full">Run processing pipeline</Button>
          )}
        </motion.div>
      )}
    </div>
  );
}
