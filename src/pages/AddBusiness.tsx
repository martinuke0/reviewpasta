import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { addBusiness } from "@/lib/db";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const AddBusiness = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !placeId.trim()) {
      toast.error(t.errorRequired);
      return;
    }

    setSaving(true);
    const slug = generateSlug(name);

    try {
      await addBusiness({
        name: name.trim(),
        slug,
        place_id: placeId.trim(),
        location: location.trim() || undefined,
        description: description.trim() || undefined,
      });

      toast.success(t.successAdded);
      navigate(`/review/${slug}`);
    } catch (error) {
      const errorMsg = (error as Error).message;
      toast.error(errorMsg.includes('exists') ? t.errorDuplicate : t.errorSave);
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LanguageSwitcher />
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </Link>
          <CardTitle>{t.addBusinessTitle}</CardTitle>
          <CardDescription>{t.addBusinessDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="name">{t.businessName}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.businessNamePlaceholder} />
            </div>
            <div>
              <Label htmlFor="placeId">{t.googlePlaceId}</Label>
              <Input id="placeId" value={placeId} onChange={(e) => setPlaceId(e.target.value)} placeholder={t.googlePlaceIdPlaceholder} />
            </div>
            <div>
              <Label htmlFor="location">{t.location}</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t.locationPlaceholder} />
            </div>
            <div>
              <Label htmlFor="description">{t.description}</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.descriptionPlaceholder} />
            </div>
            <Button type="submit" disabled={saving} className="mt-2">
              {saving ? t.saving : t.saveBusiness}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddBusiness;
