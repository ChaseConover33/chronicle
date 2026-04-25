import { WriteForm } from "./write-form";

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const sp = await searchParams;
  const initialDate = sp.date ?? new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">New Entry</h1>
      <WriteForm initialDate={initialDate} />
    </div>
  );
}
