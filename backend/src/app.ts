import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import usuariosRoutes from './routes/usuarios';
import doctoresRoutes from './routes/doctores';
import especialidadesRoutes from './routes/especialidades';
import pacientesRoutes from './routes/pacientes';
import citasRoutes from './routes/citas';
import notificacionesRoutes from './routes/notificaciones';
import auditoriaRoutes from './routes/auditoria';

dotenv.config();

const app = express();

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'], credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/doctores', doctoresRoutes);
app.use('/api/especialidades', especialidadesRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/auditoria', auditoriaRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Clínica Salud Total API corriendo', timestamp: new Date().toISOString() });
});

export default app;
