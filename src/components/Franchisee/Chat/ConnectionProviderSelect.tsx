import { useState } from "react";
import { Smartphone, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ConnectionProvider } from "./types";

interface ConnectionProviderSelectProps {
  onSelect: (provider: ConnectionProvider) => void;
  isLoading?: boolean;
}

const ConnectionProviderSelect = ({ onSelect, isLoading }: ConnectionProviderSelectProps) => {
  const [selected, setSelected] = useState<ConnectionProvider | null>(null);

  const providers = [
    {
      id: "official" as ConnectionProvider,
      name: "API Oficial",
      icon: Smartphone,
      description: "Meta Business Platform",
      features: ["Requer aprovação", "Suporte oficial", "Mais estável"],
      recommended: false,
    },
    {
      id: "evolution" as ConnectionProvider,
      name: "Evolution API",
      icon: Zap,
      description: "Conexão rápida e sem burocracia",
      features: ["Sem aprovação", "Setup instantâneo", "Recursos avançados"],
      recommended: true,
    },
  ];

  const handleContinue = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted/30 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Conecte seu WhatsApp
          </h2>
          <p className="text-muted-foreground">
            Escolha o provedor de integração para começar
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {providers.map((provider) => {
            const Icon = provider.icon;
            const isSelected = selected === provider.id;

            return (
              <Card
                key={provider.id}
                onClick={() => setSelected(provider.id)}
                className={`relative p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                  isSelected
                    ? "ring-2 ring-primary border-primary bg-primary/5"
                    : "hover:border-primary/50"
                }`}
              >
                {provider.recommended && (
                  <Badge className="absolute -top-2 right-4 bg-primary">
                    Recomendado
                  </Badge>
                )}

                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    } transition-colors`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{provider.name}</h3>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary animate-scale-in" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {provider.description}
                    </p>

                    <ul className="space-y-1">
                      {provider.features.map((feature, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground flex items-center gap-2"
                        >
                          <div className="w-1 h-1 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selected || isLoading}
            className="min-w-[200px] gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionProviderSelect;
