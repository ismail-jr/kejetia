"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ServiceHeader } from "./components/service-header";
import { TagInput } from "./components/tag-input";
import { ImageUploader } from "./components/image-uploader";
import {
  serviceSchema,
  ServiceFormData,
  STORAGE_KEY,
} from "./components/constants";

export default function CreateServicePage() {
  const { user, profile } = useAuth();
  const router = useRouter();

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
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      tags: [],
      pricing_type: "fixed",
      price: undefined,
    },
  });

  const formValues = watch();

  // Restore cache logic on mount
  useEffect(() => {
    const savedDraft = sessionStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title) setValue("title", parsed.title);
        if (parsed.description) setValue("description", parsed.description);
        if (parsed.category) setValue("category", parsed.category);
        if (parsed.pricing_type) setValue("pricing_type", parsed.pricing_type);
        if (parsed.price) setValue("price", Number(parsed.price));
        if (parsed.tags && Array.isArray(parsed.tags)) {
          setTags(parsed.tags);
          setValue("tags", parsed.tags);
        }
      } catch (e) {
        console.error("Failed to parse form draft data", e);
      }
    }
  }, [setValue]);

  // Synchronize dynamic changes with memory cache
  useEffect(() => {
    const dataToSave = {
      title: formValues.title,
      description: formValues.description,
      category: formValues.category,
      pricing_type: formValues.pricing_type,
      price: formValues.price,
      tags: tags,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [
    formValues.title,
    formValues.description,
    formValues.category,
    formValues.pricing_type,
    formValues.price,
    tags,
  ]);

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

  const onSubmit = async (data: ServiceFormData) => {
    if (!user || !profile) {
      toast.error("Please login to create a service");
      return;
    }
    if (profile.active_role !== "provider") {
      toast.error("Only providers can create services");
      return;
    }
    if (images.length === 0) {
      toast.error("Please upload at least one image for your service");
      return;
    }

    setLoading(true);
    try {
      const { data: serviceData, error: serviceError } = await supabase
        .from("services")
        .insert({
          provider_id: user.id,
          title: data.title,
          description: data.description,
          category: data.category,
          pricing_type: data.pricing_type,
          price: data.price,
          tags: tags,
          status: "pending",
          images: [],
        })
        .select()
        .single();

      if (serviceError) throw serviceError;

      const imageUrls = await uploadImagesToStorage(serviceData.id);

      const { error: updateError } = await supabase
        .from("services")
        .update({ images: imageUrls })
        .eq("id", serviceData.id);

      if (updateError) throw updateError;

      sessionStorage.removeItem(STORAGE_KEY);
      toast.success("Service submitted for approval!");
      router.push("/provider/services");
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast.error(error.message || "Failed to create service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ServiceHeader />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card className="rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" />
            Basic Information
          </h2>

          {/* Title */}
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

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category / Industry Focus{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="category"
              placeholder="e.g., Graphic Design, Academic Tutoring, Laundry, Web Development"
              className="h-11 rounded-xl"
              {...register("category")}
            />
            {errors.category && (
              <p className="text-destructive text-xs">
                {errors.category.message}
              </p>
            )}
          </div>

          {/* Pricing Grid Layout */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricing_type" className="text-sm font-medium">
                Pricing Rate Model <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formValues.pricing_type || "fixed"}
                onValueChange={(v) => setValue("pricing_type", v as any)}
              >
                <SelectTrigger id="pricing_type" className="h-11 rounded-xl">
                  <SelectValue placeholder="Select price model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                  <SelectItem value="negotiable">
                    Starting From / Negotiable
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.pricing_type && (
                <p className="text-destructive text-xs">
                  {errors.pricing_type.message}
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

          {/* Description */}
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

          {/* Core Tags Component */}
          <TagInput tags={tags} setTags={setTags} setValue={setValue} />
        </Card>

        {/* Images Section */}
        <ImageUploader
          images={images}
          setImages={setImages}
          imagePreviews={imagePreviews}
          setImagePreviews={setImagePreviews}
          uploading={uploading}
          setUploading={setUploading}
        />

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
                Submitting Listing...
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
