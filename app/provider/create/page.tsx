"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Plus,
  X,
  ArrowLeft,
  Info,
  ImageIcon,
  Upload,
  Trash2,
  Star,
  Loader2,
  BookOpen,
  Palette,
  Code2,
  Camera,
  PenTool,
  Music,
  Dumbbell,
  Utensils,
  MoreHorizontal,
} from "lucide-react";

const CATEGORIES = [
  { value: "tutoring", label: "Tutoring", icon: BookOpen },
  { value: "design", label: "Design", icon: Palette },
  { value: "programming", label: "Programming", icon: Code2 },
  { value: "photography", label: "Photography", icon: Camera },
  { value: "writing", label: "Writing", icon: PenTool },
  { value: "music", label: "Music", icon: Music },
  { value: "fitness", label: "Fitness", icon: Dumbbell },
  { value: "cooking", label: "Cooking", icon: Utensils },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

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

export default function CreateServicePage() {
  const { profile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`You can only upload up to ${MAX_IMAGES} images`);
      return;
    }

    // Validate files
    const validFiles = files.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a valid image type`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      // Create preview URLs
      const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews([...imagePreviews, ...newPreviews]);
      setImages([...images, ...validFiles]);

      toast.success(`${validFiles.length} image(s) added`);
    } catch (error) {
      toast.error("Failed to process images");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviews[index]);

    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newImages = images.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);
    setImages(newImages);
    toast.success("Image removed");
  };

  const uploadImagesToStorage = async (
    serviceId: string,
  ): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${serviceId}/${Date.now()}-${i}.${fileExt}`;
      const filePath = `services/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("services")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("services")
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    return uploadedUrls;
  };

  const onSubmit = async (data: FormData) => {
    if (!profile) {
      toast.error("Please login to create a service");
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least one image for your service");
      return;
    }

    setLoading(true);

    try {
      // First create the service record
      const { data: serviceData, error: serviceError } = await supabase
        .from("services")
        .insert({
          provider_id: profile.id,
          title: data.title,
          description: data.description,
          category: data.category,
          price: data.price,
          tags: tags,
          status: "pending",
        })
        .select()
        .single();

      if (serviceError) throw serviceError;

      // Upload images to storage
      const imageUrls = await uploadImagesToStorage(serviceData.id);

      // Update service with image URLs (first image as cover)
      const { error: updateError } = await supabase
        .from("services")
        .update({
          images: imageUrls,
        })
        .eq("id", serviceData.id);

      if (updateError) throw updateError;

      toast.success("Service submitted for approval!");
      router.push("/provider/services");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to create service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-xl hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Service</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submit a new service listing for review
          </p>
        </div>
      </div>

      {/* Info Box */}
      <Card className="rounded-2xl p-4 bg-primary/5 border-primary/20">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-primary/80">
            After submitting, your service will be reviewed by an admin within
            24 hours before it becomes visible to students.
          </p>
        </div>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card className="rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            Basic Information
          </h2>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Service Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Expert Mathematics Tutoring for Level 100-300"
              className="h-11 rounded-xl"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-destructive text-xs">{errors.title.message}</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem
                        key={cat.value}
                        value={cat.value}
                        className="capitalize"
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{cat.label}</span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-destructive text-xs">
                  {errors.category.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium">
                Price (GH₵) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                placeholder="e.g., 50"
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
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
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
            <Label className="text-sm font-medium">Tags (optional)</Label>
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
        </Card>

        {/* Images Section */}
        <Card className="rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            Service Images
          </h2>
          <p className="text-sm text-muted-foreground">
            Upload up to {MAX_IMAGES} images. The first image will be used as
            the cover photo.
          </p>

          {/* Image Upload Area */}
          <div
            className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading || images.length >= MAX_IMAGES}
            />
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Click or drag images here to upload
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, WEBP up to 5MB
            </p>
            <p className="text-xs text-primary mt-2">
              {images.length}/{MAX_IMAGES} images uploaded
            </p>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {index === 0 && (
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-medium bg-primary text-white px-2 py-0.5 rounded-full">
                          Cover
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-11 rounded-xl"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg transition-all"
            disabled={loading || uploading || images.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit for Review"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
