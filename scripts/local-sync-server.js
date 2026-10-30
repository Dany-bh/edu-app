// scripts/local-sync-server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8082;
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const DATA_FILE = path.join(DATA_DIR, 'shared_network_db.json');

// Asegurar directorio
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Cargar o inicializar estado compartido
function loadState() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        usuarios: parsed.usuarios || [],
        solicitudes_password: parsed.solicitudes_password || [],
        eliminados: parsed.eliminados || []
      };
    } catch (e) {
      console.warn('[SyncServer] Error leyendo archivo de datos, inicializando nuevo estado.');
    }
  }
  return {
    usuarios: [],
    solicitudes_password: [],
    eliminados: []
  };
}

function saveState(state) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.error('[SyncServer] Error guardando estado:', e);
  }
}

let state = loadState();

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // 1. Estado y solicitudes actuales
  if (req.method === 'GET' && url.pathname === '/api/sync') {
    const pendingUsers = state.usuarios.filter(u => u.rol === 'estudiante' && u.estado === 'pendiente');
    const activeUsers = state.usuarios.filter(u => u.rol === 'admin' || u.estado === 'activo');
    const inactiveUsers = state.usuarios.filter(u => u.rol === 'estudiante' && u.estado === 'inactivo');
    const pendingPasswords = state.solicitudes_password.filter(s => s.estado === 'pendiente');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      pendingUsers,
      activeUsers,
      inactiveUsers,
      pendingPasswords,
      eliminados: state.eliminados || [],
      totalUsers: state.usuarios.length
    }));
    return;
  }

  // 2. Registro de nuevo estudiante (desde Android o Web)
  if (req.method === 'POST' && url.pathname === '/api/register') {
    try {
      const payload = await parseJsonBody(req);
      const cleanUsername = (payload.usuario || '').trim().toLowerCase();

      if (!cleanUsername) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Usuario requerido' }));
        return;
      }

      // Si se vuelve a registrar, quitar de eliminados
      state.eliminados = (state.eliminados || []).filter(u => u !== cleanUsername);

      const existingIndex = state.usuarios.findIndex(u => u.usuario === cleanUsername);
      const newUser = {
        id: payload.id || Date.now(),
        nombre_completo: payload.nombre_completo || cleanUsername,
        usuario: cleanUsername,
        password_hash: payload.password_hash || '',
        salt: payload.salt || '',
        grado: payload.grado || '',
        genero: payload.genero || 'Otro',
        rol: 'estudiante',
        estado: payload.estado || 'activo',
        fecha_registro: payload.fecha_registro || new Date().toISOString()
      };

      if (existingIndex >= 0) {
        // Actualizar si ya existía
        state.usuarios[existingIndex] = { ...state.usuarios[existingIndex], ...newUser };
      } else {
        state.usuarios.push(newUser);
      }

      saveState(state);
      console.log(`[SyncServer] 🔔 Nuevo registro recibido: @${cleanUsername} (${newUser.nombre_completo}) - Estado: ${newUser.estado}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, user: newUser }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // 3. Aprobación de estudiante por el Admin
  if (req.method === 'POST' && url.pathname === '/api/approve') {
    try {
      const payload = await parseJsonBody(req);
      const targetUser = state.usuarios.find(u => 
        (payload.userId && u.id === payload.userId) || 
        (payload.usuario && u.usuario === payload.usuario.toLowerCase())
      );

      if (targetUser) {
        targetUser.estado = 'activo';
        saveState(state);
        console.log(`[SyncServer] ✅ Estudiante aprobado: @${targetUser.usuario}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user: targetUser }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Usuario no encontrado' }));
      }
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // 3.1. Rechazo de estudiante por el Admin
  if (req.method === 'POST' && url.pathname === '/api/reject') {
    try {
      const payload = await parseJsonBody(req);
      const cleanUser = (payload.usuario || '').trim().toLowerCase();
      const targetIndex = state.usuarios.findIndex(u => 
        (payload.userId && u.id === payload.userId) || 
        (cleanUser && u.usuario === cleanUser)
      );

      let removedUsername = cleanUser;
      if (targetIndex >= 0) {
        const deleted = state.usuarios.splice(targetIndex, 1);
        removedUsername = deleted[0].usuario;
        console.log(`[SyncServer] ❌ Estudiante rechazado y eliminado: @${removedUsername}`);
      }

      state.eliminados = state.eliminados || [];
      if (removedUsername && !state.eliminados.includes(removedUsername)) {
        state.eliminados.push(removedUsername);
      }
      saveState(state);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, eliminados: state.eliminados }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // 3.2. Eliminación de usuario por el Admin
  if (req.method === 'POST' && url.pathname === '/api/delete-user') {
    try {
      const payload = await parseJsonBody(req);
      const cleanUser = (payload.usuario || '').trim().toLowerCase();
      const targetIndex = state.usuarios.findIndex(u => 
        (payload.userId && u.id === payload.userId) || 
        (cleanUser && u.usuario === cleanUser)
      );

      let removedUsername = cleanUser;
      if (targetIndex >= 0) {
        const deleted = state.usuarios.splice(targetIndex, 1);
        removedUsername = deleted[0].usuario;
        console.log(`[SyncServer] 🗑️ Usuario eliminado: @${removedUsername}`);
      }

      state.eliminados = state.eliminados || [];
      if (removedUsername && !state.eliminados.includes(removedUsername)) {
        state.eliminados.push(removedUsername);
      }
      saveState(state);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, eliminados: state.eliminados }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // 3.3. Rechazo / Descarte de solicitud de contraseña
  if (req.method === 'POST' && url.pathname === '/api/reject-password') {
    try {
      const payload = await parseJsonBody(req);
      const targetIndex = state.solicitudes_password.findIndex(s => s.id === payload.solicitudId);
      if (targetIndex >= 0) {
        state.solicitudes_password.splice(targetIndex, 1);
        saveState(state);
        console.log(`[SyncServer] 🗑️ Solicitud de contraseña eliminada ID: ${payload.solicitudId}`);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // 4. Solicitud de cambio de contraseña
  if (req.method === 'POST' && url.pathname === '/api/request-password') {
    try {
      const payload = await parseJsonBody(req);
      const cleanUsername = (payload.usuario || '').trim().toLowerCase();

      const newRequest = {
        id: payload.id || Date.now(),
        usuario_id: payload.usuario_id || 0,
        usuario: cleanUsername,
        nombre_completo: payload.nombre_completo || cleanUsername,
        estado: 'pendiente',
        fecha_solicitud: new Date().toISOString()
      };

      const existing = state.solicitudes_password.find(s => s.usuario === cleanUsername && s.estado === 'pendiente');
      if (!existing) {
        state.solicitudes_password.push(newRequest);
        saveState(state);
        console.log(`[SyncServer] 🔑 Solicitud de contraseña para @${cleanUsername}`);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // 5. Resolución de cambio de contraseña por Admin
  if (req.method === 'POST' && url.pathname === '/api/resolve-password') {
    try {
      const payload = await parseJsonBody(req);
      const reqItem = state.solicitudes_password.find(s => s.id === payload.solicitudId);
      if (reqItem) {
        reqItem.estado = 'atendido';
        reqItem.nueva_password_temporal = payload.newPassword;
        reqItem.fecha_atencion = new Date().toISOString();
      }

      const userItem = state.usuarios.find(u => 
        (payload.userId && u.id === payload.userId) || 
        (payload.usuario && u.usuario === payload.usuario.toLowerCase())
      );
      if (userItem && payload.newHash && payload.newSalt) {
        userItem.password_hash = payload.newHash;
        userItem.salt = payload.newSalt;
      }

      saveState(state);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // 5.1. Actualización de Puntos y Nivel en tiempo real
  if (req.method === 'POST' && url.pathname === '/api/update-points') {
    try {
      const payload = await parseJsonBody(req);
      const cleanUser = (payload.usuario || '').trim().toLowerCase();
      const targetUser = state.usuarios.find(u => 
        (payload.userId && u.id === payload.userId) || 
        (cleanUser && u.usuario.toLowerCase() === cleanUser)
      );

      if (targetUser) {
        const newPoints = typeof payload.puntos === 'number' ? payload.puntos : (targetUser.puntos || 0);
        const newLevel = typeof payload.nivel === 'number' ? payload.nivel : (targetUser.nivel || 1);
        targetUser.puntos = Math.max(targetUser.puntos || 0, newPoints);
        targetUser.nivel = Math.max(targetUser.nivel || 1, newLevel);
        saveState(state);
        console.log(`[SyncServer] ⭐ Puntos actualizados para @${targetUser.usuario}: ${targetUser.puntos} XP (Nivel ${targetUser.nivel})`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, puntos: targetUser.puntos, nivel: targetUser.nivel }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Usuario no encontrado' }));
      }
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // 6. Sincronización bidireccional masiva (para rescatar registros locales previos)
  if (req.method === 'POST' && url.pathname === '/api/sync-all') {
    try {
      const payload = await parseJsonBody(req);
      const localUsers = payload.usuarios || [];
      const localPasswords = payload.solicitudes_password || [];

      // Fusionar usuarios locales respetando el puntaje más alto
      for (const lu of localUsers) {
        const cleanUser = (lu.usuario || '').trim().toLowerCase();
        if (!cleanUser) continue;
        // Si el usuario fue eliminado por el administrador, NUNCA volver a insertarlo
        if (state.eliminados && state.eliminados.includes(cleanUser)) continue;

        const idx = state.usuarios.findIndex(u => u.usuario === cleanUser);
        if (idx >= 0) {
          const existing = state.usuarios[idx];
          const maxPoints = Math.max(existing.puntos || 0, lu.puntos || 0);
          const maxLevel = Math.max(existing.nivel || 1, lu.nivel || 1);
          state.usuarios[idx] = { ...existing, ...lu, puntos: maxPoints, nivel: maxLevel };
        } else {
          state.usuarios.push({ ...lu, usuario: cleanUser, puntos: lu.puntos || 0, nivel: lu.nivel || 1 });
        }
      }

      // Fusionar solicitudes de contraseña
      for (const lp of localPasswords) {
        const cleanUser = (lp.usuario || '').trim().toLowerCase();
        if (!cleanUser) continue;
        if (state.eliminados && state.eliminados.includes(cleanUser)) continue;

        const idx = state.solicitudes_password.findIndex(s => s.id === lp.id || (s.usuario === cleanUser && s.estado === 'pendiente'));
        if (idx >= 0) {
          state.solicitudes_password[idx] = { ...state.solicitudes_password[idx], ...lp };
        } else {
          state.solicitudes_password.push(lp);
        }
      }

      saveState(state);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        usuarios: state.usuarios,
        solicitudes_password: state.solicitudes_password,
        eliminados: state.eliminados || []
      }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint no encontrado' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SyncServer] 🚀 Servidor de Sincronización Local Wi-Fi activo en el puerto ${PORT}`);
  console.log(`[SyncServer] 🌐 Dirección en red: http://192.168.1.102:${PORT}`);
  console.log(`[SyncServer] 💻 Dirección local: http://localhost:${PORT}`);
});
