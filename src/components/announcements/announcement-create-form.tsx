"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import {
  createAnnouncementAction,
  type AnnouncementActionResult,
} from "@/lib/announcement-actions";

export function AnnouncementCreateForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<
    AnnouncementActionResult | null,
    FormData
  >(createAnnouncementAction, null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form className="form music-form" action={formAction} ref={formRef}>
      <label>
        Title
        <input name="title" required maxLength={255} placeholder="Announcement title" />
      </label>
      <label>
        Message
        <textarea
          name="body"
          required
          rows={5}
          placeholder="What should members know?"
        />
      </label>
      <label className="checkbox-row">
        <input name="sendEmail" type="checkbox" defaultChecked />
        Email active members
      </label>
      {state?.ok ? <p className="form-ok">{state.message}</p> : null}
      {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? "Posting…" : "Post announcement"}
      </button>
    </form>
  );
}
