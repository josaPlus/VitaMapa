# VitaMapa · Red georreferenciada de atención médica

Aplicación web para **ubicar unidades de salud** (hospitales, centros de salud, farmacias,
laboratorios, módulos de vacunación y bases de urgencias), **marcar zonas sanitarias**
(sectores de cobertura o de riesgo, por ejemplo un brote de dengue) y **encontrar la unidad
abierta más cercana** a un paciente. La ubicación es el centro de la solución: cada unidad es un
`Point` y cada zona un `Polygon` en MongoDB, y las consultas `$geoWithin` y `$geoNear` responden
«¿qué hay dentro de esta zona?» y «¿cuál me queda más cerca?».

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19 + Vite, React Router, React-Leaflet, Leaflet-Geoman (trazo de polígonos) |
| Backend | Node.js + Express 5, organizado en `config / models / routes / services / middlewares / utils` |
| Base de datos | MongoDB Atlas + Mongoose (índices `2dsphere`) |
| Seguridad | Contraseñas con **bcrypt**, sesión con **JWT**, credenciales solo en `.env` |

---

## Estructura

```
Proyecto Final/
├── backend/
│   ├── .env.example
│   ├── request/api.http          ← pruebas con REST Client
│   └── src/
│       ├── index.js              ← arranca el servidor después de conectar a MongoDB
│       ├── app.js                ← middlewares globales, rutas y manejo de errores
│       ├── config/               ← database.js, cors.js
│       ├── models/               ← esquemas de Mongoose
│       ├── routes/               ← solo reciben la petición y llaman al servicio
│       ├── services/             ← lógica y operaciones con MongoDB (uno por entidad)
│       ├── middlewares/          ← validadores, auth (JWT) y error.handler (404 + errorHandler)
│       ├── utils/                ← AppError, validación, token, búsqueda sin acentos
│       └── data/                 ← seed.js y datos de ejemplo
└── frontend/
    ├── .env.example
    ├── vercel.json               ← redirige todas las rutas a index.html (SPA)
    └── src/
        ├── api/client.js         ← fetch + token + errores
        ├── context/              ← sesión (AuthContext) y notificaciones (ToastContext)
        ├── components/map/       ← mapa, popups editables, dibujo de zonas, tabla, filtros
        ├── components/catalogs/  ← CRUD genérico
        └── pages/                ← Acceso, Mapa, Catálogos, Cobertura
```

## Modelos y relaciones

```
User ──< Location >── Category          Location.category  → Category (ObjectId + populate)
  │         ^                           Location.createdBy → User
  │         │                           Doctor.specialty   → Specialty
  └──< Zone Doctor >── Specialty        Doctor.unit        → Location (unidad donde atiende)
                                        Zone.createdBy     → User
```

| Colección | Campos principales |
| --- | --- |
| `users` | name, email (único), password (hash bcrypt, `select:false`) |
| `locations` | name, description, category, status (`disponible`/`saturada`/`cerrada`), phone, **location: Point [lng, lat]**, createdBy |
| `zones` | name, risk (`bajo`/`medio`/`alto`), notes, **area: Polygon [[[lng, lat], …]]**, createdBy |
| `categories` | name, icon (emoji), color, description — **CRUD 1** |
| `specialties` | name, area, description — **CRUD 2** |
| `doctors` | fullName, license (cédula), shift, phone, specialty, unit — **CRUD 3** |

`locations.location` y `zones.area` tienen índice **2dsphere**.

## Endpoints

Todas las rutas, excepto `/api/auth/register` y `/api/auth/login`, requieren
`Authorization: Bearer <token>` (si falta o expiró → **401**).

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/register` | Crea cuenta (201). Correo duplicado → 400 |
| POST | `/api/auth/login` | Inicia sesión (200). Datos incorrectos → 401 |
| GET | `/api/auth/me` | Usuario de la sesión |
| GET | `/api/locations?search=&category=&status=&zone=` | Lista filtrada **en el backend** |
| GET | `/api/locations/geojson` | Mismos filtros, como FeatureCollection |
| GET | `/api/locations/nearby?lat=&lng=&limit=` | Unidades abiertas más cercanas (`$geoNear`) |
| POST/PATCH/DELETE | `/api/locations[/:id]` | Crear, editar, eliminar |
| GET/POST/PATCH/DELETE | `/api/zones[/:id]` | CRUD de zonas (Polygon) |
| GET | `/api/zones/coverage` | Unidades dentro de cada zona (`$geoWithin`) |
| GET/POST/PATCH/DELETE | `/api/categories`, `/api/specialties`, `/api/doctors` | CRUD de catálogos |

Filtros de ubicaciones: `search` (nombre parcial, sin mayúsculas ni acentos), `category`,
y dos filtros extra: `status` y `zone` (solo las unidades dentro del polígono elegido).

Códigos usados: 200, 201, 400 (validación, ids inválidos, duplicados, borrado con dependencias),
401 (sin sesión / credenciales incorrectas), 404 (ruta o registro inexistente), 500.

---

## Ejecutar localmente

Requisitos: Node.js 20 o superior y una base de datos en MongoDB Atlas.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # en Windows: copy .env.example .env
```

Edita `backend/.env`:

```
PORT=3000
FRONTEND_ORIGINS=http://localhost:5173
MONGODB_URI=mongodb+srv://USUARIO:CONTRASEÑA@cluster.xxxxx.mongodb.net/vitamapa
JWT_SECRET=una-cadena-larga-y-aleatoria
JWT_EXPIRES_IN=8h
```

Carga los datos de ejemplo (crea también el usuario de prueba) y arranca:

```bash
npm run seed
npm run dev
```

La API queda en `http://localhost:3000` (prueba `http://localhost:3000/api/health`).

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:3000/api
npm run dev
```

Abre `http://localhost:5173`.

### Usuario de prueba (lo crea `npm run seed`)

| Correo | Contraseña |
| --- | --- |
| `revisor@vitamapa.mx` | `Vita2026` |

---

## Despliegue

1. **MongoDB Atlas**: crea el cluster y un usuario de base de datos; en *Network Access* permite
   `0.0.0.0/0` (Render no tiene IP fija).
2. **Backend en Render** (*New → Web Service*, raíz `backend`):
   - Build: `npm install` · Start: `npm start`
   - Variables: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_ORIGINS=https://<tu-app>.vercel.app`
   - Ejecuta el seed una vez desde tu máquina apuntando a la misma `MONGODB_URI`.
   - También puedes usar el `render.yaml` incluido (*New → Blueprint*).
3. **Frontend en Vercel** (raíz `frontend`, framework Vite):
   - Variable: `VITE_API_URL=https://<tu-api>.onrender.com/api`
   - `vercel.json` ya redirige las rutas de React Router a `index.html`.

> El repositorio **no** debe contener `.env`; solo `.env.example`.
