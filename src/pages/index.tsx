import React from "react";
import { Container, Typography, Button, TextField } from "@mui/material";
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [contracted, setContracted] = useState(0);

  const handleLogin = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      if (data.role === "ADMIN") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/client";
      }
    } else {
      alert(data.error || "Erro ao logar");
    }
  };

  const handleSignup = async () => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        contractedHours: Number(contracted),
      }),
    });
    if (res.ok) {
      alert("Usuário criado! Faça login");
      setIsSignup(false);
      setName("");
      setEmail("");
      setPassword("");
      setContracted(0);
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao cadastrar");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard ONGOING
      </Typography>
      {isSignup ? (
        <>
          <TextField
            label="Nome"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Senha"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            label="Horas contratadas por mês"
            type="number"
            fullWidth
            margin="normal"
            value={contracted}
            onChange={(e) => setContracted(Number(e.target.value))}
          />
          <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleSignup}>
            Registrar
          </Button>
          <Button fullWidth sx={{ mt: 1 }} onClick={() => setIsSignup(false)}>
            Voltar ao login
          </Button>
        </>
      ) : (
        <>
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Senha"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleLogin}>
            Entrar
          </Button>
          <Button fullWidth sx={{ mt: 1 }} onClick={() => setIsSignup(true)}>
            Criar nova conta
          </Button>
        </>
      )}
    </Container>
  );
}
