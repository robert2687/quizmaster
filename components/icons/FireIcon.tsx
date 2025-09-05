import React from 'react';

const FireIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M12.963 2.286a.75.75 0 00-1.071 1.052A9.75 9.75 0 0110.5 18c0-5.523 4.477-10 10-10a.75.75 0 000-1.5c-4.506 0-8.48-2.686-10.366-6.432.124.01.248.016.373.016.828 0 1.59-.28 2.2-1.332z"
      clipRule="evenodd"
    />
    <path
      fillRule="evenodd"
      d="M6.75 12c0-5.523 4.477-10 10-10a.75.75 0 000-1.5c-6.326 0-11.485 5.01-11.75 11.25A9.75 9.75 0 0010.5 18c5.523 0 10-4.477 10-10a.75.75 0 00-1.5 0c0 4.694-3.806 8.5-8.5 8.5S6.75 16.694 6.75 12z"
      clipRule="evenodd"
    />
  </svg>
);

export default FireIcon;
