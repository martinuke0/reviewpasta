import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const AddBusiness = () => {
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
      toast.error("Business name and Place ID are required.");
      return;
    }

    setSaving(true);
    const slug = generateSlug(name);

    const { error } = await supabase.from("businesses").insert({
      name: name.trim(),
      slug,
      place_id: placeId.trim(),
      location: location.trim() || null,
      description: description.trim() || null,
    });

    if (error) {
      toast.error(error.message.includes("unique") ? "A business with that name already exists." : "Failed to save business.");
      setSaving(false);
      return;
    }

    toast.success("Business added!");
    navigate(`/review/${slug}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <CardTitle>Add a New Business</CardTitle>
          <CardDescription>Register a business to start collecting reviews.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="name">Business Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nordic Brew Coffee" />
            </div>
            <div>
              <Label htmlFor="placeId">Google Place ID *</Label>
              <Input id="placeId" value={placeId} onChange={(e) => setPlaceId(e.target.value)} placeholder="ChIJ..." />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Göteborg, Sweden" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A cozy coffee shop..." />
            </div>
            <Button type="submit" disabled={saving} className="mt-2">
              {saving ? "Saving..." : "Save Business"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddBusiness;
