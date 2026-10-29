# Despliegue de Citas Médicas con Docker, GitHub Actions y OCI

Esta solución publica dos imágenes en Docker Hub: frontend Next.js y API NestJS. En OCI, Nginx sirve el frontend por el puerto 80 y enruta `/backend/` a la API. Así el navegador accede a ambos servicios usando la misma IP pública. Supabase sigue siendo el servicio de base de datos externo.

## 1. Preparar Docker Hub y GitHub Actions

1. Crea en Docker Hub un access token con permiso de lectura y escritura.
2. En GitHub abre **Settings → Secrets and variables → Actions** y crea estos repository secrets:
   - `DOCKERHUB_USERNAME`: usuario de Docker Hub.
   - `DOCKERHUB_TOKEN`: access token de Docker Hub.
3. En la pestaña **Variables** crea:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave pública anon del proyecto.
4. Sube los archivos del despliegue a la rama `main`. En **Actions**, abre “Publicar imágenes en Docker Hub” y confirma que termine correctamente.
5. En Docker Hub comprueba que se publicaron `citasmedicas-frontend` y `citasmedicas-backend`, con etiquetas `latest` y el SHA del commit.

La clave `SUPABASE_SERVICE_ROLE_KEY` nunca se configura como variable `NEXT_PUBLIC_*`, ni se incluye en la imagen frontend.

## 2. Probar en Docker Desktop

En la carpeta raíz del repositorio, crea `.env.docker` copiando `.env.docker.example` y completa sus valores. No compartas ni subas ese archivo.

```powershell
docker compose --env-file .env.docker -f compose.yaml -f compose.local.yaml up --build -d
docker compose --env-file .env.docker -f compose.yaml -f compose.local.yaml ps
```

Abre `http://localhost` y verifica la API en `http://localhost/backend/api/health`. En Docker Desktop, captura los contenedores `frontend`, `backend` y `gateway` en ejecución. Para detenerlos:

```powershell
docker compose --env-file .env.docker -f compose.yaml -f compose.local.yaml down
```

## 3. Crear manualmente la VM de OCI

En la consola de OCI crea una instancia **Ubuntu 24.04**, asigna una IP pública y conserva la clave SSH privada. En la subnet o Network Security Group agrega reglas de entrada:

| Protocolo/puerto | Origen | Uso |
| --- | --- | --- |
| TCP 22 | Tu IP pública `/32` | Administración SSH |
| TCP 80 | `0.0.0.0/0` | Sitio web y proxy de API |

Guarda capturas de la página de creación de la instancia y de su IP pública. Conéctate desde tu equipo:

```bash
ssh -i <ruta-a-tu-clave.pem> ubuntu@<IP_PUBLICA>
```

## 4. Instalar Docker en la VM Ubuntu

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw --force enable
docker --version
docker compose version
```

## 5. Descargar y ejecutar las imágenes en OCI

Descarga el repositorio para obtener `compose.yaml` y la configuración de Nginx. Esto no construye imágenes en la VM: los siguientes comandos las descargan desde Docker Hub.

```bash
git clone --depth 1 --branch main https://github.com/marcos7-eri/PrpeyctoCitasMedicas.git
cd PrpeyctoCitasMedicas
```

Crea `.env.docker` en la VM con el usuario de Docker Hub y las variables del backend. No escribas valores secretos en la terminal compartida ni los publiques en capturas:

```bash
nano .env.docker
chmod 600 .env.docker
```

Contenido requerido:

```dotenv
DOCKERHUB_USERNAME=tu_usuario_dockerhub
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
GROQ_API_KEY=tu_groq_api_key_si_aplica
```

Autentícate con el token de Docker Hub cuando Docker lo solicite, descarga ambas imágenes y levanta los servicios:

```bash
sudo docker login --username <usuario_dockerhub>
sudo docker compose --env-file .env.docker pull
sudo docker compose --env-file .env.docker up -d
sudo docker compose --env-file .env.docker ps
sudo docker compose --env-file .env.docker logs --tail=80
```

En Docker Hub puede configurarse el repositorio como público para omitir el inicio de sesión al descargar. Si es privado, la VM necesita iniciar sesión. Para actualizar tras otra publicación desde `main`:

```bash
sudo docker compose --env-file .env.docker pull
sudo docker compose --env-file .env.docker up -d
```

## 6. Evidencia final

Desde un navegador abre `http://<IP_PUBLICA>` y verifica la interfaz. Comprueba también `http://<IP_PUBLICA>/backend/api/health`. Captura:

1. Docker Desktop mostrando los contenedores locales activos.
2. GitHub Actions con el workflow completado y Docker Hub mostrando las imágenes publicadas.
3. La consola OCI con la VM y su IP pública.
4. La terminal SSH mostrando `docker compose ps` con servicios activos y los comandos de descarga.
5. La aplicación web abierta desde la IP pública.

No incluyas tokens, claves Supabase ni archivos `.env` en las capturas.
