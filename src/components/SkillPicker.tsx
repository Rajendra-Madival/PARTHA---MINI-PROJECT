import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SKILL_OPTIONS } from './profileOptions';

interface SkillPickerProps {
  id: string;
  skills: string[];
  onChange: (skills: string[]) => void;
  className: string;
}

export function SkillPicker({
  id,
  skills,
  onChange,
  className,
}: SkillPickerProps) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      SKILL_OPTIONS.filter(
        (skill) =>
          skill.toLowerCase().includes(normalizedQuery) &&
          !skills.some((selected) => selected.toLowerCase() === skill.toLowerCase()),
      ).slice(0, 8),
    [normalizedQuery, skills],
  );

  function addSkill(skill: string) {
    const clean = skill.trim();
    if (
      clean &&
      !skills.some((selected) => selected.toLowerCase() === clean.toLowerCase())
    ) {
      onChange([...skills, clean].slice(0, 15));
    }
    setQuery('');
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-900"
          >
            {skill}
            <button
              type="button"
              onClick={() =>
                onChange(skills.filter((selected) => selected !== skill))
              }
              aria-label={`Remove ${skill}`}
              className="rounded-full hover:text-red-700"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          id={id}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && query.trim()) {
              event.preventDefault();
              addSkill(results[0] ?? query);
            }
          }}
          placeholder="Search or type a custom skill"
          aria-label="Search skills"
          className={className}
        />
        {query.trim() && (
          <div
            role="listbox"
            aria-label="Matching skills"
            className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[#E5DFD0] bg-white p-1 shadow-lg"
          >
            {results.map((skill) => (
              <button
                key={skill}
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => addSkill(skill)}
                className="block w-full rounded-md px-3 py-2 text-left text-xs text-stone-700 hover:bg-emerald-50"
              >
                {skill}
              </button>
            ))}
            {!SKILL_OPTIONS.some(
              (skill) => skill.toLowerCase() === normalizedQuery,
            ) && (
              <button
                type="button"
                onClick={() => addSkill(query)}
                className="block w-full rounded-md px-3 py-2 text-left text-xs font-medium text-emerald-800 hover:bg-emerald-50"
              >
                Add custom skill &quot;{query.trim()}&quot;
              </button>
            )}
            {results.length === 0 &&
              SKILL_OPTIONS.some(
                (skill) => skill.toLowerCase() === normalizedQuery,
              ) && (
                <p className="px-3 py-2 text-xs text-stone-500">
                  This skill is already selected.
                </p>
              )}
          </div>
        )}
      </div>
      <p className="text-[11px] text-stone-500">Choose up to 15 skills.</p>
    </div>
  );
}
