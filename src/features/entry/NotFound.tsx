import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n";
import { BrandMark } from "../../components/common/Shared";
import { buttonClasses } from "../../components/ui";

export function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center">
      <BrandMark withName={false} size={36} />
      <h1 className="mt-6 text-xl font-semibold">{t("nf.title")}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">{t("nf.body")}</p>
      <Link to="/" className={buttonClasses("primary", "md", false, "mt-6")}>
        {t("nf.home")}
      </Link>
    </div>
  );
}
