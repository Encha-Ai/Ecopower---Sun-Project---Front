import { MessageCircle } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-muted/30 dark:bg-slate-950/50">
      <div className="text-center">
        <div className="bg-green-500/10 dark:bg-green-900/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Selecione uma conversa
        </h3>
        <p className="text-muted-foreground max-w-md text-sm">
          Escolha uma conversa da lista para começar a enviar mensagens
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
