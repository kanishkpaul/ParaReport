type RiskFlagListProps = {
  flags: string[];
};

export function RiskFlagList({ flags }: RiskFlagListProps) {
  return (
    <ul className="flag-list">
      {flags.map((flag) => (
        <li key={flag}>{flag}</li>
      ))}
    </ul>
  );
}
