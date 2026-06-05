"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X, ArrowLeft, Info, ImageIcon } from "lucide-react";

const CATEGORIES = [
  "tutoring",
  "design",
  "programming",
  "photography",
  "writing",
  "music",
  "fitness",
  "cooking",
  "other",
];

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000),
  category: z.string().min(1, "Select a category"),
  price: z.number().min(1, "Price must be at least GH₵1").max(10000),
  tags: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

const PEXELS_SUGGESTIONS: Record<string, string[]> = {
  tutoring: [
    "https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3401403/pexels-photo-3401403.jpeg?auto=compress&cs=tinysrgb&w=800",
  ],
  design: [
    "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/326514/pexels-photo-326514.jpeg?auto=compress&cs=tinysrgb&w=800",
  ],
  programming: [
    "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800",
  ],
  photography: [
    "https://images.pexels.com/photos/1787220/pexels-photo-1787220.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg?auto=compress&cs=tinysrgb&w=800",
  ],
  writing: [
    "https://images.pexels.com/photos/261763/pexels-photo-261763.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/4052294/pexels-photo-4052294.jpeg?auto=compress&cs=tinysrgb&w=800",
  ],
};

export default function CreateServicePage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const category = watch("category");

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 8) {
      const newTags = [...tags, t];
      setTags(newTags);
      setValue("tags", newTags);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    setValue("tags", newTags);
  };

  const addImage = () => {
    const url = imageUrl.trim();
    if (url && !images.includes(url) && images.length < 5) {
      setImages([...images, url]);
      setImageUrl("");
    }
  };

  const addSuggestedImage = (url: string) => {
    if (!images.includes(url) && images.length < 5) {
      setImages([...images, url]);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!profile) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("services").insert({
        provider_id: profile.id,
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        images,
        tags,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Service submitted for approval!");
      router.push("/provider/services");
    } catch {
      toast.error("Failed to create service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Service</h1>
          <p className="text-muted-foreground text-sm">
            Submit a new service listing for review
          </p>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-primary/80">
          After submitting, your service will be reviewed by an admin within 24
          hours before it becomes visible to students.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
          <h2 className="font-semibold text-foreground">Basic Information</h2>

          <div className="space-y-2">
            <Label>Service Title *</Label>
            <Input
              placeholder="e.g. Expert Mathematics Tutoring for Level 100-300"
              className="h-11 rounded-xl"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-destructive text-xs">{errors.title.message}</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-destructive text-xs">
                  {errors.category.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Price (GH₵) *</Label>
              <Input
                type="number"
                placeholder="e.g. 50"
                className="h-11 rounded-xl"
                min={1}
                {...register("price", { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-destructive text-xs">
                  {errors.price.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              placeholder="Describe what you offer, your experience, what's included, and anything else students should know..."
              className="rounded-xl resize-none min-h-32"
              rows={6}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-destructive text-xs">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="h-10 rounded-xl"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                className="h-10 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Service Images</h2>
          <p className="text-sm text-muted-foreground">
            Add up to 5 images for your service listing. You can use image URLs.
          </p>

          <div className="flex gap-2">
            <Input
              placeholder="Paste image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="h-10 rounded-xl"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addImage}
              className="h-10 rounded-xl"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggested images from Pexels */}
          {category && PEXELS_SUGGESTIONS[category] && images.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Suggested images for {category}:
              </p>
              <div className="flex gap-2">
                {PEXELS_SUGGESTIONS[category].map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => addSuggestedImage(url)}
                    className="w-20 h-16 rounded-xl overflow-hidden border border-border hover:border-primary transition-colors"
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                <span className="text-xs text-muted-foreground self-center ml-1">
                  Click to add
                </span>
              </div>
            </div>
          )}

          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="relative w-20 h-16 rounded-xl overflow-hidden border border-border"
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 rounded-xl shadow-primary"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit for Review"}
          </Button>
        </div>
      </form>
    </div>
  );
}
