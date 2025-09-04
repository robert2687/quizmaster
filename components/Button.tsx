import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'share';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className, 
  ...props 
}) => {
  const baseClasses = 'flex items-center justify-center px-6 py-3 font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white focus:ring-pink-500',
    secondary: 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white focus:ring-teal-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    share: 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white focus:ring-cyan-500',
  };

  // Combine base, variant, and any additional classes passed via props
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className || ''}`;

  return (
    <button className={combinedClasses.trim()} {...props}>
      {children}
    </button>
  );
};

export default Button;
