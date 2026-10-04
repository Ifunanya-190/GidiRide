import { useState } from 'react';
import { Icon } from './Icon';

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export function StarRatingInput({ value, onChange, max = 5 }: StarRatingInputProps) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value;

  return (
    <div className="star-rating-input" role="radiogroup" aria-label="Star rating">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className={star <= active ? 'filled' : ''}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(star)}
        >
          <Icon name="star" className="h-7 w-7" />
        </button>
      ))}
    </div>
  );
}

export function StarRatingDisplay({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="star-rating-display" aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <Icon key={star} name="star" className={star <= value ? 'h-4 w-4 filled' : 'h-4 w-4'} />
      ))}
    </div>
  );
}
