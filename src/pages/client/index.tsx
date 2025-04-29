import React from "react";
import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Box,
  Paper,
  Divider,
  LinearProgress,
  Avatar,
  Chip,
  useTheme,
  alpha,
  tableCellClasses,
  styled,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Collapse,
} from "@mui/material";
import { useAuth } from "../../lib/useAuth";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SatelliteAltIcon from "@mui/icons-material/SatelliteAlt";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import TelegramIcon from "@mui/icons-material/Telegram";
import AlarmIcon from '@mui/icons-material/Alarm';
import VerifiedIcon from '@mui/icons-material/Verified';
import CancelIcon from '@mui/icons-material/Cancel';
import QueryStatsIcon from '@mui/icons-material/QueryStats';

interface Task {
  id: string;
  description: string;
  clickupLink?: string;
  hoursSpent: number;
  date: string;
  status: string;
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

const statusConfig: Record<string, any> = {
  PENDING: {
    label: "Pendente",
    color: "warning",
    icon: <AlarmIcon style={{ fontSize: 14 }} />,
  },
  IN_PROGRESS: {
    label: "Em Progresso",
    color: "info",
    icon: <RocketLaunchIcon style={{ fontSize: 14 }} />,
  },
  COMPLETED: {
    label: "Concluído",
    color: "success",
    icon: <VerifiedIcon style={{ fontSize: 14 }} />,
  },
  CANCELLED: {
    label: "Cancelado",
    color: "error",
    icon: <CancelIcon style={{ fontSize: 14 }} />,
  },
};

export default function ClientPage() {
  const [summary, setSummary] = useState({ contracted: 0, used: 0, accumulated: 0, remaining: 0 });
  const [quarterSummary, setQuarterSummary] = useState({ contracted: 0, used: 0, remaining: 0 });
  const [tasks, setTasks] = useState<Task[]>([]);
  const theme = useTheme();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isQuarterView, setIsQuarterView] = useState(false);
  useAuth("CLIENT");

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.userId;

    const [userRes, tasksRes] = await Promise.all([
      fetch(`/api/users?userId=${userId}`),
      fetch(`/api/tasks?userId=${userId}&month=${selectedMonth + 1}&year=${selectedYear}`),
    ]);
    const user = await userRes.json();
    const tasksData = await tasksRes.json();

    const activeTasks = tasksData.filter((t: Task) => t.status !== 'CANCELLED');
    const used = activeTasks.reduce((acc: number, t: Task) => acc + t.hoursSpent, 0);

    // Fetch quarter data
    const quarter = Math.floor(selectedMonth / 3) + 1;
    const quarterRes = await fetch(`/api/tasks?userId=${userId}&quarter=${quarter}&year=${selectedYear}`);
    const quarterTasks = await quarterRes.json();
    const activeQuarterTasks = quarterTasks.filter((t: Task) => t.status !== 'CANCELLED');
    const usedQuarter = activeQuarterTasks.reduce((acc: number, t: Task) => acc + t.hoursSpent, 0);

    const remaining = Math.max(0, user.contractedHours - used);
    setSummary({ contracted: user.contractedHours, used, accumulated: user.accumulatedHours, remaining });
    setQuarterSummary({ contracted: user.contractedHours * 3, used: usedQuarter, remaining: Math.max(0, user.contractedHours * 3 - usedQuarter) });
    setTasks(tasksData);
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  // Calcular porcentagem utilizada
  const percentageUsed = summary.contracted > 0 ? (summary.used / summary.contracted) * 100 : 0;
  const quarterPercentageUsed = quarterSummary.contracted > 0 ? (quarterSummary.used / quarterSummary.contracted) * 100 : 0;

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
          <Avatar 
            sx={{ 
              width: 50, 
              height: 50, 
              bgcolor: alpha(theme.palette.secondary.main, 0.2),
              boxShadow: `0 0 20px ${alpha(theme.palette.secondary.main, 0.5)}`,
            }}
          >
            <NightsStayIcon sx={{ color: theme.palette.secondary.main }} />
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ color: '#ffffff' }}>
              Estação Espacial ONGOING
            </Typography>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#ffffff' }}>
              Monitoramento de Unidades de Tempo Galáctico
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Box mb={2} display="flex" justifyContent="flex-end" alignItems="center">
        <FormControlLabel
          control={
            <Switch
              checked={isQuarterView}
              onChange={(e) => setIsQuarterView(e.target.checked)}
              color="primary"
            />
          }
          label={isQuarterView ? "Visão Trimestral" : "Visão Mensal"}
        />
      </Box>

      <Collapse in={!isQuarterView} timeout={600} mountOnEnter unmountOnExit>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              borderRadius: 3,
              transition: 'all 0.3s ease',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha('#ffffff', 0.85)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.light, 0.15)}`,
              boxShadow: `0 4px 16px 0 ${alpha(theme.palette.primary.main, 0.12)}`,
              '&:hover': { 
                transform: 'translateY(-5px)',
                boxShadow: `0 8px 30px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              },
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box 
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                fontSize: '6rem',
                opacity: 0.05,
                transform: 'rotate(10deg)',
                color: theme.palette.primary.light,
              }}
            >
              <RocketLaunchIcon fontSize="inherit" />
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar 
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.2), 
                    mr: 2,
                    boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.5)}`,
                  }}
                >
                  <RocketLaunchIcon />
                </Avatar>
                <Typography variant="h6">Combustível Disponível</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {summary.contracted}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unidades de combustível alocadas por ciclo lunar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%', 
            borderRadius: 3,
            transition: 'all 0.3s ease',
            background: percentageUsed > 90 
              ? `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.08)} 0%, ${alpha('#ffffff', 0.85)} 100%)`
              : percentageUsed > 70 
                ? `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha('#ffffff', 0.85)} 100%)`
                : `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha('#ffffff', 0.85)} 100%)`,
            border: `1px solid ${alpha(theme.palette.grey[300], 0.6)}`,
            boxShadow: `0 4px 16px 0 ${alpha(theme.palette.grey[500], 0.15)}`,
            '&:hover': { 
              transform: 'translateY(-5px)',
              boxShadow: `0 8px 30px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
            },
            position: 'relative',
            overflow: 'hidden',
          }}>
            <Box 
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                fontSize: '6rem',
                opacity: 0.05,
                transform: 'rotate(10deg)',
                color: percentageUsed > 90 
                  ? theme.palette.error.light
                  : percentageUsed > 70 
                    ? theme.palette.warning.light
                    : theme.palette.success.light,
              }}
            >
              <SatelliteAltIcon fontSize="inherit" />
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ 
                  bgcolor: percentageUsed > 90 
                    ? alpha(theme.palette.error.main, 0.2)
                    : percentageUsed > 70 
                      ? alpha(theme.palette.warning.main, 0.2)
                      : alpha(theme.palette.success.main, 0.2),
                  mr: 2,
                  boxShadow: `0 0 10px ${
                    percentageUsed > 90 
                      ? alpha(theme.palette.error.main, 0.5)
                      : percentageUsed > 70 
                        ? alpha(theme.palette.warning.main, 0.5)
                        : alpha(theme.palette.success.main, 0.5)
                  }`,
                }}>
                  <SatelliteAltIcon />
                </Avatar>
                <Typography variant="h6">Combustível Consumido</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {summary.used}h
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Status da Missão</Typography>
                  <Typography variant="body2">{Math.min(100, Math.round(percentageUsed))}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, percentageUsed)} 
                  sx={{ 
                    mt: 1, 
                    height: 8, 
                    borderRadius: 5,
                    backgroundColor: alpha(theme.palette.grey[500], 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundImage: percentageUsed > 90 
                        ? `linear-gradient(90deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`
                        : percentageUsed > 70 
                          ? `linear-gradient(90deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 100%)`
                          : `linear-gradient(90deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
                      boxShadow: percentageUsed > 90 
                        ? `0 0 10px ${alpha(theme.palette.error.main, 0.5)}`
                        : percentageUsed > 70 
                          ? `0 0 10px ${alpha(theme.palette.warning.main, 0.5)}`
                          : `0 0 10px ${alpha(theme.palette.success.main, 0.5)}`,
                    }
                  }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%', 
            borderRadius: 3, 
            transition: 'all 0.3s ease', 
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha('#ffffff', 0.85)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.light, 0.15)}`,
            boxShadow: `0 4px 16px 0 ${alpha(theme.palette.info.main, 0.12)}`,
            '&:hover': { 
              transform: 'translateY(-5px)',
              boxShadow: `0 8px 30px 0 ${alpha(theme.palette.info.main, 0.3)}`,
            },
            position: 'relative',
            overflow: 'hidden',
          }}>
            <Box 
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                fontSize: '6rem',
                opacity: 0.05,
                transform: 'rotate(10deg)',
                color: theme.palette.info.light,
              }}
            >
              <TravelExploreIcon fontSize="inherit" />
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar 
                  sx={{ 
                    bgcolor: alpha(theme.palette.info.main, 0.2), 
                    mr: 2,
                    boxShadow: `0 0 10px ${alpha(theme.palette.info.main, 0.5)}`,
                  }}
                >
                  <TravelExploreIcon />
                </Avatar>
                <Typography variant="h6">Reserva Intergaláctica</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {summary.remaining}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Combustível acumulado para viagens futuras
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Collapse>

      <Collapse in={isQuarterView} timeout={600} mountOnEnter unmountOnExit>
      {/* Resumo Trimestral */}
      <Grid container spacing={4} sx={{ mb: 5 }}>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              borderRadius: 3,
              transition: 'all 0.3s ease',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha('#ffffff', 0.85)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.light, 0.15)}`,
              boxShadow: `0 4px 16px 0 ${alpha(theme.palette.primary.main, 0.12)}`,
              '&:hover': { 
                transform: 'translateY(-5px)',
                boxShadow: `0 8px 30px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              },
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ position: 'absolute', top: 10, right: 10, fontSize: '6rem', opacity: 0.05, color: theme.palette.primary.light }}>
              <QueryStatsIcon fontSize="inherit" />
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2), mr: 2 }}>
                  <QueryStatsIcon />
                </Avatar>
                <Typography variant="h6">Horas Trimestre</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {quarterSummary.contracted}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total disponível no trimestre
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              borderRadius: 3,
              transition: 'all 0.3s ease',
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha('#ffffff', 0.85)} 100%)`,
              border: `1px solid ${alpha(theme.palette.warning.light, 0.15)}`,
              boxShadow: `0 4px 16px 0 ${alpha(theme.palette.warning.main, 0.12)}`,
              '&:hover': { 
                transform: 'translateY(-5px)',
                boxShadow: `0 8px 30px 0 ${alpha(theme.palette.warning.main, 0.3)}`,
              },
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.2), mr: 2 }}>
                  <QueryStatsIcon />
                </Avatar>
                <Typography variant="h6">Horas Utilizadas (Tri)</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {quarterSummary.used}h
              </Typography>
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, quarterPercentageUsed)} 
                  sx={{ height: 8, borderRadius: 5 }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              borderRadius: 3,
              transition: 'all 0.3s ease',
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha('#ffffff', 0.85)} 100%)`,
              border: `1px solid ${alpha(theme.palette.success.light, 0.15)}`,
              boxShadow: `0 4px 16px 0 ${alpha(theme.palette.success.main, 0.12)}`,
              '&:hover': { 
                transform: 'translateY(-5px)',
                boxShadow: `0 8px 30px 0 ${alpha(theme.palette.success.main, 0.3)}`,
              },
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.2), mr: 2 }}>
                  <QueryStatsIcon />
                </Avatar>
                <Typography variant="h6">Horas Restantes (Tri)</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {quarterSummary.remaining}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Disponível até fim do trimestre
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Collapse>

      {/* Seletor de Mês/Ano */}
      <Box mt={6} mb={4} display="flex" gap={2}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="month-label">Mês</InputLabel>
          <Select
            labelId="month-label"
            value={selectedMonth}
            label="Mês"
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {[
              "Jan",
              "Fev",
              "Mar",
              "Abr",
              "Mai",
              "Jun",
              "Jul",
              "Ago",
              "Set",
              "Out",
              "Nov",
              "Dez",
            ].map((name, idx) => (
              <MenuItem key={idx} value={idx}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel id="year-label">Ano</InputLabel>
          <Select
            labelId="year-label"
            value={selectedYear}
            label="Ano"
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const yr = new Date().getFullYear() - i;
              return <MenuItem key={yr} value={yr}>{yr}</MenuItem>;
            })}
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={2} sx={{ 
        mt: 4, 
        p: 3, 
        borderRadius: 3, 
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.primary.dark, 0.2)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.light, 0.1)}`,
        backdropFilter: 'blur(10px)',
        boxShadow: `0 8px 32px 0 ${alpha(theme.palette.primary.main, 0.2)}`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 70%)`,
          filter: 'blur(20px)',
          zIndex: 0,
        }} />
        
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.2)} 0%, transparent 70%)`,
          filter: 'blur(20px)',
          zIndex: 0,
        }} />
        
        <Box position="relative" zIndex={1}>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <StarBorderIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Registros de Navegação Espacial
            </Typography>
          </Box>
          
          {tasks.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              background: alpha(theme.palette.background.paper, 0.5),
              borderRadius: 2,
              border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
            }}>
              <Box sx={{ opacity: 0.6, mb: 2 }}>
                <TravelExploreIcon sx={{ fontSize: 50, color: theme.palette.primary.main, opacity: 0.5 }} />
              </Box>
              <Typography variant="body1" color="text.secondary">
                Nenhuma missão espacial registrada ainda.
              </Typography>
            </Box>
          ) : (
            <Table sx={{ 
              minWidth: 650,
              '& .MuiTableCell-root': { 
                borderColor: alpha(theme.palette.primary.main, 0.1) 
              },
            }}>
              <TableHead>
                <TableRow>
                  <StyledTableCell sx={{ 
                    backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                    '&:first-of-type': { borderTopLeftRadius: 8 },
                    '&:last-of-type': { borderTopRightRadius: 8 },
                  }}>Nome da Missão</StyledTableCell>
                  <StyledTableCell sx={{ 
                    backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                  }}>Combustível</StyledTableCell>
                  <StyledTableCell sx={{ 
                    backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                  }}>Data Estelar</StyledTableCell>
                  <StyledTableCell sx={{ 
                    backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                  }}>Status</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((t) => (
                  <StyledTableRow key={t.id} sx={{
                    background: alpha(theme.palette.background.paper, 0.4),
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.05),
                    }
                  }}>
                    <StyledTableCell>
                      {t.clickupLink ? (
                        <Box display="flex" alignItems="center">
                          <TelegramIcon sx={{ mr: 1, color: theme.palette.secondary.main, fontSize: 18 }} />
                          <a 
                            href={t.clickupLink} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ 
                              color: theme.palette.secondary.main, 
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontWeight: 500,
                            }}
                          >
                            {t.description}
                          </a>
                        </Box>
                      ) : (
                        <Box display="flex" alignItems="center">
                          <TravelExploreIcon sx={{ mr: 1, color: theme.palette.text.secondary, fontSize: 18 }} />
                          {t.description}
                        </Box>
                      )}
                    </StyledTableCell>
                    <StyledTableCell>
                      <Chip 
                        label={`${t.hoursSpent}h`}
                        size="small"
                        sx={{ 
                          fontWeight: 'bold',
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          color: theme.palette.secondary.main,
                          borderRadius: '12px',
                          '& .MuiChip-label': {
                            px: 1.5,
                          }
                        }}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      <Box display="flex" alignItems="center">
                        <NightsStayIcon sx={{ mr: 1, color: theme.palette.primary.light, fontSize: 16 }} />
                        {new Date(t.date).toLocaleDateString()}
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Chip 
                        label={statusConfig[t.status]?.label || "Concluído"} 
                        size="small"
                        color={statusConfig[t.status]?.color as any || "success"}
                        variant="outlined"
                        icon={statusConfig[t.status]?.icon || <RocketLaunchIcon style={{ fontSize: 14 }} />}
                        sx={{ 
                          borderRadius: '12px',
                          '& .MuiChip-label': {
                            fontWeight: 500,
                          }
                        }}
                      />
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
