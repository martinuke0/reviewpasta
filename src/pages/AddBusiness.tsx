import { useState, useRef } from "react";
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
import { ArrowLeft, Link as LinkIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { extractPlaceIdFromUrl, isValidPlaceIdFormat } from "@/lib/placeIdParser";

const AddBusiness = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMapsUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setMapsUrl(url);

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    if (url.trim().length === 0) {
      setExtractionStatus('idle');
      return;
    }

    toastTimerRef.current = setTimeout(() => {
      if (url.trim().length > 10) {
        const extracted = extractPlaceIdFromUrl(url);
        if (extracted && isValidPlaceIdFormat(extracted)) {
          setPlaceId(extracted);
          setExtractionStatus('success');
          toast.success(t.placeIdExtracted);
        } else if (url.trim().length > 20) {
          setExtractionStatus('error');
          toast.error(t.placeIdNotFound);
        } else {
          setExtractionStatus('idle');
        }
      } else {
        setExtractionStatus('idle');
      }
    }, 400);
  };

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
              <Label htmlFor="mapsUrl" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                {t.mapsUrl}
              </Label>
              <div className="relative">
                <Input
                  id="mapsUrl"
                  type="url"
                  value={mapsUrl}
                  onChange={handleMapsUrlChange}
                  placeholder={t.mapsUrlPlaceholder}
                  disabled={saving}
                  className={cn(
                    "font-mono text-sm pr-10",
                    extractionStatus === 'success' && "border-green-500",
                    extractionStatus === 'error' && "border-red-500"
                  )}
                />
                {extractionStatus === 'success' && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
                {extractionStatus === 'error' && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.mapsUrlHelper}</p>
            </div>
            <div>
              <Label htmlFor="placeId">{t.googlePlaceId}</Label>
              <Input id="placeId" value={placeId} onChange={(e) => setPlaceId(e.target.value)} placeholder={t.googlePlaceIdPlaceholder} className="font-mono" />
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
