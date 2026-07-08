import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";

const PIN_KEY = "blooming-glitz-pin-ok";

export function useAdminUnlocked() {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(PIN_KEY) === "1") {
      setUnlocked(true);
    }
  }, []);
  return [unlocked, setUnlocked] as const;
}

export function AdminPinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("admin_pin")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const tryUnlock = () => {
    if (!settings) return;
    if (pin === settings.admin_pin) {
      sessionStorage.setItem(PIN_KEY, "1");
      onUnlock();
      toast.success("Welcome back babe 💗");
    } else {
      toast("That PIN's not right babe 🌸");
      setPin("");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-xs text-center">
        <BrandLogo size={64} className="justify-center" showWordmark={false} />
        <h1 className="font-heading text-2xl mt-4">Lerato's dashboard ✨</h1>
        <p className="text-text-soft text-sm mt-1">Enter your PIN babe</p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
          className="mt-6 w-full text-center text-3xl tracking-[0.5em] bg-white rounded-xl border border-border py-4 focus:outline-none focus:border-gold"
          placeholder="••••"
        />
        <button
          onClick={tryUnlock}
          disabled={pin.length !== 4}
          className="btn-pill mt-4 w-full flex bg-gold text-white hover:bg-gold-deep disabled:opacity-50"
        >
          Unlock 💗
        </button>
        <p className="text-[10px] text-text-soft mt-4">
          Default PIN is 1234 — change it in Settings
        </p>
      </div>
    </main>
  );
}
