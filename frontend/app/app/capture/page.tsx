"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  FileText,
  Globe,
  Link2,
  Loader2,
  MessageCircle,
  Rss,
  Sparkles,
} from "lucide-react";

import { createKnowledgeItem } from "@/lib/api/knowledge";
import { cn } from "@/lib/utils";

const supported = [
  {
    icon: Globe,
    label: "YouTube",
  },
  {
    icon: Globe,
    label: "X",
  },
  {
    icon: Globe,
    label: "LinkedIn",
  },
  {
    icon: Globe,
    label: "Instagram",
  },
  {
    icon: MessageCircle,
    label: "Reddit",
  },
  {
    icon: FileText,
    label: "Articles",
  },
  {
    icon: Rss,
    label: "Blogs",
  },
];

const workflowSteps = [
  {
    label: "Uploading link",
    detail: "Securing connection",
  },
  {
    label: "Reading webpage",
    detail: "Fetching content and metadata",
  },
  {
    label: "Extracting content",
    detail: "Parsing useful text and structure",
  },
  {
    label: "Understanding context",
    detail: "Building semantic understanding",
  },
  {
    label: "Generating summary",
    detail: "Distilling the knowledge into a memory",
  },
  {
    label: "Generating tags",
    detail: "Organizing concepts for later retrieval",
  },
  {
    label: "Creating embedding",
    detail: "Preparing natural-language search",
  },
  {
    label: "Done",
    detail: "Saved securely to your library",
  },
];

type WorkflowStatus =
  | "idle"
  | "processing"
  | "complete"
  | "failed";

export default function CapturePage() {
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [status, setStatus] =
    useState<WorkflowStatus>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [memoryId, setMemoryId] = useState<string | null>(
    null,
  );

  const isSubmitting = status === "processing";
  const showWorkflow = status !== "idle";

  async function analyze() {
    const normalizedUrl = url.trim();

    if (!normalizedUrl || isSubmitting) {
      return;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }

    setStatus("processing");
    setCurrentStep(0);
    setMemoryId(null);
    setError(null);

    const progressTimer = window.setInterval(() => {
      setCurrentStep((current) =>
        Math.min(
          current + 1,
          workflowSteps.length - 2,
        ),
      );
    }, 950);

    try {
      const response =
        await createKnowledgeItem(normalizedUrl);

      window.clearInterval(progressTimer);

      if (
        !response.success ||
        response.item.status === "failed"
      ) {
        throw new Error(
          response.warning ??
            "noryX could not process this link.",
        );
      }

      setCurrentStep(workflowSteps.length - 1);
      setMemoryId(response.item.id);
      setStatus("complete");

      clearLibraryCache();
    } catch (captureError) {
      window.clearInterval(progressTimer);

      setStatus("failed");
      setError(
        captureError instanceof Error
          ? captureError.message
          : "Failed to capture this link.",
      );
    }
  }

  function resetCapture() {
    setUrl("");
    setStatus("idle");
    setCurrentStep(0);
    setMemoryId(null);
    setError(null);
  }

  function openLibrary() {
    router.push(
      `/app?captured=${memoryId ?? ""}`,
    );
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-14 lg:px-8">
      <AnimatePresence mode="wait">
        {!showWorkflow ? (
          <motion.div
            key="capture-form"
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
          >
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <Sparkles className="h-5 w-5" />
              </div>

              <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight">
                Capture a new idea.
              </h1>

              <p className="mx-auto mt-2 max-w-xl text-center text-[14px] text-muted-foreground">
                Paste a link from anywhere. noryX AI will
                read it, summarize it, tag it and transform
                it into searchable knowledge.
              </p>
            </div>

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.1,
              }}
              className="mt-10 rounded-3xl border border-border bg-surface p-6 shadow-elegant"
            >
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Paste URL
              </label>

              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 focus-within:border-foreground/20">
                <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />

                <input
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    setError(null);
                  }}
                  placeholder="https://example.com/article"
                  className="min-w-0 flex-1 bg-transparent text-[14px] focus:outline-none"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void analyze();
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard
                      ?.readText()
                      .then(setUrl)
                      .catch(() => {
                        setError(
                          "Unable to read the clipboard.",
                        );
                      });
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11.5px] text-muted-foreground hover:text-foreground"
                >
                  <ClipboardCheck className="h-3 w-3" />
                  Paste
                </button>
              </div>

              {error ? (
                <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void analyze()}
                disabled={!url.trim()}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-[14px] font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                Analyze with AI
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="mt-6 border-t border-border pt-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Works with
                </p>

                <div className="flex flex-wrap gap-2">
                  {supported.map((source) => (
                    <div
                      key={source.label}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[12px] text-muted-foreground"
                    >
                      <source.icon className="h-3.5 w-3.5" />
                      {source.label}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="workflow"
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
          >
            <WorkflowDisplay
              status={status}
              currentStep={currentStep}
              url={url}
              error={error}
              onReset={resetCapture}
              onRetry={() => void analyze()}
              onOpenLibrary={openLibrary}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WorkflowDisplay({
  status,
  currentStep,
  url,
  error,
  onReset,
  onRetry,
  onOpenLibrary,
}: {
  status: WorkflowStatus;
  currentStep: number;
  url: string;
  error: string | null;
  onReset: () => void;
  onRetry: () => void;
  onOpenLibrary: () => void;
}) {
  const complete = status === "complete";
  const failed = status === "failed";

  const progress = complete
    ? 100
    : Math.round(
        ((currentStep + 1) /
          workflowSteps.length) *
          100,
      );

  return (
    <div className="flex flex-col items-center">
      <WorkflowOrb status={status} />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${status}-${currentStep}`}
          initial={{
            opacity: 0,
            y: 6,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: -6,
          }}
          transition={{
            duration: 0.25,
          }}
          className="mt-7 text-center"
        >
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {complete
              ? "Your memory is ready"
              : failed
                ? "Processing failed"
                : workflowSteps[currentStep].label}
          </h1>

          <p className="mt-2 text-[13.5px] text-muted-foreground">
            {complete
              ? "The knowledge has been saved and indexed."
              : failed
                ? error
                : workflowSteps[currentStep].detail}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 max-w-full truncate rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] text-muted-foreground">
        {getHostname(url)}
      </div>

      <div className="mt-8 h-1 w-full max-w-md overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn(
            "h-full rounded-full",
            failed
              ? "bg-destructive"
              : complete
                ? "bg-emerald-500"
                : "bg-primary",
          )}
          initial={{
            width: 0,
          }}
          animate={{
            width: `${progress}%`,
          }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </div>

      <ol className="mt-10 w-full max-w-md space-y-3">
        {workflowSteps.map((step, index) => {
          const done =
            complete || index < currentStep;

          const active =
            !complete &&
            index === currentStep;

          const pending = !done && !active;

          return (
            <motion.li
              key={step.label}
              initial={{
                opacity: 0,
                x: -6,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: index * 0.03,
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13.5px] transition",
                done &&
                  "border-emerald-500/20 bg-emerald-500/5",
                active &&
                  !failed &&
                  "border-accent/20 bg-accent-soft",
                active &&
                  failed &&
                  "border-destructive/30 bg-destructive/10",
                pending &&
                  "border-border bg-surface text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                  done &&
                    "bg-emerald-500 text-white",
                  active &&
                    !failed &&
                    "bg-accent text-accent-foreground",
                  active &&
                    failed &&
                    "bg-destructive text-destructive-foreground",
                  pending &&
                    "border border-border bg-background",
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : active && failed ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="text-[10px]">
                    {index + 1}
                  </span>
                )}
              </span>

              <div>
                <div
                  className={cn(
                    "font-medium",
                    !pending && "text-foreground",
                  )}
                >
                  {step.label}
                </div>

                {active ? (
                  <div className="text-[11px] text-muted-foreground">
                    {step.detail}
                  </div>
                ) : null}
              </div>
            </motion.li>
          );
        })}
      </ol>

      {complete ? (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-[13.5px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Capture another
          </button>

          <button
            type="button"
            onClick={onOpenLibrary}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-medium text-primary-foreground"
          >
            Open in library
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {failed ? (
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-border bg-surface px-5 py-2.5 text-[13.5px] font-medium"
          >
            Use another link
          </button>

          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-medium text-primary-foreground"
          >
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}

function WorkflowOrb({
  status,
}: {
  status: WorkflowStatus;
}) {
  const complete = status === "complete";
  const failed = status === "failed";

  return (
    <div className="relative h-40 w-40">
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full blur-2xl",
          failed
            ? "bg-destructive/20"
            : complete
              ? "bg-emerald-500/20"
              : "bg-accent/20",
        )}
        animate={{
          scale: [0.9, 1.15, 0.9],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute inset-6 rounded-full border border-accent/30"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        className="absolute inset-10 rounded-full border border-accent/50"
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <div className="absolute inset-0 grid place-items-center">
        <motion.div
          animate={{
            scale: [1, 1.06, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={cn(
            "grid h-16 w-16 place-items-center rounded-2xl text-white shadow-float",
            failed
              ? "bg-destructive"
              : complete
                ? "bg-emerald-500"
                : "bg-accent",
          )}
        >
          {failed ? (
            <AlertTriangle className="h-6 w-6" />
          ) : complete ? (
            <Check className="h-7 w-7" />
          ) : (
            <Sparkles className="h-6 w-6" />
          )}
        </motion.div>
      </div>

      {!complete && !failed
        ? Array.from({
            length: 8,
          }).map((_, index) => (
            <motion.span
              key={index}
              className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-accent"
              initial={{
                x: 0,
                y: 0,
                opacity: 0,
              }}
              animate={{
                x:
                  Math.cos(
                    (index / 8) *
                      Math.PI *
                      2,
                  ) * 70,
                y:
                  Math.sin(
                    (index / 8) *
                      Math.PI *
                      2,
                  ) * 70,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.15,
              }}
            />
          ))
        : null}
    </div>
  );
}

function getHostname(value: string): string {
  try {
    return new URL(value).hostname.replace(
      /^www\./,
      "",
    );
  } catch {
    return value;
  }
}

function clearLibraryCache() {
  const keysToRemove: string[] = [];

  for (
    let index = 0;
    index < sessionStorage.length;
    index += 1
  ) {
    const key = sessionStorage.key(index);

    if (key?.startsWith("memora-library:")) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    sessionStorage.removeItem(key);
  });
}