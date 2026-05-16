import { Shield, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t-2 border-border py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold">Pokémon Shield Guide</span>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            دليل غير رسمي للعبة. Pokémon هي علامة تجارية مسجلة لشركة Nintendo.
          </p>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>صُنع بـ</span>
            <Heart className="w-4 h-4 text-destructive fill-current" />
            <span>لمحبي البوكيمون</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
