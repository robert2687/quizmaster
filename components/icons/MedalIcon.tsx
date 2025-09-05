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
    <svg xmlns="http://www.w.org/2000/svg" viewBox="0 0 24 24" fill={color} {...props}>
        <path fillRule="evenodd" d="M17.5 3.75a.75.75 0 00-1.5 0V4.5h-1.5V3.75a.75.75 0 00-1.5 0V4.5h-1.5V3.75a.75.75 0 00-1.5 0V4.5H8.5V3.75a.75.75 0 00-1.5 0V4.5A2.25 2.25 0 004.75 6.75v5.076c0 .934.364 1.823.99 2.478.627.654 1.488.996 2.41.996h4.7c.922 0 1.783-.342 2.41-.996.626-.655.99-1.544.99-2.478V6.75A2.25 2.25 0 0017.5 4.5V3.75zM8.5 6A.5.5 0 008 6.5v.25a.75.75 0 001.5 0V6.5A.5.5 0 008.5 6zM15.5 6a.5.5 0 00-.5.5v.25a.75.75 0 001.5 0V6.5a.5.5 0 00-.5-.5z" clipRule="evenodd" />
        <path d="M6 18.75a3 3 0 003 3h6a3 3 0 003-3v-1.5H6v1.5z" />
    </svg>
  );
};

export default MedalIcon;