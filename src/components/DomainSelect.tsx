import { DOMAINS } from './profileOptions';

interface DomainSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className: string;
}

export function DomainSelect({
  id,
  value,
  onChange,
  className,
}: DomainSelectProps) {
  const isCustom = Boolean(value) && !DOMAINS.includes(value);

  return (
    <div className="space-y-2">
      <select
        id={id}
        value={isCustom ? 'Custom' : value}
        onChange={(event) =>
          onChange(event.target.value === 'Custom' ? '' : event.target.value)
        }
        className={className}
      >
        <option value="" disabled hidden>
          Select a domain
        </option>
        {DOMAINS.map((domain) => (
          <option key={domain} value={domain}>
            {domain}
          </option>
        ))}
        <option value="Custom">Other / Custom</option>
      </select>
      {(isCustom || value === '') && (
        <input
          type="text"
          value={isCustom ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter your domain"
          aria-label="Custom domain"
          maxLength={100}
          className={className}
          required
        />
      )}
    </div>
  );
}
