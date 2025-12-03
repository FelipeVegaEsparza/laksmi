import React from 'react';

interface LegalContentProps {
  content: string;
}

const LegalContent: React.FC<LegalContentProps> = ({ content }) => {
  return (
    <div 
      className="legal-content"
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        fontSize: '1rem',
        lineHeight: '1.75',
        color: '#374151',
        textAlign: 'justify',
      }}
    />
  );
};

export default LegalContent;
