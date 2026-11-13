import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

export default function Home() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 3,
        }}
      >
        <Typography variant="h3" component="h1" color="primary" sx={{ fontWeight: 700 }}>
          Group Travel App
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Plan trips together. Split costs fairly. No awkward math.
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button href="/signup" variant="contained" size="large">
            Get started
          </Button>
          <Button href="/login" variant="outlined" size="large">
            Log in
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
