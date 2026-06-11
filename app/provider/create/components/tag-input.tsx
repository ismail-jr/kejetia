"use client";

import { useState } from "react";
import { UseFormSetValue } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, Plus, X } from "lucide-react";
import { ServiceFormData } from "./constants";

interface TagInputProps {
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  setValue: UseFormSetValue<ServiceFormData>;
}

export function TagInput({ tags, setTags, setValue }: TagInputProps) {
  const [tagInput, setTagInput] = useState("");

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

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-1.5">
        <Tag className="w-3.5 h-3.5 text-muted-foreground" />
        Search Tags (optional)
      </Label>
      <div className="flex gap-2">
        <Input
          placeholder="Type a specific skill (e.g., 'calculus', 'figma') and press Enter or click (+)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          className="h-11 rounded-xl"
        />
        <Button
          type="button"
          variant="outline"
          onClick={addTag}
          className="h-11 rounded-xl w-12 px-0 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground pl-1">
        Add descriptive identifiers to help students match your capabilities via
        portal searches. (Max 8 tags)
      </p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
