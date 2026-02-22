import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAllBusinesses, initTestData, Business } from "@/lib/db";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AuthButton } from "@/components/AuthButton";
import { Plus, ExternalLink } from "lucide-react";

const Index = () => {
  const { t } = useLanguage();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Initialize test data if database is empty
      await initTestData();

      // Fetch all businesses
      const data = await getAllBusinesses();
      setBusinesses(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LanguageSwitcher />
      <AuthButton />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 p-4 pt-12">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">{t.appName}</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {t.appDescription}
          </p>
        </div>

        <div className="flex justify-center">
          <Button asChild size="lg">
            <Link to="/add-business">
              <Plus className="h-5 w-5" /> {t.addNewBusiness}
            </Link>
          </Button>
        </div>

        {/* Business List */}
        {loading ? (
          <p className="text-center text-muted-foreground">{t.loading}</p>
        ) : businesses.length === 0 ? (
          <p className="text-center text-muted-foreground">{t.noBusiness}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">{t.existingBusinesses}</h2>
            {businesses.map((b) => (
              <Link key={b.id} to={`/review/${b.slug}`}>
                <Card className="transition-colors hover:bg-accent">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-foreground">{b.name}</p>
                      {b.location && <p className="text-sm text-muted-foreground">{b.location}</p>}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground">
        {t.poweredBy} <strong>{t.appName}</strong>
      </footer>
    </div>
  );
};

export default Index;
