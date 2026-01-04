# Guía de Formato y Linting

Este proyecto utiliza **ESLint** y **Prettier** para mantener un código consistente y evitar conflictos de merge.

## 🎯 Configuración

### Herramientas
- **Prettier**: Formateo automático de código
- **ESLint**: Detección de problemas y buenas prácticas
- **EditorConfig**: Configuración consistente entre editores

### Archivos de configuración
- `.prettierrc` - Configuración de Prettier
- `.editorconfig` - Configuración del editor
- `frontend/eslint.config.js` - ESLint para frontend (TypeScript/React)
- `backend/eslint.config.js` - ESLint para backend (JavaScript)

## 📝 Scripts Disponibles

### Frontend (`frontend/package.json`)

```bash
cd frontend

# Formatear código
npm run format

# Verificar formato sin modificar
npm run format:check

# Ejecutar ESLint
npm run lint

# Corregir problemas de ESLint automáticamente
npm run lint:fix

# Formatear y corregir lint en un solo comando
npm run format:lint

# Validar formato y lint (sin modificar)
npm run validate
```

### Backend (`backend/package.json`)

```bash
cd backend

# Formatear código
npm run format

# Verificar formato sin modificar
npm run format:check

# Ejecutar ESLint
npm run lint

# Corregir problemas de ESLint automáticamente
npm run lint:fix

# Formatear y corregir lint en un solo comando
npm run format:lint

# Validar formato y lint (sin modificar)
npm run validate
```

### Formatear Todo el Proyecto

#### Linux/Mac:
```bash
./format-all.sh
```

#### Windows:
```cmd
format-all.bat
```

#### Solo verificar (sin modificar):
```bash
./format-all.sh --check
# o en Windows:
format-all.bat --check
```

## 🔧 Configuración del Editor

### VS Code

1. Instala las extensiones recomendadas:
   - **Prettier - Code formatter** (`esbenp.prettier-vscode`)
   - **ESLint** (`dbaeumer.vscode-eslint`)
   - **EditorConfig for VS Code** (`EditorConfig.EditorConfig`)

2. El archivo `.vscode/settings.json` ya está configurado para:
   - Formatear automáticamente al guardar
   - Corregir problemas de ESLint al guardar
   - Usar Prettier como formateador predeterminado

### Otras IDEs

- **WebStorm/IntelliJ**: Configura Prettier como formateador externo y activa "On save"
- **Sublime Text**: Instala el paquete `JsPrettier`

## 📋 Reglas de Formato

### Prettier
- **Indentación**: 2 espacios
- **Comillas**: Simple en JS/TS (`'texto'`), doble en JSX (`"texto"`)
- **Ancho de línea**: 100 caracteres
- **Punto y coma**: Sí (`;`)
- **Final de línea**: LF (Unix)

### ESLint
- Variables no usadas que empiezan con `_` se ignoran
- `console.log` está deshabilitado (usa `console.warn` o `console.error`)
- Reglas de TypeScript estrictas activadas
- Reglas de React Hooks activadas

## 🚀 Flujo de Trabajo Recomendado

1. **Antes de hacer commit:**
   ```bash
   # Opción 1: Script para todo el proyecto
   ./format-all.sh

   # Opción 2: Manualmente
   cd frontend && npm run format:lint
   cd ../backend && npm run format:lint
   ```

2. **En tu editor:**
   - Guarda los archivos con `Ctrl+S` (o `Cmd+S` en Mac)
   - El código se formateará automáticamente

3. **Antes de hacer merge:**
   ```bash
   # Verificar que todo esté bien
   ./format-all.sh --check
   ```

## 🔍 Solución de Problemas

### Prettier no formatea al guardar
- Verifica que la extensión de Prettier esté instalada en VS Code
- Asegúrate de que `editor.formatOnSave` esté en `true` en `.vscode/settings.json`
- Reinicia VS Code

### ESLint muestra errores que no puedo corregir
- Ejecuta `npm run lint:fix` para corregir automáticamente
- Si persisten, pueden ser errores que requieren atención manual

### Conflicto entre Prettier y ESLint
- `eslint-config-prettier` está configurado para deshabilitar reglas de formato en ESLint
- Prettier se encarga del formato, ESLint de la calidad del código

## 📚 Recursos

- [Documentación de Prettier](https://prettier.io/docs/en/)
- [Documentación de ESLint](https://eslint.org/docs/latest/)
- [EditorConfig](https://editorconfig.org/)

## ✅ Checklist Pre-Commit

Antes de hacer commit, asegúrate de:
- [ ] Ejecutar `npm run format` en frontend y backend
- [ ] Ejecutar `npm run lint` y corregir errores
- [ ] Verificar que no hay conflictos de merge
- [ ] Probar que el proyecto compila correctamente

