export default function EmptyState({ icon = '🍽️', title, text, action }) {
  return (
    <div className="text-center py-5 px-3">
      <div className="display-3 mb-3">{icon}</div>
      <h2 className="h4">{title}</h2>
      {text && <p className="text-body-secondary mx-auto mb-4">{text}</p>}
      {action}
    </div>
  );
}
