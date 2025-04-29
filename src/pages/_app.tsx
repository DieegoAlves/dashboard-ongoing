import React from "react";
import type { AppProps } from "next/app";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import Head from "next/head";

// Tema inspirado em disco-voador: base branca, detalhes roxo & verde-claro 🛸
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#8e24aa", // Roxo vibrante (detalhes principais)
      light: "#c158dc",
      dark: "#5c007a",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#00e676", // Verde neon suave (detalhes adicionais)
      light: "#66ffa6",
      dark: "#00b248",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f5f7fb", // Quase branco
      paper: "#ffffff",
    },
    error: {
      main: "#e53935",
    },
    warning: {
      main: "#fb8c00",
    },
    info: {
      main: "#1e88e5",
    },
    success: {
      main: "#43a047",
    },
    text: {
      primary: "#212121",
      secondary: "#555555",
    },
  },
  typography: {
    fontFamily: "'Exo 2', sans-serif",
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <title>ONGOING Space Dashboard</title>
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}
