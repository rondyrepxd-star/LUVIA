# Luvia - Advanced Study App

Este es tu asistente de estudio de alto rendimiento impulsado por IA.

## 🚀 Despliegue en Vercel

Para que Luvia funcione correctamente en Vercel, debes añadir la siguiente Variable de Entorno:

1. **Key**: `GOOGLE_GENAI_API_KEY`
2. **Value**: (Tu API Key de Google AI Studio que empieza por `AIza...`)

## 🛠️ Cómo guardar tu versión en un solo commit (Limpieza total)

Si quieres limpiar el historial de cambios y subir todo como un único commit profesional a tu rama `main`, ejecuta el siguiente bloque de comandos (puedes darle al botón de **"Play/Triangulito"** en la esquina superior derecha del bloque):

```bash
git checkout --orphan latest_branch
git add -A
git commit -am "nuevo inicio"
git branch -D main
git branch -m main
git push -f origin main
```

> **Nota:** El comando `git push -f` sobrescribirá el historial en GitHub. Úsalo solo cuando quieras una versión "limpia" definitiva.

## Características destacadas
- **Smart Import**: Carga archivos .docx y el sistema detectará automáticamente las preguntas y sus respuestas correctas.
- **Modo Reveal**: Ejercicios de memoria con control por teclado (Flechas) y pistas de audio.
- **Blacklist Dinámica**: Protocolo de seguridad para filtrar términos no deseados en tiempo real.
- **Organización IA**: Transforma texto plano en cuadernos profesionales con tablas y emojis.

---
*Nota: El botón de "Play" en los bloques de código arriba ejecutará los comandos directamente en tu terminal.*
