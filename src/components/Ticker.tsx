"use client";

type TickerProps = {
  items: string[];
};

export default function Ticker({ items }: TickerProps) {
  const headlines =
    items.length > 0
      ? items
      : ["Post your first listing", "Books /// Cycles /// Calculators"];

  const loop = [...headlines, ...headlines];

  return (
    <div className="overflow-hidden border-b-[4px] border-black bg-black py-2 text-white">
      <div className="marquee-track items-center gap-8 pr-8">
        {[0, 1].map((half) => (
          <div key={half} className="flex items-center gap-8 pr-8" aria-hidden={half === 1}>
            <span className="border-2 border-brutal-yellow bg-brutal-yellow px-2 py-0.5 font-display text-xs text-black">
              FRESH DROP
            </span>
            {loop.map((text, i) => (
              <span key={`${half}-${i}`} className="flex items-center gap-8">
                <span className="whitespace-nowrap font-mono text-xs font-bold uppercase tracking-widest">
                  {text}
                </span>
                <span className="font-display text-xs text-brutal-yellow">{"///"}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
