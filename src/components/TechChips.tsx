export function TechChips({ items, tone = "plain" }: { items: string[]; tone?: "plain" | "accent" }) {
  return (
    <ul className={`chips chips--${tone}`} aria-label="技术栈">
      {items.map((item) => (
        <li key={item} className="chips__item">
          {item}
        </li>
      ))}
    </ul>
  );
}
