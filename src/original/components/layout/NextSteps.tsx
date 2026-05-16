import { ReactNode } from "react";
import { cn } from "@/original/lib/utils";
import { Card, CardContent } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Icon } from "@/original/components/ui/Icon";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { LucideIcon } from "lucide-react";
import { SPACING } from "@/original/styles/design-tokens";

interface NextStepAction {
  /** Action label */
  label: string;
  /** Icon for the action */
  icon?: LucideIcon;
  /** Click handler or navigation path */
  onClick?: () => void;
  /** Is this the primary action? */
  primary?: boolean;
}

interface NextStepsProps {
  /** Title (defaults to "What's Next?") */
  title?: string;
  /** List of suggested actions (2-4 recommended) */
  actions: NextStepAction[];
  /** Additional classes */
  className?: string;
}

/**
 * NextSteps - Guide users to logical next actions
 *
 * Place at the bottom of detail pages to:
 * - Prevent dead ends
 * - Guide exploration
 * - Suggest related content
 */
export function NextSteps({ title, actions, className }: NextStepsProps) {
  const { language } = useLanguage();
  const defaultTitle = language === "ar" ? "الخطوات التالية" : "What's Next?";
  const isRTL = language === "ar";

  if (actions.length === 0) return null;

  return (
    <Card className={cn("bg-muted/30", className)}>
      <CardContent className="p-4">
        <div className={SPACING.element}>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
            <Icon icon={ArrowRight} size="content" className={cn(isRTL && "rotate-180")} />
            {title || defaultTitle}
          </div>

          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.primary ? "default" : "outline"}
                size="sm"
                onClick={action.onClick}
                className="gap-2"
              >
                {action.icon && <Icon icon={action.icon} size="inline" />}
                {action.label}
                <ChevronRight className={cn("w-3 h-3", isRTL && "rotate-180")} />
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
