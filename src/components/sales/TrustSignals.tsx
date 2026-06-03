import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, Droplets, Sparkles, Clock } from "lucide-react";

export const TrustSignals = () => {
  const { t } = useLanguage();

  const signals = [
    {
      icon: Shield,
      title: t.warranty,
      description: "Jaminan kualiti dan kepuasan pelanggan",
      descriptionEn: "Quality and satisfaction guarantee"
    },
    {
      icon: Droplets,
      title: t.waterproof,
      description: "Material premium kalis air 100%",
      descriptionEn: "100% waterproof premium material"
    },
    {
      icon: Sparkles,
      title: t.scratchResistant,
      description: "Tahan calar dan mudah dibersihkan",
      descriptionEn: "Scratch-resistant and easy to clean"
    },
    {
      icon: Clock,
      title: t.easyInstall,
      description: "Pemasangan mudah tanpa ubahsuai",
      descriptionEn: "Easy installation without modification"
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto">
          {signals.map((signal, index) => {
            const Icon = signal.icon;
            return (
              <div
                key={index}
                className="group text-center p-6 md:p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-sm md:text-base mb-2">
                  {signal.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {signal.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
