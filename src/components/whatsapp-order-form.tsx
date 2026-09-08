import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { CustomerDetails } from "@/lib/whatsapp-order-message";

export const whatsappOrderFormSchema = z.object({
  customerName: z.string().min(2, "Please enter your full name"),
  customerPhone: z.string().min(7, "Please enter a valid phone number"),
  customerLocation: z.string().min(2, "Please enter your delivery location"),
  specialRequest: z.string().optional(),
});

export type WhatsAppOrderFormData = z.infer<typeof whatsappOrderFormSchema>;

const inputCls =
  "w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors";
const errorCls = "text-[11px] text-destructive mt-1";
const labelCls = "text-[10px] uppercase font-bold tracking-widest mb-2 block";

type WhatsAppOrderFormProps = {
  onSubmit: (data: CustomerDetails) => void;
  submitLabel?: string;
};

export function WhatsAppOrderForm({
  onSubmit,
  submitLabel = "Send Order via WhatsApp",
}: WhatsAppOrderFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WhatsAppOrderFormData>({ resolver: zodResolver(whatsappOrderFormSchema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border border-border bg-surface p-4 sm:p-5">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        Your details for this order
      </p>

      <div>
        <label className={labelCls}>Full Name *</label>
        <input {...register("customerName")} className={inputCls} placeholder="e.g. Abena Mensah" />
        {errors.customerName && <p className={errorCls}>{errors.customerName.message}</p>}
      </div>

      <div>
        <label className={labelCls}>Phone Number *</label>
        <input
          {...register("customerPhone")}
          className={inputCls}
          placeholder="e.g. 0244 123 456"
          type="tel"
        />
        {errors.customerPhone && <p className={errorCls}>{errors.customerPhone.message}</p>}
      </div>

      <div>
        <label className={labelCls}>Location *</label>
        <input
          {...register("customerLocation")}
          className={inputCls}
          placeholder="e.g. East Legon, Accra"
        />
        {errors.customerLocation && <p className={errorCls}>{errors.customerLocation.message}</p>}
      </div>

      <div>
        <label className={labelCls}>
          Special Request <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          {...register("specialRequest")}
          className={`${inputCls} resize-none`}
          rows={2}
          placeholder="Sizing note, colour preference, delivery note..."
        />
      </div>

      <button
        type="submit"
        className="w-full bg-[var(--whatsapp)] text-white py-3.5 flex items-center justify-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
      >
        <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
          <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.4-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.4.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.4 5L2 22l5.2-1.4c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
        </svg>
        {submitLabel}
      </button>
    </form>
  );
}
