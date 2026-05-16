import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Button } from "@/original/components/ui/button";
import { Badge } from "@/original/components/ui/badge";
import { Heart, Check, ShoppingBag } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { toast } from "sonner";

interface ItemWishlistProps {
  itemId: number;
  itemName: string;
}

// Wishlist storage functions
function getWishlist(): number[] {
  try {
    const stored = localStorage.getItem("pokemonApp_itemWishlist");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveWishlist(wishlist: number[]): void {
  localStorage.setItem("pokemonApp_itemWishlist", JSON.stringify(wishlist));
}

function getOwnedItems(): number[] {
  try {
    const stored = localStorage.getItem("pokemonApp_ownedItems");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveOwnedItems(owned: number[]): void {
  localStorage.setItem("pokemonApp_ownedItems", JSON.stringify(owned));
}

export function ItemWishlist({ itemId, itemName }: ItemWishlistProps) {
  const { language } = useLanguage();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isOwned, setIsOwned] = useState(false);

  useEffect(() => {
    setIsInWishlist(getWishlist().includes(itemId));
    setIsOwned(getOwnedItems().includes(itemId));
  }, [itemId]);

  const toggleWishlist = useCallback(() => {
    const wishlist = getWishlist();
    const newWishlist = isInWishlist
      ? wishlist.filter((id) => id !== itemId)
      : [...wishlist, itemId];

    saveWishlist(newWishlist);
    setIsInWishlist(!isInWishlist);

    toast.success(
      !isInWishlist
        ? language === "ar"
          ? "أُضيف إلى قائمة الأمنيات"
          : "Added to wishlist"
        : language === "ar"
          ? "أُزيل من قائمة الأمنيات"
          : "Removed from wishlist",
    );
  }, [itemId, isInWishlist, language]);

  const toggleOwned = useCallback(() => {
    const owned = getOwnedItems();
    const newOwned = isOwned ? owned.filter((id) => id !== itemId) : [...owned, itemId];

    saveOwnedItems(newOwned);
    setIsOwned(!isOwned);

    // Remove from wishlist if marking as owned
    if (!isOwned && isInWishlist) {
      const wishlist = getWishlist();
      saveWishlist(wishlist.filter((id) => id !== itemId));
      setIsInWishlist(false);
    }

    toast.success(
      !isOwned
        ? language === "ar"
          ? "تم وضع علامة كمملوك"
          : "Marked as owned"
        : language === "ar"
          ? "أُزيل من المملوكات"
          : "Removed from owned",
    );
  }, [itemId, isOwned, isInWishlist, language]);

  return (
    <div className="flex items-center gap-2">
      {/* Wishlist Button */}
      <Button
        variant={isInWishlist ? "default" : "outline"}
        size="sm"
        onClick={toggleWishlist}
        className={cn(
          "gap-1.5",
          isInWishlist && "bg-pink-500/20 text-pink-400 border-pink-500/30 hover:bg-pink-500/30",
        )}
      >
        <Heart className={cn("w-4 h-4", isInWishlist && "fill-current")} />
        {language === "ar"
          ? isInWishlist
            ? "في الأمنيات"
            : "أضف للأمنيات"
          : isInWishlist
            ? "In Wishlist"
            : "Add to Wishlist"}
      </Button>

      {/* Owned Button */}
      <Button
        variant={isOwned ? "default" : "outline"}
        size="sm"
        onClick={toggleOwned}
        className={cn(
          "gap-1.5",
          isOwned && "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30",
        )}
      >
        {isOwned ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
        {language === "ar" ? (isOwned ? "مملوك" : "لدي هذا") : isOwned ? "Owned" : "I Have This"}
      </Button>

      {/* Status Badges */}
      {(isInWishlist || isOwned) && (
        <div className="flex gap-1">
          {isOwned && (
            <Badge
              variant="outline"
              className="bg-green-500/10 text-green-400 border-green-500/30 text-xs"
            >
              <Check className="w-3 h-3 me-1" />
              {language === "ar" ? "مملوك" : "Owned"}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Hook to get wishlist count
export function useItemWishlistCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getWishlist().length);

    const handleStorage = () => {
      setCount(getWishlist().length);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return count;
}

// Hook to get owned count
export function useOwnedItemsCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getOwnedItems().length);

    const handleStorage = () => {
      setCount(getOwnedItems().length);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return count;
}
