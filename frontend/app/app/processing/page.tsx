"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  Database,
  FileSearch,
  Globe2,
  Loader2,
  Sparkles,
  Tags,
  TextSearch,
  WandSparkles,
} from "lucide-react";

import { createKnowledgeItem } from "@/lib/api/knowledge";
import { cn } from "@/lib/utils";

type WorkflowStatus =
  | "processing"
  | "complete"
  | "failed";

const steps = [
  {
    label: "Connecting to source",
    detail: "Opening the link securely",
    icon: Globe2,
  },
  {
    label: "Reading the page",
    detail: "Extracting titles, metadata and useful content",
    icon: FileSearch,
  },
  {
    label: "Classifying knowledge",
    detail: "Understanding what kind of source this is",
    icon: TextSearch,
  },
  {
    label: "Understanding context",
    detail: "Finding the ideas worth remembering",
    icon: BrainCircuit,
  },
  {
    label: "Building your memory",
    detail: "Creating the summary and key takeaways",
    icon: WandSparkles,
  },
  {
    label: "Organizing concepts",
    detail: "Generating accurate memory tags",
    icon: Tags,
  },
  {
    label: "Creating semantic index",
    detail: "Preparing this memory for natural-language search",
    icon: Sparkles,
  },
  {
    label: "Saving to noryX",
    detail: "Storing your new memory securely",
    icon: Database,
  },
];

function ProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startedRef = useRef(false);

  const url = searchParams.get("url")?.trim() ?? "";

  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] =
    useState<WorkflowStatus>("processing");
  const [error, setError] = useState<string | null>(null);
  const [memoryId, setMemoryId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!url) {
      router.replace("/app/capture");
      return;
    }

    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    let mounted = true;

    const progressTimer = window.setInterval(() => {
      if (!mounted) return;

      setCurrentStep((current) =>
        Math.min(current + 1, steps.length - 1),
      );
    }, 1100);

    async function capture() {
      try {
        const response =
          await createKnowledgeItem(url);

        if (!mounted) return;

        if (
          !response.success ||
          response.item.status === "failed"
        ) {
          throw new Error(
            response.warning ??
              "noryX could not process this link.",
          );
        }

        window.clearInterval(progressTimer);

        setCurrentStep(steps.length);
        setMemoryId(response.item.id);
        setStatus("complete");

        window.setTimeout(() => {
          if (mounted) {
            router.push(
              `/app?captured=${response.item.id}`,
            );
            router.refresh();
          }
        }, 1800);
      } catch (captureError) {
        if (!mounted) return;

        window.clearInterval(progressTimer);

        setStatus("failed");
        setError(
          captureError instanceof Error
            ? captureError.message
            : "Failed to capture this link.",
        );
      }
    }

    void capture();

    return () => {
      mounted = false;
      window.clearInterval(progressTimer);
    };
  }, [router, url]);

  const completedSteps =
    status === "complete"
      ? steps.length
      : currentStep;

  const progress =
    status === "complete"
      ? 100
      : Math.max(
          8,
          Math.round(
            ((currentStep + 1) /
              (steps.length + 1)) *
              100,
          ),
        );

  const hostname = getHostname(url);

  return (
    <div className="relative mx-auto min-h-[calc(100vh-56px)] max-w-5xl overflow-hidden px-4 pb-20 pt-10 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-accent/10 blur-[100px]" />

      <div className="relative">
        <button
          type="button"
          onClick={() => router.push("/app/capture")}
          disabled={status === "processing"}
          className="inline-flex items-center gap-2 text-[12px] text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to capture
        </button>

        <div className="mt-8 text-center">
          <WorkflowOrb status={status} />

          <AnimatePresence mode="wait">
            <motion.div
              key={`${status}-${currentStep}`}
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -8,
              }}
              transition={{
                duration: 0.25,
              }}
              className="mt-7"
            >
              <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                {status === "complete"
                  ? "Your memory is ready"
                  : status === "failed"
                    ? "Something went wrong"
                    : steps[currentStep].label}
              </h1>

              <p className="mx-auto mt-2 max-w-lg text-[13.5px] text-muted-foreground">
                {status === "complete"
                  ? "noryX understood, organized and indexed this knowledge."
                  : status === "failed"
                    ? error
                    : steps[currentStep].detail}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mx-auto mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] text-muted-foreground">
            <Globe2 className="h-3 w-3 shrink-0" />

            <span className="truncate">
              {hostname}
            </span>
          </div>
        </div>

        <div className="mx-auto mt-9 max-w-2xl">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {status === "complete"
                ? "Complete"
                : status === "failed"
                  ? "Stopped"
                  : "noryX AI is working"}
            </span>

            <span className="tabular-nums">
              {progress}%
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className={cn(
                "h-full rounded-full",
                status === "failed"
                  ? "bg-destructive"
                  : "bg-accent",
              )}
              initial={{
                width: 0,
              }}
              animate={{
                width: `${progress}%`,
              }}
              transition={{
                duration: 0.65,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
          {steps.map((step, index) => {
            const done = index < completedSteps;

            const active =
              status === "processing" &&
              index === currentStep;

            const pending =
              !done && !active;

            return (
              <motion.div
                key={step.label}
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: index * 0.04,
                }}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-4 transition-colors",
                  done &&
                    "border-emerald-500/20 bg-emerald-500/5",
                  active &&
                    "border-accent/30 bg-accent-soft",
                  pending &&
                    "border-border bg-surface text-muted-foreground",
                  status === "failed" &&
                    active &&
                    "border-destructive/30 bg-destructive/5",
                )}
              >
                {active ? (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ) : null}

                <div className="relative flex items-start gap-3">
                  <div
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                      done &&
                        "bg-emerald-500 text-white",
                      active &&
                        "bg-accent text-accent-foreground",
                      pending &&
                        "bg-muted text-muted-foreground",
                      status === "failed" &&
                        active &&
                        "bg-destructive text-destructive-foreground",
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : status === "failed" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>

                  <div>
                    <div
                      className={cn(
                        "text-[13px] font-medium",
                        !pending &&
                          "text-foreground",
                      )}
                    >
                      {step.label}
                    </div>

                    <div className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      {step.detail}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {status === "complete" ? (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-9 text-center"
          >
            <button
              type="button"
              onClick={() => {
                router.push(
                  `/app?captured=${memoryId ?? ""}`,
                );
                router.refresh();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition hover:opacity-90"
            >
              Open in your library
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        ) : null}

        {status === "failed" ? (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-9 flex justify-center gap-3"
          >
            <button
              type="button"
              onClick={() =>
                router.push("/app/capture")
              }
              className="rounded-full border border-border bg-surface px-5 py-2.5 text-[13px] font-medium"
            >
              Try another link
            </button>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground"
            >
              Try again
            </button>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

function WorkflowOrb({
  status,
}: {
  status: WorkflowStatus;
}) {
  return (
    <div className="relative mx-auto h-40 w-40">
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full blur-2xl",
          status === "failed"
            ? "bg-destructive/20"
            : status === "complete"
              ? "bg-emerald-500/20"
              : "bg-accent/20",
        )}
        animate={{
          scale: [0.85, 1.15, 0.85],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className={cn(
          "absolute inset-5 rounded-full border",
          status === "failed"
            ? "border-destructive/30"
            : status === "complete"
              ? "border-emerald-500/30"
              : "border-accent/30",
        )}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
      </motion.div>

      <motion.div
        className={cn(
          "absolute inset-9 rounded-full border border-dashed",
          status === "failed"
            ? "border-destructive/40"
            : status === "complete"
              ? "border-emerald-500/40"
              : "border-accent/40",
        )}
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <div className="absolute inset-0 grid place-items-center">
        <motion.div
          animate={
            status === "processing"
              ? {
                  scale: [1, 1.08, 1],
                  rotate: [0, 2, -2, 0],
                }
              : {
                  scale: 1,
                  rotate: 0,
                }
          }
          transition={{
            duration: 2,
            repeat:
              status === "processing"
                ? Infinity
                : 0,
            ease: "easeInOut",
          }}
          className={cn(
            "grid h-16 w-16 place-items-center rounded-[22px] text-white shadow-float",
            status === "failed"
              ? "bg-destructive"
              : status === "complete"
                ? "bg-emerald-500"
                : "bg-accent",
          )}
        >
          {status === "failed" ? (
            <AlertTriangle className="h-6 w-6" />
          ) : status === "complete" ? (
            <Check className="h-7 w-7" />
          ) : (
            <Sparkles className="h-6 w-6" />
          )}
        </motion.div>
      </div>

      {status === "processing"
        ? Array.from({
            length: 10,
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
                    (index / 10) *
                      Math.PI *
                      2,
                  ) * 74,
                y:
                  Math.sin(
                    (index / 10) *
                      Math.PI *
                      2,
                  ) * 74,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: index * 0.12,
              }}
            />
          ))
        : null}
    </div>
  );
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(
      /^www\./,
      "",
    );
  } catch {
    return url || "Unknown source";
  }
}

function ProcessingPageLoading() {
  return (
    <div className="grid min-h-[70vh] place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={<ProcessingPageLoading />}>
      <ProcessingContent />
    </Suspense>
  );
}