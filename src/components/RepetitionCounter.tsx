interface RepetitionCounterProps {
  currentRound: number;
  totalRounds: number;
}

export function RepetitionCounter({ currentRound, totalRounds }: RepetitionCounterProps) {
  return (
    <p className="text-lg font-medium opacity-70 sm:text-xl">
      Round {currentRound} / {totalRounds}
    </p>
  );
}
