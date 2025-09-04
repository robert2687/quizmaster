import React from 'react';

interface LinkButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const LinkButton: React.FC<LinkButtonProps> = ({ children, className, ...props }) => {
  const baseClasses = 'font-medium text-purple-400 hover:text-purple-300 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-md disabled:opacity-50 disabled:cursor-not-allowed';
  
  const combinedClasses = `${baseClasses} ${className || ''}`;

  return (
    <button className={combinedClasses.trim()} {...props}>
      {children}
    </button>
  );
};

export default LinkButton;
