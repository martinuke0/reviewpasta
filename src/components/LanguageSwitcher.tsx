import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ro' ? 'en' : 'ro');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="fixed top-4 right-4 gap-2"
    >
      <Languages className="h-4 w-4" />
      {language === 'ro' ? 'EN' : 'RO'}
    </Button>
  );
};
