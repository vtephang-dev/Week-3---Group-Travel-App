"use client";

import { createTheme } from "@mui/material/styles";

// The Group Travel App theme. Change these colors anytime to rebrand the app.
const theme = createTheme({
  palette: {
    primary: { main: "#1565c0" }, // travel blue
    secondary: { main: "#ff8f00" }, // warm amber
  },
  shape: { borderRadius: 10 },
});

export default theme;
