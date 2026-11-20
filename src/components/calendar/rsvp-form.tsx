"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  saveRsvpAction,
  type ConcertActionResult,
} from "@/lib/concert-actions";

type YesNo = "yes" | "no";

type Defaults = {
  coming: YesNo;
  practiceSaturday: YesNo;
  programSaturday: YesNo;
  programSunday: YesNo;
  needHousing: YesNo;
  housingDays: string;
  housingPeople: string;
  notes: string;
};

function YesNoSelect({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: YesNo;
}) {
  return (
    <label>
      {label}
      <select name={name} defaultValue={defaultValue} required>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </label>
  );
}

export function RsvpForm({
  concertId,
  defaults,
}: {
  concertId: string;
  defaults: Defaults;
}) {
  const router = useRouter();
  const action = saveRsvpAction.bind(null, concertId);
  const [state, formAction, pending] = useActionState<
    ConcertActionResult | null,
    FormData
  >(action, null);
  const [needHousing, setNeedHousing] = useState<YesNo>(defaults.needHousing);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form className="form music-form" action={formAction}>
      <div className="music-form__row">
        <YesNoSelect name="coming" label="Coming" defaultValue={defaults.coming} />
        <YesNoSelect
          name="practiceSaturday"
          label="Practice Saturday"
          defaultValue={defaults.practiceSaturday}
        />
      </div>
      <div className="music-form__row">
        <YesNoSelect
          name="programSaturday"
          label="Program Saturday"
          defaultValue={defaults.programSaturday}
        />
        <YesNoSelect
          name="programSunday"
          label="Program Sunday"
          defaultValue={defaults.programSunday}
        />
      </div>
      <label>
        Need housing
        <select
          name="needHousing"
          defaultValue={defaults.needHousing}
          required
          onChange={(event) => setNeedHousing(event.target.value as YesNo)}
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </label>
      {needHousing === "yes" ? (
        <div className="music-form__row">
          <label>
            Housing days
            <input
              name="housingDays"
              required
              defaultValue={defaults.housingDays}
              placeholder="Fri–Sun"
            />
          </label>
          <label>
            Housing people
            <input
              name="housingPeople"
              type="number"
              min={1}
              step={1}
              required
              defaultValue={defaults.housingPeople || "1"}
            />
          </label>
        </div>
      ) : null}
      <label>
        Notes
        <textarea
          name="notes"
          rows={2}
          defaultValue={defaults.notes}
          placeholder="Optional"
        />
      </label>
      {state?.ok ? <p className="form-ok">{state.message}</p> : null}
      {state && !state.ok ? <p className="form-error">{state.error}</p> : null}
      <button className="btn btn-dark" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save RSVP"}
      </button>
    </form>
  );
}
