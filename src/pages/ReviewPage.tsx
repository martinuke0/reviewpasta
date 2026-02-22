import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Star, Copy, Check, ExternalLink, RefreshCw, QrCode, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getBusinessBySlug, updateBusinessDescription, canEditBusiness, Business } from "@/lib/db";
import { generateReview as generateLocalReview, reviewTemplates, type Language } from "@/lib/reviewGenerator";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AuthButton } from "@/components/AuthButton";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeDialog } from "@/components/QRCodeDialog";
import { EditBusinessDialog } from "@/components/EditBusinessDialog";
import { toast } from "sonner";

const ReviewPage = () => {
  const { t, language } = useLanguage();
  const { user, isAdmin } = useAuth();
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [stars, setStars] = useState(5);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      const data = await getBusinessBySlug(businessSlug!);

      if (!data) {
        setLoading(false);
        return;
      }
      setBusiness(data);
      setLoading(false);
      // Use instant template generation on first load
      generateReviewInstant(data, 5);
    };
    fetchBusiness();
  }, [businessSlug]);

  useEffect(() => {
    const checkEditPermission = async () => {
      if (business && user) {
        const canEditResult = await canEditBusiness(business.id!, user.id);
        setCanEdit(canEditResult);
      } else {
        setCanEdit(false);
      }
    };
    checkEditPermission();
  }, [business, user, isAdmin]);

  // Instant synchronous review generation using templates
  const generateReviewInstant = (biz: Business, starCount: number) => {
    const rating = Math.max(1, Math.min(5, Math.round(starCount))) as 1 | 2 | 3 | 4 | 5;
    const templates = reviewTemplates[language as Language][rating];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const generatedReview = template.replace(/{business}/g, biz.name);
    setReview(generatedReview);
  };

  // Async review generation (for regenerate button)
  const generateReview = async (biz: Business, starCount: number) => {
    setGenerating(true);
    try {
      const generatedReview = await generateLocalReview(
        biz.name,
        biz.location,
        biz.description,
        starCount,
        language as Language
      );
      setReview(generatedReview);
    } catch (error) {
      toast.error(t.errorGenerate);
    } finally {
      setGenerating(false);
    }
  };

  const handleStarClick = (rating: number) => {
    setStars(rating);
    if (business) generateReviewInstant(business, rating);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(review);
    setCopied(true);
    toast.success(t.successCopied);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGoogle = () => {
    if (business) {
      window.open(
        `https://search.google.com/local/writereview?placeid=${business.place_id}`,
        "_blank"
      );
    }
  };

  const handleSaveDescription = async (newDescription: string) => {
    if (!business?.id) return;

    try {
      await updateBusinessDescription(business.id, newDescription);
      setBusiness({ ...business, description: newDescription });
      toast.success(t.descriptionUpdated);
    } catch (error) {
      console.error('Error updating description:', error);
      toast.error(t.descriptionUpdateError);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <LanguageSwitcher />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{t.businessNotFound}</h1>
          <p className="mt-2 text-muted-foreground">{t.businessNotFoundDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LanguageSwitcher />
      <AuthButton />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 pt-8">
        {/* Business Header */}
        <div className="text-center space-y-3">
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditDialogOpen(true)}
                  className="h-8 w-8"
                  title={t.editDescription}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
            {business.location && (
              <p className="mt-1 text-muted-foreground">{business.location}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQrDialogOpen(true)}
            className="gap-2"
          >
            <QrCode className="h-4 w-4" />
            {t.qrCodeButton}
          </Button>
        </div>

        {/* Star Rating */}
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-muted-foreground">{t.rateExperience}</p>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onClick={() => handleStarClick(i)}
                className="p-1 transition-transform active:scale-90"
              >
                <Star
                  className={`h-10 w-10 ${
                    i <= stars
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Review Draft */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{t.reviewDraft}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => generateReview(business, stars)}
              disabled={generating}
            >
              <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
              {t.regenerate}
            </Button>
          </div>
          <Textarea
            value={generating ? t.generatingReview : review}
            onChange={(e) => setReview(e.target.value)}
            disabled={generating}
            className="min-h-[120px] text-base"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={handleCopy}
            disabled={generating || !review}
            className="h-14 text-lg"
          >
            {copied ? (
              <>
                <Check className="h-5 w-5" /> {t.copied}
              </>
            ) : (
              <>
                <Copy className="h-5 w-5" /> {t.copyReview}
              </>
            )}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={handleOpenGoogle}
            className="h-14 text-lg"
          >
            <ExternalLink className="h-5 w-5" /> {t.openGoogleReviews}
          </Button>
        </div>

        {/* Tip */}
        <p className="text-center text-sm text-muted-foreground">
          {t.tip} <strong>Post</strong>
        </p>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground">
        {t.poweredBy} <strong>{t.appName}</strong>
      </footer>

      {/* QR Code Dialog */}
      <QRCodeDialog
        isOpen={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        business={business}
      />

      {/* Edit Business Dialog */}
      {business && (
        <EditBusinessDialog
          business={business}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleSaveDescription}
        />
      )}
    </div>
  );
};

export default ReviewPage;
