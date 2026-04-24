import { asc } from "drizzle-orm";
import { db } from "@/db";
import { domains, templates } from "@/db/schema";
import { WriteForm } from "./write-form";

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; template?: string }>;
}) {
  const sp = await searchParams;
  const [templateRows, domainRows] = await Promise.all([
    db.select().from(templates).orderBy(asc(templates.sortOrder)).all(),
    db.select().from(domains).orderBy(asc(domains.sortOrder)).all(),
  ]);

  const initialDate = sp.date ?? new Date().toISOString().slice(0, 10);
  const initialTemplateId =
    sp.template ?? templateRows.find((t) => t.name === "Daily Journal")?.id ?? templateRows[0]?.id;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">New Entry</h1>
      <WriteForm
        templates={templateRows}
        domains={domainRows}
        initialDate={initialDate}
        initialTemplateId={initialTemplateId}
      />
    </div>
  );
}
