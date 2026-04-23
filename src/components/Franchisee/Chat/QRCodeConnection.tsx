import { useEffect, useState, useCallback } from "react";
import {
  QrCode,
  RefreshCw,
  CheckCircle2,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ConnectionState, ConnectionProvider } from "./types";

interface QRCodeConnectionProps {
  qrCode: string | null;
  provider: ConnectionProvider;
  onRetry: () => void;
  onConnected: () => void;
  checkConnection: () => Promise<ConnectionState | null>;
}

const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_ATTEMPTS = 7; // 10 attempts = 20 seconds
const CONNECTED_DISPLAY_TIME = 3000; // 5000 miliseconds = 5 seconds

const QRCodeConnection = ({
  qrCode,
  provider,
  onRetry,
  onConnected,
  checkConnection,
}: QRCodeConnectionProps) => {
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<
    "waiting" | "checking" | "connected" | "timeout"
  >("waiting");
  const [currentQrCode, setCurrentQrCode] = useState(qrCode);

  const progress = (attempts / MAX_ATTEMPTS) * 100;
  const remainingSeconds = Math.max(0, (MAX_ATTEMPTS - attempts) * 2);

  const pollConnection = useCallback(async () => {
    if (status === "connected" || status === "timeout") return;

    setStatus("checking");

    try {
      const result = await checkConnection();

      if (result?.state?.open) {
        setStatus("connected");
        setTimeout(() => {
          onConnected();
        }, CONNECTED_DISPLAY_TIME);
        return;
      }

      if (result?.qrCode?.base64) {
        setCurrentQrCode(result.qrCode.base64);
      }

      setAttempts((prev) => {
        const next = prev + 1;
        if (next >= MAX_ATTEMPTS) {
          setStatus("timeout");
        } else {
          setStatus("waiting");
        }
        return next;
      });
    } catch (error) {
      console.error("Erro ao verificar conexão:", error);
      setAttempts((prev) => {
        const next = prev + 1;
        if (next >= MAX_ATTEMPTS) {
          setStatus("timeout");
        } else {
          setStatus("waiting");
        }
        return next;
      });
    }
  }, [checkConnection, onConnected, status]);

  useEffect(() => {
    if (status === "connected" || status === "timeout") return;

    const interval = setInterval(pollConnection, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [pollConnection, status]);

  const handleRetry = () => {
    setAttempts(0);
    setStatus("waiting");
    onRetry();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted/30 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md p-8 animate-fade-in">
        <div className="text-center">
          {/* Header */}
          <div className="mb-6">
            {status === "connected" ? (
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4 animate-scale-in">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
            )}

            <h2 className="text-xl font-bold text-foreground mb-1">
              {status === "connected"
                ? "Conectado com sucesso!"
                : "Escaneie o QR Code"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {status === "connected"
                ? "Seu WhatsApp foi vinculado"
                : `Abra o WhatsApp no celular e escaneie o código`}
            </p>
          </div>

          {/* QR Code */}
          {status !== "connected" && (
            <div className="relative mb-6">
              <div className="bg-white p-4 rounded-2xl inline-block shadow-lg">
                {currentQrCode ? (
                  <img
                    src={currentQrCode}
                    alt="QR Code WhatsApp"
                    className={`w-56 h-56 transition-opacity ${
                      status === "timeout" ? "opacity-30" : ""
                    }`}
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center bg-muted rounded-lg">
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                  </div>
                )}

                {status === "timeout" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-background/90 rounded-xl p-4 shadow-lg">
                      <WifiOff className="w-8 h-8 text-destructive mx-auto mb-2" />
                      <p className="text-sm font-medium">QR Code expirado</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status and Progress */}
          {status !== "connected" && status !== "timeout" && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-3 text-sm text-muted-foreground">
                {status === "checking" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando conexão...
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    Aguardando leitura... {remainingSeconds}s
                  </>
                )}
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Success Animation */}
          {status === "connected" && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 text-green-500">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">WhatsApp conectado!</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecionando para as conversas...
              </p>
            </div>
          )}

          {/* Retry Button */}
          {status === "timeout" && (
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Gerar novo QR Code
            </Button>
          )}

          {/* Provider info */}
          <p className="text-xs text-muted-foreground mt-4">
            Conectando via{" "}
            <span className="font-medium">
              {provider === "official" ? "API Oficial" : "Evolution API"}
            </span>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default QRCodeConnection;
