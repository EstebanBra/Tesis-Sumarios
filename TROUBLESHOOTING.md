# Guía de Solución de Problemas

## Problemas Resueltos

### Timeouts Intermitentes en Peticiones al Backend

#### Problema

Las peticiones al backend a veces no se resolvían, causando timeouts especialmente cuando se usaba la VPN.

#### Causa Raíz

1. **Configuración de red VPN incorrecta**: El backend usando `network_mode: service:vpn` no estaba accesible de manera confiable desde otros servicios
2. **Falta de timeouts en nginx**: Sin configuración explícita de timeouts, las peticiones podían quedar colgadas indefinidamente
3. **Healthchecks inadecuados**: El healthcheck del backend no validaba correctamente la disponibilidad del servicio detrás de la VPN

#### Soluciones Implementadas

##### 1. Mejorada la configuración de la VPN

- Se agregó `HTTPPROXY=on` para mejor manejo de conexiones HTTP
- Se cambió `HEALTH_TARGET_ADDRESSES` a `localhost:3000` para validar el backend
- Se agregó un healthcheck robusto con `wget` en el contenedor VPN

##### 2. Timeouts optimizados en Nginx

En `frontend/nginx.conf`:

```nginx
proxy_connect_timeout 30s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_next_upstream_tries 2;
proxy_next_upstream_timeout 30s;
```

##### 3. Healthchecks mejorados

- Backend con `wget` en lugar de Node.js HTTP
- Timeout aumentado a 10s (antes 3s)
- Start period aumentado a 60s (antes 40s) para dar tiempo a la VPN

##### 4. Redes correctamente configuradas

- Backend ahora expone el puerto 3000 explícitamente
- Backend conectado a `app-network` para comunicación interna
- VPN con alias `backend` en la red para accesibilidad

## Diagnóstico de Problemas

### Verificar estado de los servicios

```bash
# Ver estado de todos los contenedores
docker compose -f docker-compose.prod.yml -f docker-compose.prod.vpn.yml ps

# Ver logs del backend
docker logs app-backend -f

# Ver logs de la VPN
docker logs app-vpn -f

# Ver logs de nginx
docker logs app-frontend -f
```

### Probar conectividad

#### Desde el host

```powershell
# Probar el frontend
curl http://localhost/health

# Probar el backend a través del frontend
curl http://localhost/api/health
```

#### Desde dentro del contenedor VPN

```bash
# Probar conexión al backend
docker exec -it app-vpn wget -O- http://localhost:3000/health

# Probar conexión a la base de datos externa
docker exec -it app-vpn nc -zv sistemas.dci.ubiobio.cl 1433

# Ver estado de la VPN
docker exec -it app-vpn cat /tmp/gluetun/ip
```

#### Desde el contenedor frontend

```bash
# Probar conexión al backend
docker exec -it app-frontend wget -O- http://backend:3000/health
```

### Monitorear healthchecks

```bash
# Ver estado detallado de healthchecks
docker inspect app-backend | grep -A 10 Health
docker inspect app-vpn | grep -A 10 Health
```

## Mejores Prácticas

### Al desplegar cambios

1. Reconstruir siempre con `--build` para asegurar cambios
2. Verificar que todos los servicios estén "healthy" antes de usar
3. Revisar logs iniciales de cada servicio

### Si hay problemas de conectividad

1. Verificar que la VPN esté "healthy"
2. Probar conectividad desde el contenedor VPN
3. Revisar logs de nginx para errores de proxy
4. Verificar que el backend responda en su healthcheck

### Configuración de timeouts

- **Peticiones normales**: 60s debería ser suficiente
- **Peticiones pesadas**: Considerar aumentar en nginx si se requiere
- **WebSockets**: Los timeouts de nginx no afectan conexiones WebSocket una vez establecidas

## Comandos Útiles

```bash
# Reiniciar solo el backend
docker compose -f docker-compose.prod.yml -f docker-compose.prod.vpn.yml restart backend

# Reiniciar la VPN y el backend
docker compose -f docker-compose.prod.yml -f docker-compose.prod.vpn.yml restart vpn backend

# Ver métricas de uso
docker stats

# Limpiar todo y empezar de cero
docker compose -f docker-compose.prod.yml -f docker-compose.prod.vpn.yml down
docker compose -f docker-compose.prod.yml -f docker-compose.prod.vpn.yml up -d --build
```

## Monitoreo Continuo

### Verificar logs de forma regular

```bash
# Últimas 100 líneas de todos los servicios
docker compose -f docker-compose.prod.yml -f docker-compose.prod.vpn.yml logs --tail=100

# Seguir logs en tiempo real con filtro
docker compose -f docker-compose.prod.yml -f docker-compose.prod.vpn.yml logs -f | grep -i error
```

### Alertas de problemas comunes

- **"Connection refused"**: El servicio destino no está escuchando
- **"Connection timeout"**: El servicio no es accesible en la red
- **"Gateway timeout"**: El backend tardó más de lo esperado
- **"VPN tunnel down"**: La VPN perdió conexión
