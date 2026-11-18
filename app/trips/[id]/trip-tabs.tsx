"use client";

import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

// Splits the trip's sections into tabbed screens instead of one long scroll.
// All panels stay mounted (just hidden) so a half-filled form isn't wiped when
// you switch tabs.
export default function TripTabs({
  tabs,
}: {
  tabs: { label: string; content: ReactNode }[];
}) {
  const [value, setValue] = useState(0);

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={(_, v) => setValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Trip sections"
        >
          {tabs.map((t, i) => (
            <Tab key={t.label} label={t.label} id={`trip-tab-${i}`} aria-controls={`trip-panel-${i}`} />
          ))}
        </Tabs>
      </Box>
      {tabs.map((t, i) => (
        <Box
          key={t.label}
          role="tabpanel"
          hidden={value !== i}
          id={`trip-panel-${i}`}
          aria-labelledby={`trip-tab-${i}`}
          sx={{ pt: 3 }}
        >
          {t.content}
        </Box>
      ))}
    </Box>
  );
}
