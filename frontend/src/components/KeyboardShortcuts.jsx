import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function KeyboardShortcuts() {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Use Alt key for shortcuts
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault();
            navigate('/');
            break;
          case 'g':
            e.preventDefault();
            navigate('/goals');
            break;
          case 'c':
            e.preventDefault();
            navigate('/cycles');
            break;
          case 'r':
            e.preventDefault();
            navigate('/reviews');
            break;
          case 't':
            e.preventDefault();
            toggleTheme();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toggleTheme]);

  return null;
}
