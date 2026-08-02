import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

export default memo(function PageHeader({ title, subtitle, onBack, rightAction }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center card-interactive"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">arrow_back</span>
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-on-surface tracking-tight break-words">{title}</h1>
          {subtitle && <p className="text-xs text-on-surface-variant mt-0.5 break-words">{subtitle}</p>}
        </div>
      </div>
      {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
    </div>
  );
});
