import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Grid,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
  tableCellClasses,
  styled,
} from "@mui/material";
import { useAuth } from "../../lib/useAuth";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SatelliteAltIcon from "@mui/icons-material/SatelliteAlt";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AlarmIcon from "@mui/icons-material/Alarm";
import VerifiedIcon from "@mui/icons-material/Verified";
import CancelIcon from "@mui/icons-material/Cancel";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";

interface User {
  id: string;
  name: string;
}

interface Task {
  id: string;
  description: string;
  clickupLink?: string;
  hoursSpent: number;
  date: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
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
    backgroundColor: alpha(theme.palette.background.paper, 0.6),
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    transition: 'background-color 0.2s ease',
  },
}));

// Mapeamento de status para cores e ícones
const statusConfig = {
  PENDING: {
    label: "Pendente",
    color: "warning",
    icon: <AlarmIcon style={{ fontSize: 16 }} />,
    bgColor: (theme: any) => alpha(theme.palette.warning.main, 0.1),
  },
  IN_PROGRESS: {
    label: "Em Progresso",
    color: "info",
    icon: <RocketLaunchIcon style={{ fontSize: 16 }} />,
    bgColor: (theme: any) => alpha(theme.palette.info.main, 0.1),
  },
  COMPLETED: {
    label: "Concluído",
    color: "success",
    icon: <VerifiedIcon style={{ fontSize: 16 }} />,
    bgColor: (theme: any) => alpha(theme.palette.success.main, 0.1),
  },
  CANCELLED: {
    label: "Cancelado",
    color: "error",
    icon: <CancelIcon style={{ fontSize: 16 }} />,
    bgColor: (theme: any) => alpha(theme.palette.error.main, 0.1),
  },
};

export default function AdminTasks() {
  useAuth("ADMIN");
  const theme = useTheme();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [form, setForm] = useState({
    description: "",
    hours: 0,
    link: "",
    date: new Date().toISOString().substring(0, 10), // yyyy-mm-dd
    status: "COMPLETED" as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
  });
  const [tasks, setTasks] = useState<Task[]>([]);

  // Estado para o modal de edição de status
  const [editTaskDialog, setEditTaskDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [newStatus, setNewStatus] = useState<"PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED">("COMPLETED");

  const [editHoursDialog, setEditHoursDialog] = useState(false);
  const [newHours, setNewHours] = useState<number>(0);

  const loadUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
    if (data.length && !selectedUser) setSelectedUser(data[0].id);
  };

  const loadTasks = async (uid: string) => {
    if (!uid) return;
    const res = await fetch(`/api/tasks?userId=${uid}`);
    const data = await res.json();
    setTasks(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadTasks(selectedUser);
  }, [selectedUser]);

  const handleSubmit = async () => {
    if (!selectedUser) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: selectedUser,
        clickupLink: form.link || undefined,
        description: form.description,
        hoursSpent: Number(form.hours),
        date: form.date,
        status: form.status,
      }),
    });
    setForm({ 
      description: "", 
      hours: 0, 
      link: "", 
      date: new Date().toISOString().substring(0, 10),
      status: "COMPLETED"
    });
    loadTasks(selectedUser);
  };

  // Função para abrir o diálogo de edição
  const handleEditStatus = (task: Task) => {
    setCurrentTask(task);
    setNewStatus(task.status);
    setEditTaskDialog(true);
  };

  // Função para salvar o novo status
  const handleSaveStatus = async () => {
    if (!currentTask) return;
    
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentTask.id,
          newStatus,
        }),
      });
      
      if (res.ok) {
        // Atualiza a lista local para refletir a mudança
        setTasks(tasks.map(t => 
          t.id === currentTask.id 
            ? { ...t, status: newStatus } 
            : t
        ));
        setEditTaskDialog(false);
      } else {
        alert("Erro ao atualizar o status da tarefa");
      }
    } catch (error) {
      console.error("Erro ao atualizar o status:", error);
      alert("Erro ao comunicar com o servidor");
    }
  };

  const handleHoursUpdate = async () => {
    if (!currentTask) return;
    await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentTask.id, newHours }),
    });
    setEditHoursDialog(false);
    loadTasks(selectedUser);
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Excluir tarefa?")) return;
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    loadTasks(selectedUser);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          boxShadow: `0 8px 32px 0 ${alpha(theme.palette.primary.main, 0.2)}`,
          border: `1px solid ${alpha(theme.palette.primary.light, 0.1)}`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box 
            sx={{ 
              width: 50, 
              height: 50, 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.secondary.main, 0.2),
              boxShadow: `0 0 20px ${alpha(theme.palette.secondary.main, 0.5)}`,
            }}
          >
            <SatelliteAltIcon sx={{ color: theme.palette.secondary.main }} />
          </Box>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
              Controle de Missões
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Gerenciamento de Operações Espaciais
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.light, 0.1)}`,
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3, color: theme.palette.primary.light }}>
          Registrar Nova Missão
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="user-label">Explorador</InputLabel>
              <Select
                labelId="user-label"
                value={selectedUser}
                label="Explorador"
                onChange={(e) => setSelectedUser(e.target.value)}
                sx={{ 
                  bgcolor: alpha(theme.palette.background.paper, 0.4),
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                  },
                }}
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              label="Descrição da Missão"
              fullWidth
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              sx={{ 
                bgcolor: alpha(theme.palette.background.paper, 0.4),
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Unidades de Combustível"
              type="number"
              fullWidth
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
              sx={{ 
                bgcolor: alpha(theme.palette.background.paper, 0.4),
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Data Estelar"
              type="date"
              fullWidth
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ 
                bgcolor: alpha(theme.palette.background.paper, 0.4),
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={form.status}
                label="Status"
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                sx={{ 
                  bgcolor: alpha(theme.palette.background.paper, 0.4),
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                  },
                }}
              >
                <MenuItem value="PENDING">Pendente</MenuItem>
                <MenuItem value="IN_PROGRESS">Em Progresso</MenuItem>
                <MenuItem value="COMPLETED">Concluído</MenuItem>
                <MenuItem value="CANCELLED">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Coordenadas (opcional)"
              fullWidth
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              sx={{ 
                bgcolor: alpha(theme.palette.background.paper, 0.4),
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              onClick={handleSubmit} 
              disabled={!selectedUser || !form.description || !form.hours}
              sx={{
                px: 4,
                py: 1,
                borderRadius: 2,
                backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`,
                '&:hover': {
                  backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                  transform: 'translateY(-2px)',
                  transition: '0.3s',
                }
              }}
            >
              Lançar Missão
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper 
        elevation={2} 
        sx={{ 
          mt: 2, 
          p: 0, 
          borderRadius: 3, 
          overflow: 'hidden',
          background: alpha(theme.palette.background.paper, 0.8),
          border: `1px solid ${alpha(theme.palette.primary.light, 0.1)}`,
          position: 'relative'
        }}
      >
        <Box 
          sx={{ 
            p: 3, 
            backgroundImage: `linear-gradient(to right, ${theme.palette.primary.dark}, ${alpha(theme.palette.primary.main, 0.7)})`,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <TravelExploreIcon sx={{ color: theme.palette.common.white }} />
          <Typography variant="h5" fontWeight="bold" color="white">
            Histórico de Missões
          </Typography>
        </Box>
        
        {tasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <NightsStayIcon sx={{ fontSize: 40, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
            <Typography>Nenhuma missão registrada para este explorador.</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell>Descrição</StyledTableCell>
                <StyledTableCell>Combustível</StyledTableCell>
                <StyledTableCell>Data Estelar</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Coordenadas</StyledTableCell>
                <StyledTableCell>Ações</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((t) => (
                <StyledTableRow key={t.id}>
                  <StyledTableCell>{t.description}</StyledTableCell>
                  <StyledTableCell>
                    <Chip 
                      label={`${t.hoursSpent}h`}
                      size="small"
                      sx={{ 
                        fontWeight: 'bold',
                        bgcolor: alpha(theme.palette.grey[300], 0.4),
                        color: '#000',
                        borderRadius: '12px',
                        '& .MuiChip-label': {
                          px: 1.5,
                        }
                      }}
                      onClick={() => {
                        setCurrentTask(t);
                        setNewHours(t.hoursSpent);
                        setEditHoursDialog(true);
                      }}
                      clickable
                    />
                  </StyledTableCell>
                  <StyledTableCell>
                    {new Date(t.date).toLocaleDateString()}
                  </StyledTableCell>
                  <StyledTableCell>
                    <Chip 
                      icon={statusConfig[t.status]?.icon}
                      label={statusConfig[t.status]?.label || t.status} 
                      size="small"
                      color={statusConfig[t.status]?.color as any}
                      variant="outlined"
                      sx={{ 
                        bgcolor: statusConfig[t.status]?.bgColor(theme),
                        fontWeight: 500
                      }}
                    />
                  </StyledTableCell>
                  <StyledTableCell>
                    {t.clickupLink ? (
                      <a 
                        href={t.clickupLink} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ 
                          color: theme.palette.secondary.main,
                          textDecoration: 'none',
                          fontWeight: 500
                        }}
                      >
                        acessar
                      </a>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </StyledTableCell>
                  <StyledTableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditStatus(t)}
                      sx={{ 
                        color: theme.palette.primary.main,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteTask(t.id)}
                      sx={{ 
                        color: theme.palette.error.main,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Diálogo para editar status */}
      <Dialog 
        open={editTaskDialog} 
        onClose={() => setEditTaskDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.background.paper,
            backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.primary.dark, 0.2)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">Atualizar Status da Missão</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, mt: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Missão: {currentTask?.description}
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="edit-status-label">Status</InputLabel>
              <Select
                labelId="edit-status-label"
                value={newStatus}
                label="Status"
                onChange={(e) => setNewStatus(e.target.value as any)}
                sx={{ 
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                  },
                }}
              >
                <MenuItem value="PENDING">
                  <Box display="flex" alignItems="center" gap={1}>
                    {statusConfig.PENDING.icon}
                    Pendente
                  </Box>
                </MenuItem>
                <MenuItem value="IN_PROGRESS">
                  <Box display="flex" alignItems="center" gap={1}>
                    {statusConfig.IN_PROGRESS.icon}
                    Em Progresso
                  </Box>
                </MenuItem>
                <MenuItem value="COMPLETED">
                  <Box display="flex" alignItems="center" gap={1}>
                    {statusConfig.COMPLETED.icon}
                    Concluído
                  </Box>
                </MenuItem>
                <MenuItem value="CANCELLED">
                  <Box display="flex" alignItems="center" gap={1}>
                    {statusConfig.CANCELLED.icon}
                    Cancelado
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setEditTaskDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveStatus}
            variant="contained"
            sx={{
              borderRadius: 2,
              backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              px: 3,
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editHoursDialog} onClose={() => setEditHoursDialog(false)}>
        <DialogTitle>Editar Horas da Tarefa</DialogTitle>
        <DialogContent>
          <TextField
            type="number"
            label="Horas"
            value={newHours}
            fullWidth
            onChange={(e) => setNewHours(Number(e.target.value))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditHoursDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleHoursUpdate}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
