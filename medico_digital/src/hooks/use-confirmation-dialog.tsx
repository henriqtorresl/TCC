"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type ConfirmationOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

type ConfirmationState = (ConfirmationOptions & {
  open: boolean;
  resolve: (value: boolean) => void;
}) | null;

const OVERLAY_CLASS =
  "fixed inset-0 z-[100] bg-black/60 backdrop-blur-[1px] transition-opacity";
const DIALOG_CLASS =
  "fixed left-1/2 top-1/2 z-[101] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-2xl";

export function useConfirmationDialog() {
  const [state, setState] = useState<ConfirmationState>(null);

  const close = useCallback(
    (accepted: boolean) => {
      if (!state) {
        return;
      }
      state.resolve(accepted);
      setState(null);
    },
    [state],
  );

  const requestConfirmation = useCallback(
    (options: ConfirmationOptions): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        setState({
          open: true,
          resolve,
          title: options.title,
          description: options.description,
          confirmLabel: options.confirmLabel ?? "Confirmar",
          cancelLabel: options.cancelLabel ?? "Cancelar",
          tone: options.tone ?? "default",
        });
      }),
    [],
  );

  const confirmationDialog = useMemo(() => {
    if (!state?.open) {
      return null;
    }

    return (
      <>
        <div className={OVERLAY_CLASS} onClick={() => close(false)} />
        <div
          className={DIALOG_CLASS}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <h2 id="confirm-dialog-title" className="text-base font-semibold">
            {state.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-300">{state.description}</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
              onClick={() => close(false)}
            >
              {state.cancelLabel}
            </Button>
            <Button
              type="button"
              className={
                state.tone === "danger"
                  ? "bg-rose-600 text-white hover:bg-rose-500"
                  : "bg-emerald-600 text-zinc-950 hover:bg-emerald-500"
              }
              onClick={() => close(true)}
            >
              {state.confirmLabel}
            </Button>
          </div>
        </div>
      </>
    );
  }, [close, state]);

  return { requestConfirmation, confirmationDialog };
}

