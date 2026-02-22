import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AuthButton } from "@/components/AuthButton";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const WaitlistSignup = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessUrl, setBusinessUrl] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email.trim() || !phoneNumber.trim() || !name.trim() || !businessName.trim() || !businessDescription.trim() || !businessUrl.trim()) {
      toast.error(t.errorRequired);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Basic phone number validation (allows various formats)
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    if (!phoneRegex.test(phoneNumber) || phoneNumber.length < 8) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert({
          email: email.trim().toLowerCase(),
          phone_number: phoneNumber.trim(),
          name: name.trim(),
          business_name: businessName.trim(),
          business_description: businessDescription.trim(),
          business_url: businessUrl.trim(),
          message: message.trim() || null,
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error(t.alreadyOnWaitlist);
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
        toast.success(t.waitlistSuccess);
      }
    } catch (error) {
      console.error('Waitlist submission error:', error);
      toast.error(t.waitlistError);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <LanguageSwitcher />
        <AuthButton />
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t.waitlistSuccessTitle}</h2>
            <p className="text-muted-foreground mb-6">{t.waitlistSuccessMessage}</p>
            <Link to="/">
              <Button>{t.backToHome}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LanguageSwitcher />
      <AuthButton />
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </Link>
          <CardTitle>{t.joinWaitlist}</CardTitle>
          <CardDescription>{t.joinWaitlistDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">{t.phoneNumber}</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t.phoneNumberPlaceholder}
                required
              />
            </div>
            <div>
              <Label htmlFor="name">{t.yourName}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                required
              />
            </div>
            <div>
              <Label htmlFor="businessName">{t.businessName}</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={t.businessNamePlaceholder}
                required
              />
            </div>
            <div>
              <Label htmlFor="businessUrl">{t.businessUrl}</Label>
              <Input
                id="businessUrl"
                type="url"
                value={businessUrl}
                onChange={(e) => setBusinessUrl(e.target.value)}
                placeholder={t.businessUrlPlaceholder}
                required
              />
            </div>
            <div>
              <Label htmlFor="businessDescription">{t.businessDescription}</Label>
              <Textarea
                id="businessDescription"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder={t.businessDescriptionPlaceholder}
                rows={3}
                required
              />
            </div>
            <div>
              <Label htmlFor="message">{t.additionalMessage}</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.messagePlaceholder}
                rows={2}
              />
            </div>
            <Button type="submit" disabled={submitting} className="mt-2">
              {submitting ? t.submitting : t.submitWaitlist}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaitlistSignup;
