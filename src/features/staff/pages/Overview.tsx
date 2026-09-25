import React from "react";
import { useApp } from "../../../context/AppContext";
import { FrontOfficeOverview } from "./FrontOfficeOverview";
import { DutyManagerOverview } from "./DutyManagerOverview";
import { TaskBoard } from "./TaskBoard";
import { KitchenBoard } from "./KitchenBoard";

export function Overview() {
  const { role } = useApp();
  if (role === "front_office") return <FrontOfficeOverview />;
  if (role === "duty_manager") return <DutyManagerOverview />;
  if (role === "food_beverage") return <KitchenBoard />;
  if (role === "maintenance") return <TaskBoard kind="maintenance" />;
  return <TaskBoard kind="housekeeping" />;
}
