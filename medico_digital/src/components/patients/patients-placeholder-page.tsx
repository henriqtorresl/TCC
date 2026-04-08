type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8">
        <h1 className="text-xl font-semibold text-zinc-100 md:text-2xl">{title}</h1>
        <p className="mt-2 text-sm text-zinc-400 md:text-base">{description}</p>
      </div>
    </section>
  );
}
