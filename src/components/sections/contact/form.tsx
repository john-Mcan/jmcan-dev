"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FormStatus = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const t = useTranslations("contact.form");
  const tContact = useTranslations("contact");
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to send");

      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus("error");
    }
  };

  const inputBaseStyles = cn(
    "w-full px-4 py-3 rounded-xl border border-border bg-card",
    "text-foreground placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent",
    "transition-all duration-200",
    "text-sm sm:text-base"
  );

  return (
    <Section containerSize="sm">
      <div className="max-w-xl mx-auto">
        <p className="text-sm sm:text-base text-muted text-center mb-6 sm:mb-8">
          {tContact("description")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              {t("name")}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className={inputBaseStyles}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              {t("email")}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className={inputBaseStyles}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium">
              {t("message")}
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              className={cn(inputBaseStyles, "resize-none")}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={status === "loading" || status === "success"}
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("sending")}</span>
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>{t("success")}</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>{t("submit")}</span>
              </>
            )}
          </Button>

          {status === "error" && (
            <div className="flex items-center justify-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{t("error")}</span>
            </div>
          )}
        </form>
      </div>
    </Section>
  );
}

