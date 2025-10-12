"use client";

import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CATEGORY_LABELS,
  type Category,
  PRIORITY_LABELS,
  type Priority,
} from "@/types/article";

interface FilterBarProps {
  selectedCategories: Category[];
  selectedPriorities: Priority[];
  searchQuery: string;
  onCategoryChange: (categories: Category[]) => void;
  onPriorityChange: (priorities: Priority[]) => void;
  onSearchChange: (query: string) => void;
}

export function FilterBar({
  selectedCategories,
  selectedPriorities,
  searchQuery,
  onCategoryChange,
  onPriorityChange,
  onSearchChange,
}: FilterBarProps) {
  const toggleCategory = (category: Category) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const togglePriority = (priority: Priority) => {
    if (selectedPriorities.includes(priority)) {
      onPriorityChange(selectedPriorities.filter((p) => p !== priority));
    } else {
      onPriorityChange([...selectedPriorities, priority]);
    }
  };

  const clearSearch = () => {
    onSearchChange("");
  };

  const clearAllFilters = () => {
    onCategoryChange([]);
    onPriorityChange([]);
    onSearchChange("");
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedPriorities.length > 0 ||
    searchQuery;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="h-4 w-4" aria-hidden="true" />
            フィルター
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 text-xs"
              aria-label="すべてのフィルターをクリア"
            >
              <X className="h-3 w-3 mr-1" aria-hidden="true" />
              クリア
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 検索 */}
        <div role="search">
          <label htmlFor="search-input" className="sr-only">
            キーワードで検索
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              id="search-input"
              type="search"
              placeholder="キーワードで検索..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10"
              aria-describedby="search-description"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 min-h-[44px] min-w-[44px]"
                aria-label="検索をクリア"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
          <span id="search-description" className="sr-only">
            タイトル、要約、タグから記事を検索します
          </span>
        </div>

        {/* カテゴリフィルター */}
        <div>
          <h3
            id="category-filter-label"
            className="text-sm font-medium mb-2 text-foreground"
          >
            カテゴリ
          </h3>
          <div
            role="group"
            aria-labelledby="category-filter-label"
            className="flex flex-wrap gap-2"
          >
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((category) => {
              const isSelected = selectedCategories.includes(category);
              return (
                <Button
                  key={category}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCategory(category)}
                  className="min-h-[44px]"
                  aria-pressed={isSelected}
                  aria-label={`カテゴリ: ${CATEGORY_LABELS[category]}${isSelected ? " (選択中)" : ""}`}
                >
                  {CATEGORY_LABELS[category]}
                </Button>
              );
            })}
          </div>
        </div>

        {/* 優先度フィルター */}
        <div>
          <h3
            id="priority-filter-label"
            className="text-sm font-medium mb-2 text-foreground"
          >
            優先度
          </h3>
          <div
            role="group"
            aria-labelledby="priority-filter-label"
            className="flex flex-wrap gap-2"
          >
            {(Object.keys(PRIORITY_LABELS) as Priority[]).map((priority) => {
              const isSelected = selectedPriorities.includes(priority);
              return (
                <Button
                  key={priority}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePriority(priority)}
                  className="min-h-[44px]"
                  aria-pressed={isSelected}
                  aria-label={`優先度: ${PRIORITY_LABELS[priority]}${isSelected ? " (選択中)" : ""}`}
                >
                  {PRIORITY_LABELS[priority]}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
