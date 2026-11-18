import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import theme from "./theme";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  // Per-route titles fill the "%s"; pages set their own title (see each page).
  title: {
    default: "Group Travel App",
    template: "%s · Group Travel App",
  },
  description: "Plan trips together and split costs fairly.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {/* Skip link: hidden until focused, so keyboard users can jump past nav. */}
            <Box
              component="a"
              href="#main-content"
              sx={{
                position: "absolute",
                left: "-9999px",
                top: 0,
                zIndex: 2000,
                p: 2,
                m: 1,
                borderRadius: 1,
                bgcolor: "background.paper",
                color: "primary.main",
                boxShadow: 3,
                "&:focus": { left: 0, top: 0 },
              }}
            >
              Skip to main content
            </Box>
            <Box component="main" id="main-content">
              {children}
            </Box>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
