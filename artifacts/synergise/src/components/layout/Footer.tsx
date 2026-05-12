export function Footer() {
  return (
    <footer className="border-t border-synergise-border bg-white">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-synergise-text-muted md:text-left">
            Synergise © 2026
          </p>
        </div>
        <p className="text-center text-sm text-synergise-text-muted">
          Made for founder-operators in Southeast Asia
        </p>
      </div>
    </footer>
  );
}
