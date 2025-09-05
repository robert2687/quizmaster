import React from 'react';

interface MedalIconProps extends React.SVGProps<SVGSVGElement> {
  rank: number;
}

const MedalIcon: React.FC<MedalIconProps> = ({ rank, ...props }) => {
  const colors: Record<number, string> = {
    1: '#FFD700', // Gold
    2: '#C0C0C0', // Silver
    3: '#CD7F32', // Bronze
  };
  const color = colors[rank] || 'currentColor';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={color} {...props}>
        <path d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" />
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM4.5 12a7.5 7.5 0 007.5 7.5 7.5 7.5 0 007.5-7.5A7.5 7.5 0 0012 4.5 7.5 7.5 0 004.5 12z" />
         <g transform="translate(-2, -2) scale(1.2)">
            <path d="M12 1.25a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0V2a.75.75 0 01.75-.75zM12 21.75a.75.75 0 01.75.75v-2.5a.75.75 0 01-1.5 0v2.5a.75.75 0 01.75-.75zM5.156 5.156a.75.75 0 011.06 0l1.77 1.77a.75.75 0 11-1.06 1.06l-1.77-1.77a.75.75 0 010-1.06zM17.07 17.07a.75.75 0 011.06 0l1.77 1.77a.75.75 0 11-1.06 1.06l-1.77-1.77a.75.75 0 010-1.06zM2 12a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM18.25 12a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5H19a.75.75 0 01-.75-.75zM5.156 18.844a.75.75 0 010-1.06l1.77-1.77a.75.75 0 111.06 1.06l-1.77 1.77a.75.75 0 01-1.06 0zM17.07 6.93a.75.75 0 010-1.06l1.77-1.77a.75.75 0 111.06 1.06l-1.77 1.77a.75.75 0 01-1.06 0z" />
        </g>
    </svg>
  );
};

export default MedalIcon;