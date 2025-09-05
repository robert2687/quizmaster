import React from 'react';

interface AvatarProps {
  avatarId: string;
  className?: string;
}

const avatarSVGs: Record<string, React.ReactNode> = {
  avatar1: (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
        <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
      </mask>
      <g mask="url(#mask__beam)">
        <rect width="36" height="36" fill="#f0dbff"></rect>
        <rect x="0" y="0" width="36" height="36" transform="translate(4 4) rotate(340 18 18) scale(1.1)" fill="#d4b2ff" rx="36"></rect>
        <g transform="translate(2 -5) rotate(0 18 18)">
          <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#000000"></path>
          <rect x="12" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
          <rect x="22" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
        </g>
      </g>
    </svg>
  ),
  avatar2: (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
        <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
      </mask>
      <g mask="url(#mask__beam)">
        <rect width="36" height="36" fill="#a7f3d0"></rect>
        <rect x="0" y="0" width="36" height="36" transform="translate(6 6) rotate(10 18 18) scale(1.2)" fill="#34d399" rx="6"></rect>
        <g transform="translate(4 -2) rotate(0 18 18)">
          <path d="M15,19 a1,1 0 0,0 6,0" fill="#000000"></path>
          <rect x="14" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
          <rect x="20" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
        </g>
      </g>
    </svg>
  ),
  avatar3: (
     <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
        <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
      </mask>
      <g mask="url(#mask__beam)">
        <rect width="36" height="36" fill="#fecaca"></rect>
        <rect x="0" y="0" width="36" height="36" transform="translate(-4 -4) rotate(280 18 18) scale(1.2)" fill="#f87171" rx="36"></rect>
        <g transform="translate(0 0) rotate(0 18 18)">
          <path d="M13,19 a1,1 0 0,0 10,0" fill="#000000"></path>
          <rect x="13" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
          <rect x="21" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
        </g>
      </g>
    </svg>
  ),
  avatar4: (
     <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
        <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
      </mask>
      <g mask="url(#mask__beam)">
        <rect width="36" height="36" fill="#bae6fd"></rect>
        <rect x="0" y="0" width="36" height="36" transform="translate(3 9) rotate(20 18 18) scale(1.2)" fill="#38bdf8" rx="6"></rect>
        <g transform="translate(2 -2) rotate(0 18 18)">
           <path d="M13,20 a1,1 0 0,1 10,0" fill="#000000"></path>
          <rect x="14" y="13" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
          <rect x="20" y="13" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
        </g>
      </g>
    </svg>
  ),
    avatar5: (
     <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
        <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
      </mask>
      <g mask="url(#mask__beam)">
        <rect width="36" height="36" fill="#fef3c7"></rect>
        <rect x="0" y="0" width="36" height="36" transform="translate(0 0) rotate(180 18 18) scale(1)" fill="#fcd34d" rx="36"></rect>
        <g transform="translate(6 6) rotate(-10 18 18)">
           <path d="M13,24 a1,1.5 0 0,0 10,0" fill="#000000"></path>
          <rect x="11" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
          <rect x="23" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
        </g>
      </g>
    </svg>
  ),
    avatar6: (
     <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
        <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
      </mask>
      <g mask="url(#mask__beam)">
        <rect width="36" height="36" fill="#fecdd3"></rect>
        <rect x="0" y="0" width="36" height="36" transform="translate(1 7) rotate(150 18 18) scale(1.2)" fill="#fb7185" rx="36"></rect>
        <g transform="translate(-4 4) rotate(10 18 18)">
          <path d="M13,20 a1,1 0 0,1 10,0" fill="#000000"></path>
          <rect x="14" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
          <rect x="20" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
        </g>
      </g>
    </svg>
  ),
};

export const AVATAR_OPTIONS = Object.keys(avatarSVGs);

const Avatar: React.FC<AvatarProps> = ({ avatarId, className }) => {
  const svg = avatarSVGs[avatarId] || avatarSVGs.avatar1;
  return <div className={className}>{svg}</div>;
};

export default Avatar;