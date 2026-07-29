import { memo } from 'react';

export default memo(function EmptyState({
  icon = 'inbox',
  title = 'Nothing here yet',
  message = '',
  action,
  actionLabel,
  onAction,
}) {
  return (
    <div className="card p-8 flex flex-col items-center text-center animate-fade-in-up">
      <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-outline text-[28px]">{icon}</span>
      </div>
      <h3 className="text-base font-bold text-on-surface mb-1">{title}</h3>
      {message && <p className="text-sm text-on-surface-variant max-w-[260px]">{message}</p>}
      {action && actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold card-interactive"
        >
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">{action}</span>
            {actionLabel}
          </span>
        </button>
      )}
    </div>
  );
});
