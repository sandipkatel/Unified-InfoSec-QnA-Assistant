import React from 'react';

export default function PolicyDocumentList() {
  const policyDocuments = [
    "Access Control Policy",
    "Incident Response Policy",
    "Risk Management Policy",
  ];

  return (
      <ul className="space-y-2">
        {policyDocuments.map((document, index) => (
          <li key={index} className="hover:bg-gray-300 p-2 rounded">
            <a 
              href={`${document.replace(/\s+/g, '-').toLowerCase()}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              {document}
            </a>
          </li>
        ))}
      </ul>
  );
}