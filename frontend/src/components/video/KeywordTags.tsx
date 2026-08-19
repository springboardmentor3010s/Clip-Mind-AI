import React from 'react';

interface KeywordTagsProps {
  keywords: string[];
}

export const KeywordTags: React.FC<KeywordTagsProps> = ({ keywords }) => {
  if (!keywords || keywords.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-title-small font-semibold text-md-on-surface mb-3">Keywords</h3>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="px-3 py-1 bg-md-secondary-container text-md-on-secondary-container text-label-small font-medium rounded-full"
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>
  );
};
