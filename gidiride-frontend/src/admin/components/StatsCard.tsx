import { Icon, type IconName } from '../../shared/components/Icon';

interface StatsCardProps {
  label: string;
  value: string | number;
  helper: string;
  tone?: 'yellow' | 'green' | 'red' | 'neutral';
  icon?: IconName;
}

export function StatsCard({ label, value, helper, tone = 'neutral', icon = 'analytics' }: StatsCardProps) {
  return (
    <article className={`stats-card ${tone}`}>
      <div className="stats-card-head">
        <span className="stats-pin" />
        <div className="stats-icon-badge">
          <Icon name={icon} className="h-5 w-5" />
        </div>
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}
