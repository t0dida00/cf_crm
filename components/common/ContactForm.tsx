"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

export function ContactForm({
  buttonClassName,
  buttonStyle,
  stacked = false,
}: {
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  /** Name and Email each take their own full-width row instead of sitting
   * side by side — for narrow contexts like the login card. */
  stacked?: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || t("marketing.contactForm.failed"));
      }
      toast.success(t("marketing.contactForm.sent"));
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("marketing.contactForm.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={cn("grid grid-cols-1 gap-4", !stacked && "sm:grid-cols-2")}>
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">{t("marketing.contactForm.name")}</Label>
          <Input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("marketing.contactForm.namePlaceholder")}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">{t("marketing.contactForm.email")}</Label>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">{t("marketing.contactForm.message")}</Label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("marketing.contactForm.messagePlaceholder")}
          rows={5}
          required
        />
      </div>
      <Button
        type="submit"
        disabled={submitting}
        className={buttonClassName ?? (stacked ? "w-full" : "w-full sm:w-auto")}
        style={buttonStyle}
      >
        {submitting ? t("marketing.contactForm.sending") : (
          <>
            {t("marketing.contactForm.send")}
            <PaperPlaneTilt size={16} weight="bold" />
          </>
        )}
      </Button>
    </form>
  );
}
