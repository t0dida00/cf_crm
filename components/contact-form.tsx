"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
        throw new Error(body?.error || "Failed to send message.");
      }
      toast.success("Message sent — thanks for reaching out!");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={cn("grid grid-cols-1 gap-4", !stacked && "sm:grid-cols-2")}>
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">Email</Label>
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
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What would you like to say?"
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
        {submitting ? "Sending…" : (
          <>
            Send message
            <PaperPlaneTilt size={16} weight="bold" />
          </>
        )}
      </Button>
    </form>
  );
}
