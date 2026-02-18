import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Star, Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ReviewPage = () => {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [business, setBusiness] = useState<any>(null);
  const [stars, setStars] = useState(5);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", businessSlug)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }
      setBusiness(data);
      setLoading(false);
      generateReview(data, 5);
    };
    fetchBusiness();
  }, [businessSlug]);

  const generateReview = async (biz: any, starCount: number) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-review", {
        body: {
          businessName: biz.name,
          location: biz.location || "",
          stars: starCount,
        },
      });
      if (error) throw error;
      setReview(data.review);
    } catch {
      toast.error("Failed to generate review. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleStarClick = (rating: number) => {
    setStars(rating);
    if (business) generateReview(business, rating);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(review);
    setCopied(true);
    toast.success("Review copied!");
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
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Business not found</h1>
          <p className="mt-2 text-muted-foreground">This review link doesn't seem to be valid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 pt-8">
        {/* Business Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">📍 {business.name}</h1>
          {business.location && (
            <p className="mt-1 text-muted-foreground">{business.location}</p>
          )}
        </div>

        {/* Star Rating */}
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-muted-foreground">Rate your experience:</p>
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
            <p className="text-sm font-medium text-muted-foreground">Your Review Draft:</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => generateReview(business, stars)}
              disabled={generating}
            >
              <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          </div>
          <Textarea
            value={generating ? "Generating your review..." : review}
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
                <Check className="h-5 w-5" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-5 w-5" /> Copy Review
              </>
            )}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={handleOpenGoogle}
            className="h-14 text-lg"
          >
            <ExternalLink className="h-5 w-5" /> Open Google Reviews
          </Button>
        </div>

        {/* Tip */}
        <p className="text-center text-sm text-muted-foreground">
          💡 Tip: Paste your review in Google, then tap <strong>Post</strong>
        </p>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground">
        Powered by <strong>ReviewPasta</strong> 🍝
      </footer>
    </div>
  );
};

export default ReviewPage;
