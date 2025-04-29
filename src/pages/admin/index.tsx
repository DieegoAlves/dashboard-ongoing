import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Box,
  Avatar,
  Chip,
  IconButton,
  useTheme,
  alpha,
  tableCellClasses,
  styled,
} from "@mui/material";
import { useAuth } from "../../lib/useAuth";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";

interface User {
  id: string;
  name: string;
  email: string;
  contractedHours: number;
  role: string;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    transition: 'background-color 0.2s ease',
  },
}));

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const theme = useTheme();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    contractedHours: 0,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    contractedHours: 0,
  });

  useAuth("ADMIN");

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });
    setOpen(false);
    setForm({ name: "", email: "", password: "", contractedHours: 0 });
    fetchUsers();
  };

  const handleOpenEdit = (user: User) => {
    setCurrentUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      password: "",
      contractedHours: user.contractedHours,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!currentUser) return;
    await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: currentUser.id,
        update: {
          name: editForm.name,
          email: editForm.email,
          contractedHours: editForm.contractedHours,
          ...(editForm.password ? { password: editForm.password } : {}),
        },
      }),
    });
    setEditOpen(false);
    setCurrentUser(null);
    fetchUsers();
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Excluir usuário permanentemente?")) return;
    await fetch(`/api/users?userId=${id}`, { method: "DELETE" });
    fetchUsers();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, background: alpha(theme.palette.background.paper, 0.8) }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
              Painel de Administração
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Gerenciamento de usuários e horas
            </Typography>
          </Box>
          <Box>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
              sx={{ 
                borderRadius: 2,
                px: 3,
                py: 1.2,
                boxShadow: 3,
                fontWeight: 'bold',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  transition: 'transform 0.2s ease',
                }
              }}
            >
              Novo Usuário
            </Button>
            <Button 
              variant="outlined" 
              sx={{ 
                ml: 2,
                borderRadius: 2,
                px: 3,
                py: 1.2,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  transition: 'transform 0.2s ease',
                }
              }} 
              href="/admin/tasks"
            >
              Tarefas
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <StyledTableCell>Usuário</StyledTableCell>
              <StyledTableCell>Email</StyledTableCell>
              <StyledTableCell>Horas/mês</StyledTableCell>
              <StyledTableCell>Função</StyledTableCell>
              <StyledTableCell>Ações</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <StyledTableRow key={user.id}>
                <StyledTableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar 
                      sx={{ 
                        bgcolor: user.role === 'ADMIN' 
                          ? theme.palette.error.main 
                          : theme.palette.primary.main,
                        mr: 2 
                      }}
                    >
                      <PersonIcon />
                    </Avatar>
                    {user.name}
                  </Box>
                </StyledTableCell>
                <StyledTableCell>{user.email}</StyledTableCell>
                <StyledTableCell>
                  <Chip 
                    label={`${user.contractedHours}h`}
                    size="small"
                    sx={{ 
                      fontWeight: 'bold',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main
                    }}
                  />
                </StyledTableCell>
                <StyledTableCell>
                  <Chip 
                    label={user.role} 
                    color={user.role === 'ADMIN' ? 'error' : 'primary'}
                    variant="outlined"
                    size="small"
                  />
                </StyledTableCell>
                <StyledTableCell>
                  <IconButton size="small" color="primary" onClick={() => handleOpenEdit(user)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteUser(user.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">Criar Novo Usuário</Typography>
        </DialogTitle>
        <DialogContent>
          <Box px={1} py={2}>
            <TextField
              label="Nome"
              fullWidth
              margin="normal"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              label="Email"
              fullWidth
              margin="normal"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Senha"
              type="password"
              fullWidth
              margin="normal"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <TextField
              label="Horas Contratadas"
              type="number"
              fullWidth
              margin="normal"
              value={form.contractedHours}
              onChange={(e) =>
                setForm({ ...form, contractedHours: Number(e.target.value) })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            variant="outlined" 
            onClick={() => setOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreate}
            sx={{ 
              borderRadius: 2, 
              px: 3,
              fontWeight: 'bold'
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">Editar Usuário</Typography>
        </DialogTitle>
        <DialogContent>
          <Box px={1} py={2}>
            <TextField
              label="Nome"
              fullWidth
              margin="normal"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
            <TextField
              label="Email"
              fullWidth
              margin="normal"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            <TextField
              label="Nova Senha (opcional)"
              type="password"
              fullWidth
              margin="normal"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
            />
            <TextField
              label="Horas Contratadas"
              type="number"
              fullWidth
              margin="normal"
              value={editForm.contractedHours}
              onChange={(e) => setEditForm({ ...editForm, contractedHours: Number(e.target.value) })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => setEditOpen(false)} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveEdit} sx={{ borderRadius: 2, px: 3, fontWeight: 'bold' }}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
