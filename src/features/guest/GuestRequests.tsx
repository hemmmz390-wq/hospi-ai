import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, History } from "lucide-react";
import { useI18n } from "../../i18n";
import { Button, Card, EmptyState, Segmented } from "../../components/ui";
import { useGuestTickets } from "./guestUtils";
import { RequestCard, RequestDetailSheet } from "./components";

export function GuestRequests() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { active, history } = useGuestTickets();
  const [tab, setTab] = useState<"active" | "history">("active");
  const [detail, setDetail] = useState<string | null>(null);
  const list = tab === "active" ? active : history;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{t("g.req.title")}</h1>
        <Segmented
          label={t("g.req.title")}
          value={tab}
          onChange={setTab}
          size="sm"
          options={[
            { value: "active", label: t("g.req.active"), count: active.length },
            { value: "history", label: t("g.req.history"), count: history.length },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <Card>
          {tab === "active" ? (
            <EmptyState
              icon={<ClipboardList className="h-5 w-5" />}
              title={t("g.empty.activeTitle")}
              body={t("g.empty.activeBody")}
              action={
                <Button variant="secondary" size="sm" onClick={() => navigate("/guest/chat")}>
                  {t("g.req.ask")}
                </Button>
              }
            />
          ) : (
            <EmptyState icon={<History className="h-5 w-5" />} title={t("g.empty.historyTitle")} body={t("g.empty.historyBody")} />
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((x) => (
            <RequestCard key={x.id} ticket={x} onOpen={() => setDetail(x.id)} />
          ))}
        </div>
      )}

      <RequestDetailSheet ticketId={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
