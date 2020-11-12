# Lighthouse CI

Genera una media del número de lanzamientos.

## ¿Cómo ejecutar?

Primero hay que instalar los módulos.

```bash
npm install
```

## Lanzar medición.

```bash
npm run start -- --url=https://example.com
```

## Lanzar medición con un número de intentos

```bash
npm run start -- --url=https://example.com --numberOfRuns=2
```

Esto creará un fichero `results.json` bajo la carpeta `.lighthouseci`
