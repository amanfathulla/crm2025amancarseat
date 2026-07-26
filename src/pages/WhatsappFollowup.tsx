import { FolderOpen } from "lucide-react";
import MessageTemplatesCard from "@/components/whatsapp/MessageTemplatesCard";
import WhatsappSettingsCard from "@/components/whatsapp/WhatsappSettingsCard";
import LeadsCard from "@/components/whatsapp/LeadsCard";
import FollowupScheduleCard from "@/components/whatsapp/FollowupScheduleCard";

export default function WhatsappFollowup() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <FolderOpen className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">WhatsApp Followup</h1>
          <p className="text-sm text-muted-foreground">
            Folder automasi follow-up WhatsApp (ustazai.my)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MessageTemplatesCard />
        <WhatsappSettingsCard />
        <LeadsCard />
        <FollowupScheduleCard />
      </div>
    </div>
  );
}
