#!/bin/bash

# Script para configurar MinIO en producción (Linux)
# Este script descarga, configura e inicia MinIO como servicio en segundo plano

set -e  # Salir si hay algún error

echo "========================================"
echo "Configuración de MinIO para Producción"
echo "========================================"

# Variables de configuración
MINIO_VERSION="RELEASE.2024-12-13T18-00-19Z"
MINIO_USER="minio"
MINIO_GROUP="minio"
MINIO_HOME="/opt/minio"
MINIO_DATA_DIR="/var/lib/minio/data"
MINIO_CONFIG_DIR="/etc/minio"
MINIO_BINARY="/usr/local/bin/minio"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    print_error "Este script debe ejecutarse como root (usa sudo)"
    exit 1
fi

print_info "Verificando dependencias..."

# Verificar si wget o curl están disponibles
if command -v wget &> /dev/null; then
    DOWNLOAD_CMD="wget -O"
elif command -v curl &> /dev/null; then
    DOWNLOAD_CMD="curl -L -o"
else
    print_error "Se requiere wget o curl para descargar MinIO"
    exit 1
fi

# Crear usuario y grupo de MinIO si no existen
if ! id "$MINIO_USER" &>/dev/null; then
    print_info "Creando usuario: $MINIO_USER"
    useradd -r -s /bin/false $MINIO_USER
else
    print_info "Usuario $MINIO_USER ya existe"
fi

# Crear directorios necesarios
print_info "Creando directorios..."
mkdir -p $MINIO_HOME
mkdir -p $MINIO_DATA_DIR
mkdir -p $MINIO_CONFIG_DIR

# Descargar MinIO si no existe
if [ ! -f "$MINIO_BINARY" ]; then
    print_info "Descargando MinIO versión $MINIO_VERSION..."
    
    ARCH=$(uname -m)
    if [ "$ARCH" = "x86_64" ]; then
        MINIO_URL="https://dl.min.io/server/minio/release/linux-amd64/archive/minio.${MINIO_VERSION}"
    elif [ "$ARCH" = "aarch64" ]; then
        MINIO_URL="https://dl.min.io/server/minio/release/linux-arm64/archive/minio.${MINIO_VERSION}"
    else
        print_error "Arquitectura no soportada: $ARCH"
        exit 1
    fi
    
    $DOWNLOAD_CMD $MINIO_BINARY $MINIO_URL
    
    if [ $? -ne 0 ]; then
        print_error "Error al descargar MinIO"
        exit 1
    fi
    
    chmod +x $MINIO_BINARY
    print_info "MinIO descargado en: $MINIO_BINARY"
else
    print_info "MinIO ya está instalado en: $MINIO_BINARY"
fi

# Configurar permisos
print_info "Configurando permisos..."
chown -R $MINIO_USER:$MINIO_GROUP $MINIO_DATA_DIR
chown -R $MINIO_USER:$MINIO_GROUP $MINIO_CONFIG_DIR
chmod 755 $MINIO_DATA_DIR
chmod 755 $MINIO_CONFIG_DIR

# Crear archivo de configuración de entorno
print_info "Creando archivo de configuración..."
cat > $MINIO_CONFIG_DIR/minio.env << EOF
# Configuración de MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_VOLUMES="$MINIO_DATA_DIR"
MINIO_OPTS="--console-address :9001"
EOF

chown $MINIO_USER:$MINIO_GROUP $MINIO_CONFIG_DIR/minio.env
chmod 600 $MINIO_CONFIG_DIR/minio.env

# Crear script de inicio
print_info "Creando script de inicio..."
cat > /etc/systemd/system/minio.service << EOF
[Unit]
Description=MinIO Object Storage
After=network.target

[Service]
Type=simple
User=$MINIO_USER
Group=$MINIO_GROUP
EnvironmentFile=$MINIO_CONFIG_DIR/minio.env
ExecStart=$MINIO_BINARY server \$MINIO_VOLUMES \$MINIO_OPTS
Restart=always
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

# Crear bucket inicial (script auxiliar)
print_info "Creando script para inicializar bucket..."
cat > $MINIO_HOME/create-bucket.sh << 'SCRIPT'
#!/bin/bash
# Script para crear el bucket evidencia-denuncias
# Debe ejecutarse después de iniciar MinIO

sleep 5  # Esperar a que MinIO esté listo

MC_BINARY="/usr/local/bin/mc"
MINIO_ENDPOINT="${1:-localhost:9000}"
MINIO_USER="${2:-minioadmin}"
MINIO_PASSWORD="${3:-minioadmin}"
BUCKET_NAME="${4:-evidencia-denuncias}"

# Descargar mc (MinIO Client) si no existe
if [ ! -f "$MC_BINARY" ]; then
    echo "Descargando MinIO Client..."
    curl -L -o $MC_BINARY https://dl.min.io/client/mc/release/linux-amd64/mc
    chmod +x $MC_BINARY
fi

# Configurar alias
$MC_BINARY alias set myminio http://$MINIO_ENDPOINT $MINIO_USER $MINIO_PASSWORD

# Crear bucket si no existe
$MC_BINARY mb myminio/$BUCKET_NAME --ignore-existing

# Configurar política (solo descarga, no público)
$MC_BINARY anonymous set download myminio/$BUCKET_NAME

echo "Bucket '$BUCKET_NAME' creado exitosamente"
SCRIPT

chmod +x $MINIO_HOME/create-bucket.sh

# Recargar systemd y habilitar servicio
print_info "Configurando servicio systemd..."
systemctl daemon-reload
systemctl enable minio.service

print_info "========================================"
print_info "Configuración completada"
print_info "========================================"
echo ""
print_info "Para iniciar MinIO, ejecuta:"
echo "  sudo systemctl start minio"
echo ""
print_info "Para ver el estado:"
echo "  sudo systemctl status minio"
echo ""
print_info "Para ver los logs:"
echo "  sudo journalctl -u minio -f"
echo ""
print_warn "IMPORTANTE: Cambia las credenciales por defecto en:"
echo "  $MINIO_CONFIG_DIR/minio.env"
echo ""
print_info "Después de iniciar, ejecuta el script para crear el bucket:"
echo "  sudo $MINIO_HOME/create-bucket.sh [endpoint] [user] [password] [bucket-name]"
echo ""

