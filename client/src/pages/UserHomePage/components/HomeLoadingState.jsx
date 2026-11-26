export default function HomeLoadingState() {
  return (
    <div className="home-loading" role="status" aria-live="polite">
      <span className="home-loading-spinner" aria-hidden="true" />
      <span className="qs-condensed">Loading adventures...</span>
    </div>
  );
}
