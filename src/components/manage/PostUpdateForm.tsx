"use client";

import { useActionState, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { postUpdate } from "@/server/actions/updates";
import { initialState } from "@/server/actions/types";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError } from "@/components/ui/FormError";
import { ManageHiddenFields, type ManageContext } from "./ManageHiddenFields";
import { renderMarkdown } from "@/lib/markdown";

export function PostUpdateForm(ctx: ManageContext) {
  const t = useTranslations("manage");
  const tl = useTranslations("log");
  const [state, action] = useActionState(postUpdate, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(false);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await action(fd);
        formRef.current?.reset();
        setText("");
        setPreview(false);
      }}
      className="space-y-3"
    >
      <ManageHiddenFields {...ctx} />

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t("logLabel")}
          </label>
          <div className="flex gap-0.5 rounded-md border border-neutral-200 p-0.5 text-xs dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setPreview(false)}
              className={`rounded px-2.5 py-1 transition ${!preview ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"}`}
            >
              {tl("write")}
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={`rounded px-2.5 py-1 transition ${preview ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"}`}
            >
              {tl("preview")}
            </button>
          </div>
        </div>

        <p className="mb-1.5 text-xs text-neutral-500">{t("logHint")}</p>

        <textarea
          name="text"
          required
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="**Bold**, _italic_, - bullet list…"
          className={`w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 ${preview ? "hidden" : ""}`}
        />

        {preview ? (
          <div className="min-h-24 w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
            {text.trim() ? (
              <div className="md-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
            ) : (
              <p className="text-sm text-neutral-400">{tl("previewEmpty")}</p>
            )}
          </div>
        ) : null}
      </div>

      <FormError code={state.error} />
      <SubmitButton variant="secondary">{t("logPost")}</SubmitButton>
    </form>
  );
}
