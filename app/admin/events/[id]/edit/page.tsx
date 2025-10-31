import { requireAdmin } from "@/lib/auth/server";
import { getEventById } from "@/lib/queries/events";
import { redirect } from "next/navigation";
import { adminPaths } from "@/lib/paths";
import { EditEventForm } from "@/components/admin/edit-event-form";

export const dynamic = "force-dynamic";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  await requireAdmin();

  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    redirect(adminPaths.root);
  }

  // Only allow editing draft and upcoming events
  if (event.status !== "draft" && event.status !== "upcoming") {
    redirect(adminPaths.events.byId(id));
  }

  return <EditEventForm event={event} />;
}
