"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tag, X } from "lucide-react";

interface TagManagerProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  disabled?: boolean;
  maxTags?: number;
}

export function TagManager({
  tags,
  onAddTag,
  onRemoveTag,
  disabled = false,
  maxTags = 8,
}: TagManagerProps) {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < maxTags) {
      onAddTag(t);
      setTagInput("");
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-1.5">
        <Tag className="w-3.5 h-3.5 text-muted-foreground" />
        Search Tags (optional)
      </Label>
      <div className="flex gap-2">
        <Input
          placeholder={`Type a skill (e.g., 'calculus', 'figma') - Max ${maxTags} tags`}
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          className="rounded-xl h-11"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          onClick={addTag}
          className="rounded-xl h-11 px-4"
          disabled={disabled || tags.length >= maxTags}
        >
          Add
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Add descriptive identifiers to help students find your service. (Max{" "}
        {maxTags} tags)
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
                onClick={() => onRemoveTag(tag)}
                className="hover:text-destructive transition-colors"
                disabled={disabled}
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
