
import React from 'react';

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9.75 3.104a2.25 2.25 0 013.592 0L15 5.25l2.146-1.61a2.25 2.25 0 013.592 3.188l-1.61 2.147L21 11.25l-1.61 2.146a2.25 2.25 0 01-3.188 3.592L13.75 15l-2.147 1.61a2.25 2.25 0 01-3.592-3.188l1.61-2.147L9 11.25l1.61-2.146A2.25 2.25 0 019.75 3.104zM5.25 9L3 11.25l2.25 2.25L7.5 18l2.25-2.25L12 13.5l-2.25-2.25L7.5 9z" />
  </svg>
);

export default SparklesIcon;
